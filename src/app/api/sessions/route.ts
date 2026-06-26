import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const serverUrl  = searchParams.get('serverUrl')
    const label      = searchParams.get('label')
    const userEmail  = searchParams.get('userEmail')
    const limit      = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    const cols = 'id, name, label, user_email, server_url, server_name, server_version, protocol_version, transport, tool_count, resource_count, prompt_count, trace_count, saved_at, team_id, teams(name)'

    // Fetch user's own sessions
    let ownQuery = db
      .from('saved_sessions')
      .select(cols)
      .order('saved_at', { ascending: false })
      .limit(limit)

    if (serverUrl) ownQuery = ownQuery.eq('server_url', serverUrl)
    if (label)     ownQuery = ownQuery.eq('label', label)
    if (userEmail) ownQuery = ownQuery.eq('user_email', userEmail)

    const { data: ownData, error: ownError } = await ownQuery
    if (ownError) throw ownError

    let teamSessions: any[] = []

    if (userEmail) {
      // Find teams this user belongs to
      const { data: memberships } = await db
        .from('team_members')
        .select('team_id, teams(id, name)')
        .eq('user_email', userEmail)

      const teamIds = (memberships ?? []).map((m: any) => m.team_id)

      if (teamIds.length > 0) {
        const { data: sharedData } = await db
          .from('saved_sessions')
          .select(cols + ', teams(name)')
          .in('team_id', teamIds)
          .order('saved_at', { ascending: false })
          .limit(limit)

        // Exclude sessions the user already owns (shared by themselves)
        const ownIds = new Set((ownData ?? []).map((s: any) => s.id))
        teamSessions = (sharedData ?? [])
          .filter((s: any) => !ownIds.has(s.id))
          .map((s: any) => ({ ...s, teamName: s.teams?.name ?? null }))
      }
    }

    const allSessions = [
      ...(ownData ?? []).map((s: any) => ({ ...s, teamName: s.teams?.name ?? null })),
      ...teamSessions,
    ].sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())
     .slice(0, limit)

    return NextResponse.json({ sessions: allSessions })
  } catch (err: unknown) {
    console.error('[sessions GET]', err)
    return NextResponse.json({ sessions: [], error: 'Database not available' })
  }
}
