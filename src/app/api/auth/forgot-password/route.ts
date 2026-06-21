import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const normalizedEmail = email.trim().toLowerCase()

    const { data: user } = await db
      .from('registered_users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

      await db.from('password_reset_tokens').insert({ email: normalizedEmail, token_hash: tokenHash, expires_at: expiresAt })

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password?token=${token}`

      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: [normalizedEmail],
            subject: 'Reset your Bubble AI password',
            html: `<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`,
          }),
        })
        if (!emailRes.ok) {
          const body = await emailRes.json().catch(() => ({}))
          console.error('[auth/forgot-password] Resend error:', emailRes.status, body)
        }
      } else {
        console.log(`[auth/forgot-password] Reset URL for ${normalizedEmail}: ${resetUrl}`)
      }
    }

    // Always return success to avoid account enumeration
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/forgot-password]', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
