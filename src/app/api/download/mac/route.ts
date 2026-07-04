import { NextResponse } from 'next/server'

const URL = 'https://dusyyu9jj2i4zwio.public.blob.vercel-storage.com/Bubble%20MCP-1.0.0-arm64.dmg'

export async function GET() {
  return NextResponse.redirect(URL)
}
