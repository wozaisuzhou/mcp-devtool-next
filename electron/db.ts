import Database from 'better-sqlite3'
import * as path from 'path'
import { app } from 'electron'
import type { UserActivity, ActivityFilter } from '../src/lib/types'

let db: Database.Database

export async function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'activities.db')
  db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      activity_type TEXT NOT NULL CHECK(activity_type IN ('tool_call', 'resource_read', 'connection', 'error', 'chat')),
      server_id TEXT NOT NULL,
      tool_name TEXT,
      input TEXT,
      output TEXT,
      error TEXT,
      status TEXT CHECK(status IN ('success', 'error', 'timeout')),
      duration_ms INTEGER,
      session_id TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, activity_type);
    CREATE INDEX IF NOT EXISTS idx_activities_server ON activities(server_id);
    CREATE INDEX IF NOT EXISTS idx_activities_session ON activities(session_id);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      server_info TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `)

  console.log('Database initialized at:', dbPath)
}

export async function addActivity(activity: UserActivity): Promise<UserActivity> {
  const stmt = db.prepare(`
    INSERT INTO activities (
      id, user_id, timestamp, activity_type, server_id, tool_name,
      input, output, error, status, duration_ms, session_id, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    activity.id,
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
    activity.metadata ? JSON.stringify(activity.metadata) : null
  )

  return activity
}

export async function getActivities(filters?: ActivityFilter): Promise<UserActivity[]> {
  let query = 'SELECT * FROM activities WHERE 1=1'
  const params: any[] = []

  if (filters?.userId) {
    query += ' AND user_id = ?'
    params.push(filters.userId)
  }

  if (filters?.activityType) {
    query += ' AND activity_type = ?'
    params.push(filters.activityType)
  }

  if (filters?.serverId) {
    query += ' AND server_id = ?'
    params.push(filters.serverId)
  }

  if (filters?.startDate) {
    query += ' AND timestamp >= ?'
    params.push(filters.startDate)
  }

  if (filters?.endDate) {
    query += ' AND timestamp <= ?'
    params.push(filters.endDate)
  }

  if (filters?.sessionId) {
    query += ' AND session_id = ?'
    params.push(filters.sessionId)
  }

  query += ' ORDER BY timestamp DESC'

  if (filters?.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)
  }

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as any[]

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    timestamp: row.timestamp,
    activityType: row.activity_type,
    serverId: row.server_id,
    toolName: row.tool_name,
    input: row.input ? JSON.parse(row.input) : undefined,
    output: row.output ? JSON.parse(row.output) : undefined,
    error: row.error,
    status: row.status,
    durationMs: row.duration_ms,
    sessionId: row.session_id,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }))
}

export async function deleteActivity(id: string): Promise<boolean> {
  const stmt = db.prepare('DELETE FROM activities WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export async function clearActivities(userId: string): Promise<number> {
  const stmt = db.prepare('DELETE FROM activities WHERE user_id = ?')
  const result = stmt.run(userId)
  return result.changes
}

export async function getActivityStats(userId: string) {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      activity_type,
      status,
      AVG(duration_ms) as avg_duration
    FROM activities
    WHERE user_id = ?
    GROUP BY activity_type, status
  `)

  return stmt.all(userId)
}
