import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

function isAdmin(email: string | null): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  return admins.includes(email.toLowerCase())
}

// GET /api/admin/analytics?adminEmail=...&days=30
export async function GET(req: NextRequest) {
  const adminEmail = req.nextUrl.searchParams.get('adminEmail')
  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const days = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('days') ?? '30'), 1), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [allResult, todayResult, weekResult] = await Promise.all([
    db.from('site_visits').select('path, visitor_id, user_email, referrer, created_at', { count: 'exact' })
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500),
    db.from('site_visits').select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    db.from('site_visits').select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo),
  ])

  const rows = allResult.data ?? []
  const total = allResult.count ?? 0

  // Unique visitors over the window
  const uniqueVisitors = new Set(rows.map((r: any) => r.visitor_id as string)).size

  // Signed-in vs anonymous
  const signedIn = rows.filter((r: any) => r.user_email).length

  // Top pages
  const pageCounts = new Map<string, number>()
  for (const r of rows as any[]) {
    pageCounts.set(r.path, (pageCounts.get(r.path) ?? 0) + 1)
  }
  const topPages = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }))

  // Daily visits for chart (last `days` days)
  const dailyMap = new Map<string, { visits: number; uniqueVids: Set<string> }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, { visits: 0, uniqueVids: new Set() })
  }
  for (const r of rows as any[]) {
    const key = (r.created_at as string).slice(0, 10)
    const bucket = dailyMap.get(key)
    if (bucket) {
      bucket.visits++
      bucket.uniqueVids.add(r.visitor_id as string)
    }
  }
  const dailyVisits = [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, { visits, uniqueVids }]) => ({ date, visits, unique: uniqueVids.size }))

  // Recent visits (last 50)
  const recentVisits = (rows as any[]).slice(0, 50).map((r) => ({
    path:       r.path,
    visitorId:  r.visitor_id,
    userEmail:  r.user_email ?? null,
    referrer:   r.referrer ?? null,
    createdAt:  r.created_at,
  }))

  return NextResponse.json({
    summary: {
      total,
      today:          todayResult.count ?? 0,
      week:           weekResult.count ?? 0,
      window:         total,
      uniqueVisitors,
      signedIn,
    },
    topPages,
    dailyVisits,
    recentVisits,
  })
}
