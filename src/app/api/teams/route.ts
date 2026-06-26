import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET /api/teams?userEmail=...  — list all teams the user belongs to
export async function GET(req: NextRequest) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')
  if (!userEmail) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })

  try {
    const { data, error } = await db
      .from('team_members')
      .select('role, joined_at, teams(id, name, owner_email, invite_code, created_at)')
      .eq('user_email', userEmail)

    if (error) throw error

    const teams = (data ?? []).map((row: any) => ({
      id: row.teams.id,
      name: row.teams.name,
      ownerEmail: row.teams.owner_email,
      // only expose invite code to the owner
      ...(row.role === 'owner' ? { inviteCode: row.teams.invite_code } : {}),
      createdAt: row.teams.created_at,
      myRole: row.role,
    }))

    return NextResponse.json({ teams })
  } catch (err) {
    console.error('[teams GET]', err)
    return NextResponse.json({ teams: [], error: 'Database not available' })
  }
}

// POST /api/teams  — create a new team (caller becomes owner + first member)
export async function POST(req: NextRequest) {
  try {
    const { name, ownerEmail } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    if (!ownerEmail?.trim()) return NextResponse.json({ error: 'ownerEmail is required' }, { status: 400 })

    const { data: team, error: teamErr } = await db
      .from('teams')
      .insert({ name: name.trim(), owner_email: ownerEmail.trim() })
      .select('id, name, owner_email, invite_code, created_at')
      .single()

    if (teamErr) throw teamErr

    // Add owner as a member with role 'owner'
    const { error: memberErr } = await db
      .from('team_members')
      .insert({ team_id: team.id, user_email: ownerEmail.trim(), role: 'owner' })

    if (memberErr) throw memberErr

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        ownerEmail: team.owner_email,
        inviteCode: team.invite_code,
        createdAt: team.created_at,
        myRole: 'owner',
      },
    })
  } catch (err) {
    console.error('[teams POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create team' }, { status: 500 })
  }
}
