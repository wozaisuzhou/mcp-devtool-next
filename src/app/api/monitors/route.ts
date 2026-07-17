import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { assertPublicMcpUrl } from '@/lib/ssrf-guard'

// GET /api/monitors?userEmail=...
export async function GET(req: NextRequest) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')?.trim()
  if (!userEmail) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })

  const { data, error } = await db
    .from('monitors')
    .select('id, session_id, interval_hours, notify_email, webhook_url, last_checked_at, last_status, last_diff')
    .eq('user_email', userEmail)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ monitors: data ?? [] })
}

// POST /api/monitors
export async function POST(req: NextRequest) {
  const { userEmail, sessionId, intervalHours = 24, notifyEmail = true, webhookUrl } = await req.json()
  if (!userEmail?.trim() || !sessionId?.trim()) {
    return NextResponse.json({ error: 'userEmail and sessionId are required' }, { status: 400 })
  }

  // Verify the caller can see this session (owner, or a member of the team it's shared with)
  const { data: session } = await db
    .from('saved_sessions')
    .select('id, user_email, team_id')
    .eq('id', sessionId.trim())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  let canAccessSession = session.user_email === userEmail.trim()
  if (!canAccessSession && session.team_id) {
    const { data: membership } = await db
      .from('team_members')
      .select('team_id')
      .eq('team_id', session.team_id)
      .eq('user_email', userEmail.trim())
      .maybeSingle()
    canAccessSession = !!membership
  }
  if (!canAccessSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (webhookUrl?.trim()) {
    try {
      await assertPublicMcpUrl(webhookUrl.trim())
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid webhook URL' }, { status: 400 })
    }
  }

  // Only one monitor per session per user
  const { data: existing } = await db
    .from('monitors')
    .select('id')
    .eq('user_email', userEmail.trim())
    .eq('session_id', sessionId.trim())
    .maybeSingle()

  if (existing) return NextResponse.json({ monitor: existing })

  const { data, error } = await db
    .from('monitors')
    .insert({
      user_email: userEmail.trim(),
      session_id: sessionId.trim(),
      interval_hours: intervalHours,
      notify_email: notifyEmail,
      webhook_url: webhookUrl?.trim() || null,
    })
    .select('id, session_id, interval_hours, notify_email, webhook_url, last_checked_at, last_status')
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ monitor: data })
}
