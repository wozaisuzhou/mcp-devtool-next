import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const { data } = await db
    .from('registered_users')
    .select('email, name, plan, enterprise_limits')
    .eq('email', email)
    .maybeSingle()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const d = data as Record<string, unknown>
  const el = (d.plan === 'enterprise' ? d.enterprise_limits : null) as Record<string, unknown> | null
  return NextResponse.json({
    email: data.email,
    name: data.name ?? undefined,
    plan: d.plan ?? 'free',
    ...(el?.logo_url   ? { enterprise_logo_url:   el.logo_url   } : {}),
    ...(el?.brand_name ? { enterprise_brand_name: el.brand_name } : {}),
  })
}
