'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const VISITOR_KEY = 'flashman_vid'
const USER_KEY    = 'flashman_user'

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_KEY)
    if (!vid) {
      vid = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, vid)
    }
    return vid
  } catch {
    return 'unknown'
  }
}

function getStoredEmail(): string | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as { email?: string }).email ?? null
  } catch {
    return null
  }
}

export default function VisitTracker() {
  const pathname  = usePathname()
  const lastPath  = useRef<string | null>(null)

  useEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    // Skip admin routes from self-reporting to avoid inflating counts
    if (pathname.startsWith('/admin')) return

    const visitorId = getOrCreateVisitorId()
    const userEmail = getStoredEmail()

    navigator.sendBeacon?.(
      '/api/analytics/visit',
      new Blob(
        [JSON.stringify({
          path: pathname,
          visitorId,
          userEmail,
          referrer: document.referrer || null,
        })],
        { type: 'application/json' },
      ),
    )
  }, [pathname])

  return null
}
