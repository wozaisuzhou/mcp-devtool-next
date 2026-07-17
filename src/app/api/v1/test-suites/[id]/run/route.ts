import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import db from '@/lib/db'
import { runSuite } from '@/lib/ci-runner'
import { assertPublicMcpUrl } from '@/lib/ssrf-guard'

async function resolveApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const raw = authHeader.slice(7).trim()
  const hash = createHash('sha256').update(raw).digest('hex')

  const { data } = await db
    .from('api_keys')
    .select('id, user_email')
    .eq('key_hash', hash)
    .maybeSingle()

  if (!data) return null

  // Fire-and-forget last_used_at update
  db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)

  return data.user_email
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const userEmail = await resolveApiKey(req.headers.get('authorization'))
  if (!userEmail) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })

  const body = await req.json()
  const { serverUrl, transport = 'auto', authToken } = body as {
    serverUrl: string
    transport?: 'http-sse' | 'auto'
    authToken?: string
  }
  if (!serverUrl?.trim()) return NextResponse.json({ error: 'serverUrl is required' }, { status: 400 })

  const { data: suite } = await db
    .from('test_suites')
    .select('id, name, cases, user_email')
    .eq('id', id)
    .maybeSingle()

  if (!suite) return NextResponse.json({ error: 'Suite not found' }, { status: 404 })
  if (suite.user_email !== userEmail) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await assertPublicMcpUrl(serverUrl.trim())
    const result = await runSuite(suite.cases ?? [], serverUrl.trim(), transport, authToken)
    return NextResponse.json({ suiteId: suite.id, suiteName: suite.name, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Run failed' },
      { status: 500 }
    )
  }
}
