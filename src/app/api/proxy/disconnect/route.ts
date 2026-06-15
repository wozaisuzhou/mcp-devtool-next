// src/app/api/proxy/disconnect/route.ts
import { NextResponse } from 'next/server'
import { mcpClient } from '../connect/route'

export async function POST() {
  if (mcpClient) {
    try { await (mcpClient as any).close() } catch {}
  }
  return NextResponse.json({ ok: true })
}
