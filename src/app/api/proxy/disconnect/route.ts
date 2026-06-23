// src/app/api/proxy/disconnect/route.ts
import { NextResponse } from 'next/server'
import { getMcpClient, setMcpClient } from '../client'

export async function POST() {
  const mcpClient = getMcpClient()
  if (mcpClient) {
    try { await (mcpClient as any).close() } catch {}
    setMcpClient(null)
  }
  return NextResponse.json({ ok: true })
}
