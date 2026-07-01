import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

const PAGE_SIZE = 24

// GET /api/directory?q=&transport=&page=
export async function GET(req: NextRequest) {
  const q         = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const transport = req.nextUrl.searchParams.get('transport')?.trim() ?? ''
  const page      = Math.max(0, parseInt(req.nextUrl.searchParams.get('page') ?? '0'))

  let query = db
    .from('saved_sessions')
    .select('id, name, label, server_name, server_url, transport, tool_count, resource_count, prompt_count, public_description, user_email, saved_at, tools')
    .eq('is_public', true)
    .order('saved_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (q) {
    query = query.or(`name.ilike.%${q}%,server_name.ilike.%${q}%,public_description.ilike.%${q}%`)
  }
  if (transport) {
    query = query.eq('transport', transport)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  const entries = (data ?? []).map((s: any) => ({
    id:          s.id,
    name:        s.name,
    label:       s.label,
    serverName:  s.server_name,
    serverUrl:   s.server_url,
    transport:   s.transport,
    toolCount:   s.tool_count,
    resourceCount: s.resource_count,
    promptCount: s.prompt_count,
    description: s.public_description,
    publisher:   (s.user_email as string | null)?.split('@')[0] ?? 'anonymous',
    savedAt:     s.saved_at,
    toolNames:   ((s.tools as any[]) ?? []).slice(0, 12).map((t: any) => t.name as string),
  }))

  return NextResponse.json({ entries, page, hasMore: entries.length === PAGE_SIZE })
}
