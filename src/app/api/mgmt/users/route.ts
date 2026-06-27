import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import type { UserPlan, EnterpriseLimits } from '@/lib/types'

function isAdmin(email: string | null): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  return admins.includes(email.toLowerCase())
}

// GET /api/admin/users?adminEmail=...&search=...&plan=...
export async function GET(req: NextRequest) {
  const adminEmail = req.nextUrl.searchParams.get('adminEmail')
  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const search = req.nextUrl.searchParams.get('search')?.trim() ?? ''
  const planFilter = req.nextUrl.searchParams.get('plan')?.trim() ?? ''

  let query = db
    .from('registered_users')
    .select('email, name, plan, enterprise_limits, created_at')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('email', `%${search}%`)
  }
  if (planFilter) {
    query = query.eq('plan', planFilter)
  }

  const { data, error } = await query
  if (error) {
    console.error('[admin/users GET]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Attach usage counts for each user
  const emails = (data ?? []).map((u: any) => u.email as string)
  const [sessionsResult, suitesResult] = await Promise.all([
    emails.length > 0
      ? db.from('saved_sessions').select('user_email').in('user_email', emails)
      : Promise.resolve({ data: [] }),
    emails.length > 0
      ? db.from('test_suites').select('user_email').in('user_email', emails)
      : Promise.resolve({ data: [] }),
  ])

  const sessionCounts = new Map<string, number>()
  const suiteCounts = new Map<string, number>()
  for (const row of sessionsResult.data ?? []) {
    const e = (row as any).user_email as string
    sessionCounts.set(e, (sessionCounts.get(e) ?? 0) + 1)
  }
  for (const row of suitesResult.data ?? []) {
    const e = (row as any).user_email as string
    suiteCounts.set(e, (suiteCounts.get(e) ?? 0) + 1)
  }

  const users = (data ?? []).map((u: any) => ({
    email: u.email,
    name: u.name,
    plan: (u.plan ?? 'free') as UserPlan,
    enterprise_limits: u.enterprise_limits ?? null,
    created_at: u.created_at,
    usage: {
      sessions: sessionCounts.get(u.email) ?? 0,
      suites: suiteCounts.get(u.email) ?? 0,
    },
  }))

  return NextResponse.json({ users })
}

// PATCH /api/admin/users — update a user's plan and/or enterprise limits
export async function PATCH(req: NextRequest) {
  const { adminEmail, email, plan, enterprise_limits } = await req.json()

  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const validPlans: UserPlan[] = ['free', 'silver', 'gold', 'enterprise']
  if (plan !== undefined && !validPlans.includes(plan)) {
    return NextResponse.json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (plan !== undefined) update.plan = plan
  if (enterprise_limits !== undefined) update.enterprise_limits = enterprise_limits

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await db
    .from('registered_users')
    .update(update)
    .eq('email', email.trim())

  if (error) {
    console.error('[admin/users PATCH]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
