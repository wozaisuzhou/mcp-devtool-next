// src/app/api/activities/log/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import type { UserActivity } from '@/lib/types'

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const activity: UserActivity = await req.json()

    const query = `
      INSERT INTO activities (
        user_id, timestamp, activity_type, server_id, tool_name,
        input, output, error, status, duration_ms, session_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `

    const result = await pool.query(query, [
      activity.userId,
      activity.timestamp,
      activity.activityType,
      activity.serverId,
      activity.toolName || null,
      activity.input ? JSON.stringify(activity.input) : null,
      activity.output ? JSON.stringify(activity.output) : null,
      activity.error || null,
      activity.status || null,
      activity.durationMs || null,
      activity.sessionId || null,
      activity.metadata ? JSON.stringify(activity.metadata) : null,
    ])

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
    })
  } catch (err) {
    console.error('Failed to log activity:', err)
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const activityType = searchParams.get('activityType')
    const limit = searchParams.get('limit') || '100'

    let query = 'SELECT * FROM activities WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (userId) {
      query += ` AND user_id = $${paramCount++}`
      params.push(userId)
    }

    if (activityType) {
      query += ` AND activity_type = $${paramCount++}`
      params.push(activityType)
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount}`
    params.push(parseInt(limit))

    const result = await pool.query(query, params)

    const activities = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      timestamp: row.timestamp,
      activityType: row.activity_type,
      serverId: row.server_id,
      toolName: row.tool_name,
      input: row.input,
      output: row.output,
      error: row.error,
      status: row.status,
      durationMs: row.duration_ms,
      sessionId: row.session_id,
      metadata: row.metadata,
    }))

    return NextResponse.json({ activities })
  } catch (err) {
    console.error('Failed to fetch activities:', err)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    const query = 'DELETE FROM activities WHERE id = $1 RETURNING id'
    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to delete activity:', err)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}
