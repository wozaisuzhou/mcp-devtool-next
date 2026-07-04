import { NextResponse } from 'next/server'

const URL = 'https://dusyyu9jj2i4zwio.public.blob.vercel-storage.com/Bubble%20MCP%20Setup%201.0.0.zip'

export async function GET() {
  return NextResponse.redirect(URL)
}
