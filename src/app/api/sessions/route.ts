import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const serverUrl  = searchParams.get('serverUrl')
    const label      = searchParams.get('label')
    const userEmail  = searchParams.get('userEmail')
    const limit      = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    const cols = 'id, name, label, user_email, server_url, server_name, server_version, protocol_version, transport, tool_count, resource_count, prompt_count, trace_count, saved_at, team_id, is_public'

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
    let teamNameMap = new Map<string, string>()

    if (userEmail) {
      // Find teams this user belongs to (simple select — no join to avoid PostgREST issues)
      const { data: memberships } = await db
        .from('team_members')
        .select('team_id')
        .eq('user_email', userEmail)

      const teamIds = (memberships ?? []).map((m: any) => m.team_id)

      // Collect all team IDs we need names for (own shared sessions + member sessions)
      const ownTeamIds = (ownData ?? []).map((s: any) => s.team_id).filter(Boolean)
      const allTeamIds = [...new Set([...teamIds, ...ownTeamIds])]

      // Fetch team names in one flat query
      if (allTeamIds.length > 0) {
        const { data: teamRows } = await db
          .from('teams')
          .select('id, name')
          .in('id', allTeamIds)
        teamNameMap = new Map((teamRows ?? []).map((t: any) => [t.id as string, t.name as string]))
      }

      if (teamIds.length > 0) {
        const { data: sharedData } = await db
          .from('saved_sessions')
          .select(cols)
          .in('team_id', teamIds)
          .order('saved_at', { ascending: false })
          .limit(limit)

        // Exclude sessions the user already owns (shared by themselves)
        const ownIds = new Set((ownData ?? []).map((s: any) => s.id))
        teamSessions = (sharedData ?? [])
          .filter((s: any) => !ownIds.has(s.id))
          .map((s: any) => ({ ...s, teamName: teamNameMap.get(s.team_id) ?? null }))
      }
    }

    // Attach teamName to own sessions (so the badge shows for the owner too)
    const ownWithTeamName = (ownData ?? []).map((s: any) => ({
      ...s,
      teamName: s.team_id ? (teamNameMap.get(s.team_id) ?? null) : null,
    }))

    const allSessions = [...ownWithTeamName, ...teamSessions]
      .sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())
      .slice(0, limit)

    return NextResponse.json({ sessions: allSessions })
  } catch (err: unknown) {
    console.error('[sessions GET]', err)
    return NextResponse.json({ sessions: [], error: 'Database not available' })
  }
}
