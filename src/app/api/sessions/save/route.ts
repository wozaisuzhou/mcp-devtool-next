import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserPlan, PLAN_LIMITS } from '@/lib/limits'
import type { MCPTool, MCPResource, MCPPrompt, ServerInfo, TraceEvent } from '@/lib/types'
import type { ConnectionConfig } from '@/lib/types'

interface SaveSessionBody {
  name: string
  label?: string
  userEmail?: string
  serverUrl: string
  serverInfo: ServerInfo | null
  transport: string
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  traces: TraceEvent[]
  overwrite?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveSessionBody = await req.json()
    const {
      name, label, userEmail,
      serverUrl, serverInfo, transport,
      tools = [], resources = [], prompts = [], traces = [],
      overwrite = false,
    } = body

    if (!name?.trim() || !serverUrl?.trim()) {
      return NextResponse.json({ error: 'name and serverUrl are required' }, { status: 400 })
    }
    if (!userEmail?.trim()) {
      return NextResponse.json({ error: 'email is required to save a session' }, { status: 400 })
    }
    if (serverUrl.trim().length > 2048) {
      return NextResponse.json({ error: 'serverUrl exceeds maximum length of 2048 characters' }, { status: 400 })
    }

    const plan = await getUserPlan(userEmail.trim())
    const sessionLimit = PLAN_LIMITS[plan].sessions
    const { count } = await db
      .from('saved_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail.trim())
    if ((count ?? 0) >= sessionLimit) {
      return NextResponse.json(
        { error: `Session limit reached (${sessionLimit} for ${plan} plan). Delete an existing session to free up space.` },
        { status: 403 }
      )
    }

    // Check for name collision scoped to this user
    const { data: existing } = await db
      .from('saved_sessions')
      .select('id')
      .eq('name', name.trim())
      .eq('user_email', userEmail.trim())
      .maybeSingle()

    if (existing && !overwrite) {
      return NextResponse.json(
        { error: 'A session with this name already exists.', existingId: existing.id },
        { status: 409 }
      )
    }

    if (existing && overwrite) {
      await db.from('saved_sessions').delete().eq('id', existing.id)
    }

    const { data, error } = await db
      .from('saved_sessions')
      .insert({
        name: name.trim(),
        label: label?.trim() || null,
        user_email: userEmail?.trim() || null,
        server_url: serverUrl.trim(),
        server_name: serverInfo?.name || null,
        server_version: serverInfo?.version || null,
        protocol_version: serverInfo?.protocolVersion || null,
        transport,
        tools,
        resources,
        prompts,
        traces,
        tool_count: tools.length,
        resource_count: resources.length,
        prompt_count: prompts.length,
        trace_count: traces.length,
      })
      .select('id, saved_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id, savedAt: data.saved_at })
  } catch (err: unknown) {
    console.error('[sessions/save]', err)
    const msg = err instanceof Error ? err.message : 'Failed to save session'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
