import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

async function verifyOwner(teamId: string, userEmail: string) {
  const { data: team } = await db
    .from('teams')
    .select('owner_email')
    .eq('id', teamId)
    .maybeSingle()
  if (!team) return { error: 'Team not found', status: 404 }
  if (team.owner_email !== userEmail) return { error: 'Only the owner can manage join requests', status: 403 }
  return { ok: true }
}

// GET /api/teams/[id]/requests?userEmail=...  — list pending join requests (owner only)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')
  if (!userEmail) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })

  const check = await verifyOwner(params.id, userEmail)
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status })

  const { data, error } = await db
    .from('team_join_requests')
    .select('id, user_email, requested_at')
    .eq('team_id', params.id)
    .eq('status', 'pending')
    .order('requested_at')

  if (error) return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })

  return NextResponse.json({
    requests: (data ?? []).map((r: any) => ({
      id: r.id,
      userEmail: r.user_email,
      requestedAt: r.requested_at,
    })),
  })
}

// POST /api/teams/[id]/requests  — approve or reject a join request (owner only)
// Body: { ownerEmail, requestId, action: 'approve' | 'reject' }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { ownerEmail, requestId, action } = await req.json()
    if (!ownerEmail || !requestId || !action) {
      return NextResponse.json({ error: 'ownerEmail, requestId, and action are required' }, { status: 400 })
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    const check = await verifyOwner(params.id, ownerEmail)
    if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status })

    const { data: joinReq } = await db
      .from('team_join_requests')
      .select('id, user_email, status')
      .eq('id', requestId)
      .eq('team_id', params.id)
      .maybeSingle()

    if (!joinReq) return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    if (joinReq.status !== 'pending') return NextResponse.json({ error: 'Request already resolved' }, { status: 409 })

    // Update request status
    const { error: updateErr } = await db
      .from('team_join_requests')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', requestId)

    if (updateErr) throw updateErr

    // On approval, add the user as a team member
    if (action === 'approve') {
      const { error: memberErr } = await db
        .from('team_members')
        .upsert(
          { team_id: params.id, user_email: joinReq.user_email, role: 'member' },
          { onConflict: 'team_id,user_email' }
        )
      if (memberErr) throw memberErr
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[teams/:id/requests POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to process request' }, { status: 500 })
  }
}
