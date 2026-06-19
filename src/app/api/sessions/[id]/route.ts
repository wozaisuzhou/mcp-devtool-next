import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
  }
  try {
    const { data, error } = await db
      .from('saved_sessions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    return NextResponse.json({ session: data })
  } catch (err: unknown) {
    console.error('[sessions/:id GET]', err)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
  }
  try {
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
