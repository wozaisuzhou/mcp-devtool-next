import Link from 'next/link'
import { Logo } from '@/components/Logo'

const APP_LINKS = [
  { href: '/inspector', label: 'Inspector' },
  { href: '/chat',      label: 'Chat' },
  { href: '/trace',     label: 'Trace' },
  { href: '/sessions',  label: 'Sessions' },
  { href: '/oauth',     label: 'OAuth' },
]

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms',   label: 'Terms' },
]

const CONTACT_EMAIL = 'customer@bubblemcp.com'

export function Footer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="flex-shrink-0 border-t border-[var(--c-border)] bg-[var(--c-bg-1)]">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <Logo className="text-[15px]" />
          <div className="flex items-center gap-4">
            {[...APP_LINKS, ...LEGAL_LINKS].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="text-[12px] text-[var(--c-text-3)] ml-auto">
            © {new Date().getFullYear()} Bubble MCP
          </p>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-[var(--c-border)] bg-[var(--c-bg-1)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-2">
            <Logo className="text-[22px]" />
          </div>

          {/* App links */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-text-3)] mb-1">App</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {APP_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal links */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-text-3)] mb-1">Legal</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {LEGAL_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-text-3)] mb-1">Contact</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[13px] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[var(--c-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[var(--c-text-3)]">
            © {new Date().getFullYear()} Bubble MCP. All rights reserved.
          </p>
          <p className="text-[12px] text-[var(--c-text-3)]">
            Built for MCP developers.
          </p>
        </div>
      </div>
    </footer>
  )
}
