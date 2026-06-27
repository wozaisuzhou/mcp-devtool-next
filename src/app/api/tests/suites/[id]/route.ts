import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserPlan, PLAN_LIMITS } from '@/lib/limits'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, cases } = await req.json()

    const update: Record<string, unknown> = {}
    if (name !== undefined)        update.name        = name.trim()
    if (description !== undefined) update.description = description?.trim() || null
    if (cases !== undefined) {
      const { data: owner } = await db
        .from('test_suites')
        .select('user_email')
        .eq('id', params.id)
        .maybeSingle()
      if (owner?.user_email) {
        const plan = await getUserPlan(owner.user_email as string)
        const caseLimit = PLAN_LIMITS[plan].casesPerSuite
        if ((cases as unknown[]).length > caseLimit) {
          return NextResponse.json(
            { error: `Test case limit reached (${caseLimit} tests per suite for ${plan} plan).` },
            { status: 403 }
          )
        }
      }
      update.cases = cases
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await db
      .from('test_suites')
      .update(update)
      .eq('id', params.id)
      .select('id, name, description, cases, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ suite: data })
  } catch (err) {
    console.error('[tests/suites PUT]', err)
    const msg = err instanceof Error ? err.message : 'Failed to update suite'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/tests/suites/[id]  — share/unshare with a team (owner only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { teamId, userEmail } = await req.json()
    if (!userEmail) return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })

    const { data: suite } = await db
      .from('test_suites')
      .select('user_email')
      .eq('id', params.id)
      .maybeSingle()

    if (!suite) return NextResponse.json({ error: 'Suite not found' }, { status: 404 })
    if (suite.user_email?.toLowerCase() !== userEmail?.toLowerCase()) return NextResponse.json({ error: 'Only the owner can share this suite' }, { status: 403 })

    const { error } = await db
      .from('test_suites')
      .update({ team_id: teamId ?? null })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[tests/suites/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to update sharing' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await db
      .from('test_suites')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[tests/suites DELETE]', err)
    const msg = err instanceof Error ? err.message : 'Failed to delete suite'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
