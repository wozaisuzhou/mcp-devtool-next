import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _db: SupabaseClient | null = null

function getDb(): SupabaseClient {
  if (_db) return _db
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[db] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
  _db = createClient(url, key, { auth: { persistSession: false } })
  return _db
}

export default new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getDb() as any)[prop]
  },
})
