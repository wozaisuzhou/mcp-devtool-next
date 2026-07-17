import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function requireRegisteredUser(req: NextRequest): Promise<boolean> {
  const email = req.nextUrl.searchParams.get('userEmail')?.trim().toLowerCase()
  if (!email) return false

  const { data } = await db
    .from('registered_users')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  return !!data
}
