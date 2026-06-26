import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// POST /api/teams/join  — request to join a team using its invite code
// Creates a pending join request; the owner must approve before the user becomes a member.
export async function POST(req: NextRequest) {
  try {
    const { userEmail, inviteCode } = await req.json()
    if (!userEmail?.trim()) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    if (!inviteCode?.trim()) return NextResponse.json({ error: 'inviteCode is required' }, { status: 400 })

    const { data: team } = await db
      .from('teams')
      .select('id, name, owner_email')
      .eq('invite_code', inviteCode.trim())
      .maybeSingle()

    if (!team) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

    // Reject if already a member
    const { data: existing } = await db
      .from('team_members')
      .select('role')
      .eq('team_id', team.id)
      .eq('user_email', userEmail.trim())
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'You are already a member of this team' }, { status: 409 })

    // Check for existing pending request
    const { data: existingRequest } = await db
      .from('team_join_requests')
      .select('status')
      .eq('team_id', team.id)
      .eq('user_email', userEmail.trim())
      .maybeSingle()

    if (existingRequest?.status === 'pending') {
      return NextResponse.json({ error: 'You already have a pending request for this team' }, { status: 409 })
    }

    // Upsert the join request (handles rejected → re-request)
    const { error } = await db
      .from('team_join_requests')
      .upsert(
        { team_id: team.id, user_email: userEmail.trim(), status: 'pending', requested_at: new Date().toISOString() },
        { onConflict: 'team_id,user_email' }
      )

    if (error) throw error

    return NextResponse.json({ pending: true, teamName: team.name })
  } catch (err) {
    console.error('[teams/join POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to request join' }, { status: 500 })
  }
}
