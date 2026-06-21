'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store'

const NAV_ITEMS = [
  {
    href: '/inspector',
    label: 'Inspector',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Chat',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/trace',
    label: 'Trace',
    badge: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/sessions',
    label: 'Sessions',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
  },
  {
    href: '/oauth',
    label: 'OAuth',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
]

const TEST_NAV = {
  href: '/tests',
  label: 'Tests',
  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4m0-4h6m0 0h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4m0 0V3"/>
    </svg>
  ),
}

export function NavSidebar() {
  const pathname = usePathname()
  const { getActiveTab } = useStore()
  const traces = getActiveTab()?.traces ?? []

  return (
    <aside className="flex flex-col w-48 flex-shrink-0 border-r border-[var(--c-border)] bg-[var(--c-bg-1)] overflow-y-auto">
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {NAV_ITEMS.map(({ href, label, icon, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors
                ${active
                  ? 'bg-[var(--c-bg-3)] text-[var(--c-text)]'
                  : 'text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)]'
                }`}
            >
              <span className={active ? 'text-[var(--c-purple)]' : 'text-[var(--c-text-3)]'}>
                {icon}
              </span>
              <span className="flex-1">{label}</span>
              {badge && traces.length > 0 && (
                <span className="bg-[var(--c-purple-bg)] text-[var(--c-purple)] text-[11px] font-bold px-1.5 py-px rounded-full leading-none">
                  {traces.length}
                </span>
              )}
            </Link>
          )
        })}

        {/* Divider before Tests */}
        <div className="my-1 border-t border-[var(--c-border)]" />

        {(() => {
          const { href, label, icon } = TEST_NAV
          const active = pathname.startsWith(href)
          return (
            <Link
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors
                ${active
                  ? 'bg-[var(--c-bg-3)] text-[var(--c-text)]'
                  : 'text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)]'
                }`}
            >
              <span className={active ? 'text-[var(--c-purple)]' : 'text-[var(--c-text-3)]'}>
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          )
        })()}
      </nav>
    </aside>
  )
}
