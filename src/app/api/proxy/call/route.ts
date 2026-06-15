// src/app/api/proxy/call/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mcpClient } from '../connect/route'

export async function POST(req: NextRequest) {
  if (!mcpClient) {
    return NextResponse.json({ error: 'Not connected to an MCP server' }, { status: 400 })
  }

  const { tool, input } = await req.json() as {
    tool: string
    input: Record<string, unknown>
  }

  const start = performance.now()

  try {
    const result = await mcpClient.callTool({ name: tool, arguments: input })
    const durationMs = Math.round(performance.now() - start)

    return NextResponse.json({ result, durationMs, status: 'success' })
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start)
    const message = err instanceof Error ? err.message : 'Tool call failed'
    return NextResponse.json({ error: message, durationMs, status: 'error' }, { status: 500 })
  }
}
