import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import db from '@/lib/db'

function hashKey(raw: string) {
  return createHash('sha256').update(raw).digest('hex')
}

// GET /api/v1/keys?userEmail=...
export async function GET(req: NextRequest) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')?.trim()
  if (!userEmail) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })

  const { data, error } = await db
    .from('api_keys')
    .select('id, name, created_at, last_used_at')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ keys: data ?? [] })
}

// POST /api/v1/keys — generate a new API key
export async function POST(req: NextRequest) {
  const { userEmail, name } = await req.json()
  if (!userEmail?.trim()) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })

  const rawKey = `mcp_${randomBytes(32).toString('hex')}`
  const keyHash = hashKey(rawKey)

  const { data, error } = await db
    .from('api_keys')
    .insert({ user_email: userEmail.trim(), key_hash: keyHash, name: name?.trim() || 'Default' })
    .select('id, name, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ key: rawKey, meta: data })
}
