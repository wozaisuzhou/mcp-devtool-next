import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: record } = await db
      .from('password_reset_tokens')
      .select('email, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await Promise.all([
      db.from('registered_users').update({ password_hash: passwordHash }).eq('email', record.email),
      db.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('token_hash', tokenHash),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/reset-password]', err)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
