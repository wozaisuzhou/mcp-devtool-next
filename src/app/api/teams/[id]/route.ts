import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET /api/teams/[id]?userEmail=...  — team details + members (requester must be a member)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')
  if (!userEmail) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })

  try {
    // Verify membership
    const { data: membership } = await db
      .from('team_members')
      .select('role')
      .eq('team_id', params.id)
      .eq('user_email', userEmail)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 })

    const isOwner = membership.role === 'owner'

    const [{ data: team, error: teamErr }, { data: members, error: membersErr }] = await Promise.all([
      db.from('teams').select('id, name, owner_email, invite_code, created_at').eq('id', params.id).single(),
      db.from('team_members').select('user_email, role, joined_at').eq('team_id', params.id).order('joined_at'),
    ])

    if (teamErr) throw teamErr
    if (membersErr) throw membersErr

    let joinRequests: any[] = []
    if (isOwner) {
      const { data } = await db
        .from('team_join_requests')
        .select('id, user_email, requested_at')
        .eq('team_id', params.id)
        .eq('status', 'pending')
        .order('requested_at')
      joinRequests = data ?? []
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        ownerEmail: team.owner_email,
        ...(isOwner ? { inviteCode: team.invite_code } : {}),
        createdAt: team.created_at,
        myRole: membership.role,
        members: (members ?? []).map((m: any) => ({
          userEmail: m.user_email,
          role: m.role,
          joinedAt: m.joined_at,
        })),
        ...(isOwner ? {
          joinRequests: joinRequests.map((r: any) => ({
            id: r.id,
            userEmail: r.user_email,
            requestedAt: r.requested_at,
          })),
        } : {}),
      },
    })
  } catch (err) {
    console.error('[teams/:id GET]', err)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]?userEmail=...  — delete team (owner only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')
  if (!userEmail) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })

  try {
    const { data: team } = await db
      .from('teams')
      .select('owner_email')
      .eq('id', params.id)
      .maybeSingle()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (team.owner_email !== userEmail) return NextResponse.json({ error: 'Only the owner can delete this team' }, { status: 403 })

    const { error } = await db.from('teams').delete().eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[teams/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}

// PATCH /api/teams/[id]  — rename team (owner only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, userEmail } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    if (!userEmail) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })

    const { data: team } = await db
      .from('teams')
      .select('owner_email')
      .eq('id', params.id)
      .maybeSingle()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (team.owner_email !== userEmail) return NextResponse.json({ error: 'Only the owner can rename this team' }, { status: 403 })

    const { error } = await db.from('teams').update({ name: name.trim() }).eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[teams/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to rename team' }, { status: 500 })
  }
}
