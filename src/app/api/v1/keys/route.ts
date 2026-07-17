import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

function hashKey(raw: string) {
  return createHash('sha256').update(raw).digest('hex')
}

// GET /api/v1/keys?userEmail=...
export async function GET(req: NextRequest) {
  const userEmail = req.nextUrl.searchParams.get('userEmail')?.trim()
  if (!userEmail) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })

  const { data, error } = await db
    .from('api_keys')
    .select('id, name, created_at, last_used_at')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ keys: data ?? [] })
}

// POST /api/v1/keys — generate a new API key
// Requires the account password so a key can't be minted for someone else's
// email just by knowing that email address (userEmail elsewhere in this app
// is a client-trusted, unverified identifier — API keys are too sensitive for that).
export async function POST(req: NextRequest) {
  const { userEmail, name, password } = await req.json()
  if (!userEmail?.trim()) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })
  if (!password) return NextResponse.json({ error: 'password required' }, { status: 400 })

  const { data: user } = await db
    .from('registered_users')
    .select('password_hash')
    .eq('email', userEmail.trim())
    .maybeSingle()

  const hash = user?.password_hash ?? '$2a$12$invalidhashpaddingtomakeitconstanttime000000000000000000'
  const match = await bcrypt.compare(password, hash)
  if (!user || !match) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const rawKey = `mcp_${randomBytes(32).toString('hex')}`
  const keyHash = hashKey(rawKey)

  const { data, error } = await db
    .from('api_keys')
    .insert({ user_email: userEmail.trim(), key_hash: keyHash, name: name?.trim() || 'Default' })
    .select('id, name, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ key: rawKey, meta: data })
}
