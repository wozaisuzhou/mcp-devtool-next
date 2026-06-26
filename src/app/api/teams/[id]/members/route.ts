import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// POST /api/teams/[id]/members  — invite a member by email (owner only)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { ownerEmail, inviteeEmail } = await req.json()
    if (!ownerEmail || !inviteeEmail) {
      return NextResponse.json({ error: 'ownerEmail and inviteeEmail are required' }, { status: 400 })
    }

    // Verify requester is owner
    const { data: team } = await db
      .from('teams')
      .select('owner_email')
      .eq('id', params.id)
      .maybeSingle()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (team.owner_email !== ownerEmail) return NextResponse.json({ error: 'Only the owner can invite members' }, { status: 403 })

    // Invitee must be a registered user
    const { data: invitee } = await db
      .from('registered_users')
      .select('email')
      .eq('email', inviteeEmail.trim().toLowerCase())
      .maybeSingle()

    if (!invitee) {
      return NextResponse.json({ error: 'No account found for that email. They must sign up first.' }, { status: 404 })
    }

    const { error } = await db
      .from('team_members')
      .upsert({ team_id: params.id, user_email: invitee.email, role: 'member' }, { onConflict: 'team_id,user_email' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[teams/:id/members POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to invite member' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]/members?userEmail=...&targetEmail=...
// Owner removes any member; member removes themselves (leave).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')
  const targetEmail = req.nextUrl.searchParams.get('targetEmail')

  if (!userEmail || !targetEmail) {
    return NextResponse.json({ error: 'userEmail and targetEmail are required' }, { status: 400 })
  }

  try {
    const { data: team } = await db
      .from('teams')
      .select('owner_email')
      .eq('id', params.id)
      .maybeSingle()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    const isOwner = team.owner_email === userEmail
    const isSelf = userEmail === targetEmail

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'You can only remove yourself or members if you are the owner' }, { status: 403 })
    }
    if (isOwner && targetEmail === team.owner_email) {
      return NextResponse.json({ error: 'Owner cannot leave the team. Delete the team instead.' }, { status: 400 })
    }

    const { error } = await db
      .from('team_members')
      .delete()
      .eq('team_id', params.id)
      .eq('user_email', targetEmail)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[teams/:id/members DELETE]', err)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
