import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await req.json()
    if (!email?.trim() || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const { data: user } = await db
      .from('registered_users')
      .select('password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const hash = user?.password_hash ?? '$2a$12$invalidhashpaddingtomakeitconstanttime000000000000000000'
    const match = await bcrypt.compare(currentPassword, hash)
    if (!user || !match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await db.from('registered_users').update({ password_hash: newHash }).eq('email', normalizedEmail)

    sendEmail(
      normalizedEmail,
      'Your Bubble MCP password was changed',
      `<p>This is a confirmation that your Bubble MCP password was just changed.</p><p>If you did not make this change, please contact us immediately at support@bubblemcp.com.</p>`,
    ).catch(err => console.error('[auth/change-password] notification email failed:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/change-password]', err)
    return NextResponse.json({ error: 'Change password failed' }, { status: 500 })
  }
}
