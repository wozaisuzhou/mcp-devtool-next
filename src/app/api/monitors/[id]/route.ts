import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// DELETE /api/monitors/:id?userEmail=...
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userEmail = req.nextUrl.searchParams.get('userEmail')?.trim()
  if (!userEmail) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })

  const { error } = await db
    .from('monitors')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ success: true })
}
