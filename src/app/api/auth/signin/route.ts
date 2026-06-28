import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const { data: user } = await db
      .from('registered_users')
      .select('email, name, password_hash, plan, enterprise_limits')
      .eq('email', normalizedEmail)
      .maybeSingle()

    // Use constant-time compare; generic error avoids account enumeration
    const hash = user?.password_hash ?? '$2a$12$invalidhashpaddingtomakeitconstanttime000000000000000000'
    const match = await bcrypt.compare(password, hash)

    if (!user || !match) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const u = user as Record<string, unknown>
    const el = (u.plan === 'enterprise' ? u.enterprise_limits : null) as Record<string, unknown> | null
    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name ?? undefined,
        plan: u.plan ?? 'free',
        ...(el?.logo_url   ? { enterprise_logo_url:   el.logo_url   } : {}),
        ...(el?.brand_name ? { enterprise_brand_name: el.brand_name } : {}),
      },
    })
  } catch (err: unknown) {
    console.error('[auth/signin]', err)
    return NextResponse.json({ error: 'Sign in failed' }, { status: 500 })
  }
}
