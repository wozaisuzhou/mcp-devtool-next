import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const { data } = await db
    .from('registered_users')
    .select('email, name, plan')
    .eq('email', email)
    .maybeSingle()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    email: data.email,
    name: data.name ?? undefined,
    plan: (data as Record<string, unknown>).plan ?? 'free',
  })
}
