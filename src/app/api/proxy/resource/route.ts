// src/app/api/proxy/resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getMcpClient } from '../client'

export async function POST(req: NextRequest) {
  const mcpClient = getMcpClient()
  if (!mcpClient) {
    return NextResponse.json({ error: 'Not connected' }, { status: 400 })
  }
  const { uri } = await req.json() as { uri: string }
  try {
    const result = await mcpClient.readResource({ uri })
    return NextResponse.json({ result })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    )
  }
}
