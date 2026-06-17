import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import type { UserActivity, ActivityFilter } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const activity: UserActivity = await req.json()

    const { data, error } = await db
      .from('activities')
      .insert({
        user_id:       activity.userId,
        timestamp:     activity.timestamp,
        activity_type: activity.activityType,
        server_id:     activity.serverId,
        tool_name:     activity.toolName || null,
        input:         activity.input || null,
        output:        activity.output || null,
        error:         activity.error || null,
        status:        activity.status || null,
        duration_ms:   activity.durationMs || null,
        session_id:    activity.sessionId || null,
        metadata:      activity.metadata || null,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Failed to log activity:', err)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId       = searchParams.get('userId')
    const activityType = searchParams.get('activityType')
    const limit        = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

    let query = db
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (userId)       query = query.eq('user_id', userId)
    if (activityType) query = query.eq('activity_type', activityType)

    const { data, error } = await query
    if (error) throw error

    const activities = (data ?? []).map((row) => ({
      id:           row.id,
      userId:       row.user_id,
      timestamp:    row.timestamp,
      activityType: row.activity_type,
      serverId:     row.server_id,
      toolName:     row.tool_name,
      input:        row.input,
      output:       row.output,
      error:        row.error,
      status:       row.status,
      durationMs:   row.duration_ms,
      sessionId:    row.session_id,
      metadata:     row.metadata,
    }))

    return NextResponse.json({ activities })
  } catch (err) {
    console.error('Failed to fetch activities:', err)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })

    const { error } = await db.from('activities').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to delete activity:', err)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}
