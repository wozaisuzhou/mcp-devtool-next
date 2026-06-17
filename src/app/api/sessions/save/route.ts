import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
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
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveSessionBody = await req.json()
    const {
      name, label, userEmail,
      serverUrl, serverInfo, transport,
      tools = [], resources = [], prompts = [], traces = [],
    } = body

    if (!name?.trim() || !serverUrl?.trim()) {
      return NextResponse.json({ error: 'name and serverUrl are required' }, { status: 400 })
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
