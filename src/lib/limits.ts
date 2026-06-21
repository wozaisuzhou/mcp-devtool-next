import db from '@/lib/db'
import type { UserPlan } from '@/lib/types'
import { PLAN_LIMITS } from '@/lib/types'

export async function getUserPlan(email: string): Promise<UserPlan> {
  const { data } = await db
    .from('registered_users')
    .select('plan')
    .eq('email', email)
    .maybeSingle()
  return ((data as { plan?: string } | null)?.plan as UserPlan) ?? 'free'
}

export { PLAN_LIMITS }
