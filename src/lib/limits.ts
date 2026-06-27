import db from '@/lib/db'
import type { UserPlan, EnterpriseLimits } from '@/lib/types'
import { PLAN_LIMITS, ENTERPRISE_DEFAULTS } from '@/lib/types'

export { PLAN_LIMITS, ENTERPRISE_DEFAULTS }

interface UserRow {
  plan?: string
  enterprise_limits?: EnterpriseLimits | null
}

export async function getUserPlanRow(email: string): Promise<{ plan: UserPlan; enterpriseLimits: EnterpriseLimits | null }> {
  const { data } = await db
    .from('registered_users')
    .select('plan, enterprise_limits')
    .eq('email', email)
    .maybeSingle()

  const row = data as UserRow | null
  const plan = (row?.plan as UserPlan) ?? 'free'
  const enterpriseLimits = plan === 'enterprise' ? (row?.enterprise_limits ?? null) : null
  return { plan, enterpriseLimits }
}

export async function getUserPlan(email: string): Promise<UserPlan> {
  const { plan } = await getUserPlanRow(email)
  return plan
}

export function resolveLimits(plan: UserPlan, enterpriseLimits: EnterpriseLimits | null) {
  if (plan === 'enterprise') {
    return enterpriseLimits ?? ENTERPRISE_DEFAULTS
  }
  return PLAN_LIMITS[plan]
}
