import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserPlanRow, resolveLimits } from '@/lib/limits'

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

    // Fetch teams this user belongs to (simple select — no join to avoid PostgREST issues)
    const { data: memberships, error: membershipsError } = await db
      .from('team_members')
      .select('team_id')
      .ilike('user_email', userEmail)

    if (membershipsError) console.error('[tests/suites GET] memberships query failed:', membershipsError)

    const teamIds = (memberships ?? []).map((m: any) => m.team_id)

    // Collect all team IDs we need names for (own shared suites + member suites)
    const ownTeamIds = (ownData ?? []).map((s: any) => s.team_id).filter(Boolean)
    const allTeamIds = [...new Set([...teamIds, ...ownTeamIds])]

    // Fetch team names in one flat query
    let teamNameMap = new Map<string, string>()
    if (allTeamIds.length > 0) {
      const { data: teamRows } = await db
        .from('teams')
        .select('id, name')
        .in('id', allTeamIds)
      teamNameMap = new Map((teamRows ?? []).map((t: any) => [t.id as string, t.name as string]))
    }

    if (teamIds.length > 0) {
      const { data: sharedData, error: sharedError } = await db
        .from('test_suites')
        .select('id, name, description, cases, created_at, updated_at, team_id, user_email')
        .in('team_id', teamIds)
        .order('created_at', { ascending: true })

      if (sharedError) console.error('[tests/suites GET] sharedData query failed:', sharedError)

      const ownIds = new Set((ownData ?? []).map((s: any) => s.id))
      teamSuites = (sharedData ?? [])
        .filter((s: any) => !ownIds.has(s.id))
        .map((s: any) => ({ ...s, teamName: teamNameMap.get(s.team_id) ?? null }))
    }

    // Attach teamName to own suites too (so the badge shows for the owner)
    const ownWithTeamName = (ownData ?? []).map((s: any) => ({
      ...s,
      teamName: s.team_id ? (teamNameMap.get(s.team_id) ?? null) : null,
    }))

    const allSuites = [...ownWithTeamName, ...teamSuites]

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

    const { plan, enterpriseLimits } = await getUserPlanRow(userEmail.trim())
    const suiteLimit = resolveLimits(plan, enterpriseLimits).suites
    const { count } = await db
      .from('test_suites')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail.trim())
    if ((count ?? 0) >= suiteLimit) {
      return NextResponse.json(
        { error: `Suite limit reached (${suiteLimit} suite${suiteLimit === 1 ? '' : 's'} on your ${plan} plan).` },
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
