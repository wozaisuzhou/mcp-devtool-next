import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function canAccessSession(session: { user_email: string | null; team_id: string | null; is_public: boolean | null }, userEmail: string | null) {
  if (session.is_public) return true
  if (!userEmail) return false
  if (session.user_email === userEmail) return true
  if (session.team_id) {
    const { data: membership } = await db
      .from('team_members')
      .select('team_id')
      .eq('team_id', session.team_id)
      .eq('user_email', userEmail)
      .maybeSingle()
    if (membership) return true
  }
  return false
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
  }
  const userEmail = req.nextUrl.searchParams.get('userEmail')?.trim() || null
  try {
    const { data, error } = await db
      .from('saved_sessions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    if (!(await canAccessSession(data, userEmail))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ session: data })
  } catch (err: unknown) {
    console.error('[sessions/:id GET]', err)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
  }
  const userEmail = req.nextUrl.searchParams.get('userEmail')?.trim()
  if (!userEmail) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })

  try {
    const { data: session } = await db
      .from('saved_sessions')
      .select('user_email')
      .eq('id', params.id)
      .maybeSingle()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.user_email !== userEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await db
      .from('saved_sessions')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[sessions/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
