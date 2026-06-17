import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const serverUrl  = searchParams.get('serverUrl')
    const label      = searchParams.get('label')
    const userEmail  = searchParams.get('userEmail')
    const limit      = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    let query = db
      .from('saved_sessions')
      .select('id, name, label, user_email, server_url, server_name, server_version, protocol_version, transport, tool_count, resource_count, prompt_count, trace_count, saved_at')
      .order('saved_at', { ascending: false })
      .limit(limit)

    if (serverUrl)  query = query.eq('server_url', serverUrl)
    if (label)      query = query.eq('label', label)
    if (userEmail)  query = query.eq('user_email', userEmail)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ sessions: data ?? [] })
  } catch (err: unknown) {
    console.error('[sessions GET]', err)
    // Return empty list so the UI doesn't crash when DB isn't configured yet
    return NextResponse.json({ sessions: [], error: 'Database not available' })
  }
}
