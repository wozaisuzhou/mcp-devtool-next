'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store'

const NAV_ITEMS = [
  {
    href: '/inspector',
    label: 'Inspector',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Chat',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/trace',
    label: 'Trace',
    badge: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/sessions',
    label: 'Sessions',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
  },
  {
    href: '/oauth',
    label: 'OAuth',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
]

const TEST_NAV = {
  href: '/tests',
  label: 'Tests',
  icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4m0-4h6m0 0h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4m0 0V3"/>
    </svg>
  ),
}

const ANALYTICS_NAV = {
  href: '/analytics',
  label: 'Analytics',
  icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
}

const DIRECTORY_NAV = {
  href: '/directory',
  label: 'Directory',
  icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
}

const TEAM_NAV = {
  href: '/team',
  label: 'Team',
  icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
}

function RailLink({ href, label, icon, badgeCount, active }: {
  href: string
  label: string
  icon: React.ReactNode
  badgeCount?: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`group relative flex items-center justify-center w-10 h-10 rounded transition-colors flex-shrink-0
        ${active
          ? 'text-[var(--c-purple)] bg-[var(--c-purple-bg)]'
          : 'text-[var(--c-text-3)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)]'
        }`}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[var(--c-purple)]" />}
      {icon}
      {!!badgeCount && badgeCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-[var(--c-purple)]
                          text-white text-[9px] font-bold leading-[14px] text-center">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded text-[12px] font-medium whitespace-nowrap
                        bg-[var(--c-bg-3)] text-[var(--c-text)] border border-[var(--c-border)] shadow-lg z-50
                        opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </Link>
  )
}

export function NavSidebar() {
  const pathname = usePathname()
  const { getActiveTab } = useStore()
  const traces = getActiveTab()?.traces ?? []

  return (
    <aside className="flex flex-col items-center w-12 flex-shrink-0 border-r border-[var(--c-border)] bg-[var(--c-bg-1)] py-2 gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon, badge }) => (
        <RailLink
          key={href}
          href={href}
          label={label}
          icon={icon}
          active={pathname.startsWith(href)}
          badgeCount={badge ? traces.length : undefined}
        />
      ))}

      <div className="w-6 my-1 border-t border-[var(--c-border)]" />

      {[TEST_NAV, TEAM_NAV, DIRECTORY_NAV, ANALYTICS_NAV].map(({ href, label, icon }) => (
        <RailLink key={href} href={href} label={label} icon={icon} active={pathname.startsWith(href)} />
      ))}
    </aside>
  )
}
