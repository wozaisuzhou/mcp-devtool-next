import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// PATCH /api/sessions/:id/publish
// Body: { userEmail, isPublic, description? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })

  const { userEmail, isPublic, description } = await req.json()
  if (!userEmail?.trim()) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })

  // Verify ownership
  const { data: session } = await db
    .from('saved_sessions')
    .select('id, user_email')
    .eq('id', id)
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.user_email !== userEmail.trim()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const update: Record<string, unknown> = { is_public: !!isPublic }
  if (description !== undefined) update.public_description = description?.trim() || null

  const { error } = await db.from('saved_sessions').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ success: true, isPublic: !!isPublic })
}
