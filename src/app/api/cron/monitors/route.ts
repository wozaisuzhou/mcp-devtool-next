import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { fetchLiveCapabilities, diffCapabilities, hasDiff, sendAlertEmail, sendWebhook } from '@/lib/monitor-check'

// Called hourly by Vercel Cron. Protected by CRON_SECRET env var.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch monitors that are due (never checked, or older than interval_hours)
  const { data: monitors, error } = await db
    .from('monitors')
    .select('id, user_email, session_id, interval_hours, notify_email, webhook_url')

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  if (!monitors?.length) return NextResponse.json({ checked: 0 })

  const now = new Date()
  let checked = 0
  let alerted = 0

  for (const monitor of monitors) {
    // Check if this monitor is due
    const { data: monitorFull } = await db
      .from('monitors')
      .select('last_checked_at')
      .eq('id', monitor.id)
      .single()

    if (monitorFull?.last_checked_at) {
      const lastCheck = new Date(monitorFull.last_checked_at)
      const hoursSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60)
      if (hoursSince < monitor.interval_hours) continue
    }

    // Fetch the saved session snapshot
    const { data: session } = await db
      .from('saved_sessions')
      .select('name, server_url, transport, tools, resources, prompts')
      .eq('id', monitor.session_id)
      .maybeSingle()

    if (!session) {
      await db.from('monitors').update({ last_checked_at: now.toISOString(), last_status: 'error' }).eq('id', monitor.id)
      continue
    }

    try {
      const live = await fetchLiveCapabilities(session.server_url, session.transport ?? 'auto')
      const diff = diffCapabilities(
        { tools: session.tools ?? [], resources: session.resources ?? [], prompts: session.prompts ?? [] },
        live,
      )
      const changed = hasDiff(diff.tools, diff.resources, diff.prompts)
      const status = changed ? 'changed' : 'ok'

      await db.from('monitors').update({
        last_checked_at: now.toISOString(),
        last_status: status,
        last_diff: changed ? diff : null,
      }).eq('id', monitor.id)

      if (changed) {
        alerted++
        if (monitor.notify_email) {
          await sendAlertEmail(monitor.user_email, session.name, session.server_url, diff)
        }
        if (monitor.webhook_url) {
          await sendWebhook(monitor.webhook_url, session.name, session.server_url, diff)
        }
      }

      checked++
    } catch (err) {
      console.error(`[cron/monitors] Check failed for monitor ${monitor.id}:`, err)
      await db.from('monitors').update({
        last_checked_at: now.toISOString(),
        last_status: 'error',
      }).eq('id', monitor.id)
    }
  }

  return NextResponse.json({ checked, alerted })
}
