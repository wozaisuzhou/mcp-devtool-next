import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if email already registered
    const { data: existing } = await db
      .from('registered_users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data, error } = await db
      .from('registered_users')
      .insert({ email: normalizedEmail, name: name?.trim() || null, password_hash })
      .select('email, name, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, user: data })
  } catch (err: unknown) {
    console.error('[auth/signup]', err)
    const msg = err instanceof Error ? err.message : 'Sign up failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
