import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// Bot patterns to ignore — keeps the data clean without a heavy library
const BOT_RE = /bot|crawl|spider|slurp|mediapartners|headless|phantom|selenium/i

export async function POST(req: NextRequest) {
  try {
    const { path, visitorId, userEmail, referrer } = await req.json()

    if (!path || !visitorId) {
      return NextResponse.json({ error: 'path and visitorId are required' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') ?? ''
    if (BOT_RE.test(userAgent)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    await db.from('site_visits').insert({
      path: String(path).slice(0, 2048),
      visitor_id: String(visitorId).slice(0, 64),
      user_email: userEmail ? String(userEmail).slice(0, 255) : null,
      referrer: referrer ? String(referrer).slice(0, 2048) : null,
      user_agent: userAgent.slice(0, 512),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Silently fail — visit tracking must never break the app
    console.error('[analytics/visit]', err)
    return NextResponse.json({ ok: false })
  }
}
