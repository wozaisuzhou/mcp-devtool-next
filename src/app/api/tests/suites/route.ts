import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserPlan, PLAN_LIMITS } from '@/lib/limits'

export async function GET(req: NextRequest) {
  try {
    const userEmail = req.nextUrl.searchParams.get('userEmail')
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }

    // Fetch user's own suites
    const { data: ownData, error: ownError } = await db
      .from('test_suites')
      .select('id, name, description, cases, created_at, updated_at, team_id, user_email')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: true })

    if (ownError) throw ownError

    let teamSuites: any[] = []

    // Fetch suites shared by teams this user belongs to (excluding own)
    const { data: memberships } = await db
      .from('team_members')
      .select('team_id, teams(name)')
      .eq('user_email', userEmail)

    const teamIds = (memberships ?? []).map((m: any) => m.team_id)

    if (teamIds.length > 0) {
      const { data: sharedData } = await db
        .from('test_suites')
        .select('id, name, description, cases, created_at, updated_at, team_id, user_email, teams(name)')
        .in('team_id', teamIds)
        .order('created_at', { ascending: true })

      const ownIds = new Set((ownData ?? []).map((s: any) => s.id))
      teamSuites = (sharedData ?? [])
        .filter((s: any) => !ownIds.has(s.id))
        .map((s: any) => ({ ...s, teamName: s.teams?.name ?? null }))
    }

    const allSuites = [...(ownData ?? []), ...teamSuites]

    return NextResponse.json({ suites: allSuites })
  } catch (err) {
    console.error('[tests/suites GET]', err)
    return NextResponse.json({ suites: [], error: 'Database not available' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userEmail, name, description, cases, teamId } = await req.json()

    if (!userEmail?.trim()) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const plan = await getUserPlan(userEmail.trim())
    const suiteLimit = PLAN_LIMITS[plan].suites
    const { count } = await db
      .from('test_suites')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail.trim())
    if ((count ?? 0) >= suiteLimit) {
      return NextResponse.json(
        { error: `Suite limit reached (${suiteLimit} suite${suiteLimit === 1 ? '' : 's'} for ${plan} plan).` },
        { status: 403 }
      )
    }

    const { data, error } = await db
      .from('test_suites')
      .insert({
        user_email: userEmail.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        cases: cases ?? [],
        team_id: teamId ?? null,
      })
      .select('id, name, description, cases, created_at, updated_at, team_id, user_email')
      .single()

    if (error) throw error

    return NextResponse.json({ suite: data })
  } catch (err) {
    console.error('[tests/suites POST]', err)
    const msg = err instanceof Error ? err.message : 'Failed to create suite'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
