import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

const IP_LIMIT        = 5   // max submissions per IP per hour
const EMAIL_LIMIT     = 5   // max submissions per email per 24 hours
const IP_WINDOW_MS    = 60 * 60 * 1000
const EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

interface FeedbackBody {
  type: string
  title: string
  description: string
  category: string
  severity: string
  steps?: string
  email: string
  honeypot?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedbackBody = await req.json()
    const { type, title, description, category, severity, steps, email, honeypot } = body

    // Silently reject bots that filled the hidden honeypot field
    if (honeypot) return NextResponse.json({ success: true, id: 'bot' })

    if (!title?.trim())       return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    if (!email?.trim())       return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })

    const ip        = getIP(req)
    const userAgent = req.headers.get('user-agent') ?? null
    const now       = new Date()

    // Rate limit by IP: max 5 per hour
    const ipSince = new Date(now.getTime() - IP_WINDOW_MS).toISOString()
    const { count: ipCount } = await db
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('submitted_at', ipSince)
    if ((ipCount ?? 0) >= IP_LIMIT) {
      return NextResponse.json(
        { error: 'Too many submissions from your network. Please wait before submitting again.' },
        { status: 429 }
      )
    }

    // Rate limit by email: max 5 per 24 hours
    const emailSince = new Date(now.getTime() - EMAIL_WINDOW_MS).toISOString()
    const { count: emailCount } = await db
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .gte('submitted_at', emailSince)
    if ((emailCount ?? 0) >= EMAIL_LIMIT) {
      return NextResponse.json(
        { error: 'You have reached the daily submission limit (5 per 24 hours). Thank you for your feedback!' },
        { status: 429 }
      )
    }

    const { data, error } = await db
      .from('feedback')
      .insert({
        type:        type === 'idea' ? 'idea' : 'bug',
        title:       title.trim(),
        description: description.trim(),
        category:    category || 'other',
        severity:    severity || 'medium',
        steps:       steps?.trim() || null,
        email:       email.trim().toLowerCase(),
        ip,
        user_agent:  userAgent,
      })
      .select('id, submitted_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id, submittedAt: data.submitted_at })
  } catch (err: unknown) {
    console.error('[feedback]', err)
    const msg = err instanceof Error ? err.message : 'Failed to submit'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
