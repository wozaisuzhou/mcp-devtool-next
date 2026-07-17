import { NextRequest, NextResponse } from 'next/server'
import { requireRegisteredUser } from '@/lib/require-registered-user'

const URL = 'https://dusyyu9jj2i4zwio.public.blob.vercel-storage.com/Bubble%20MCP-1.0.0-arm64.dmg'

export async function GET(req: NextRequest) {
  if (!(await requireRegisteredUser(req))) {
    return NextResponse.json({ error: 'Sign in required to download' }, { status: 401 })
  }
  return NextResponse.redirect(URL)
}
