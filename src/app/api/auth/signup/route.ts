import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { sendEmail } from '@/lib/email'

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

    sendEmail(
      normalizedEmail,
      'Welcome to Bubble MCP',
      `<p>Hi${data.name ? ` ${data.name}` : ''},</p><p>Your Bubble MCP account is ready. Sign in any time to inspect, test, and monitor your MCP servers.</p><p>If you didn't create this account, please contact us at customer@bubblemcp.com.</p>`,
    ).catch(err => console.error('[auth/signup] welcome email failed:', err))

    return NextResponse.json({ success: true, user: { email: data.email, name: data.name ?? undefined, plan: 'free' } })
  } catch (err: unknown) {
    console.error('[auth/signup]', err)
    const msg = err instanceof Error ? err.message : 'Sign up failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
