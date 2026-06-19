import Image from 'next/image'
import Link from 'next/link'

const APP_LINKS = [
  { href: '/inspector', label: 'Inspector' },
  { href: '/chat',      label: 'Chat' },
  { href: '/trace',     label: 'Trace' },
  { href: '/sessions',  label: 'Sessions' },
  { href: '/oauth',     label: 'OAuth' },
]

export function Footer() {
  return (
    <footer className="border-t border-[var(--c-border)] bg-[var(--c-bg-1)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-2">
            <Image src="/logo.png" alt="Flashman AI" width={120} height={66} className="object-contain" />
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

        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[var(--c-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[var(--c-text-3)]">
            © {new Date().getFullYear()} FlashMan.ai. All rights reserved.
          </p>
          <p className="text-[12px] text-[var(--c-text-3)]">
            Built for MCP developers.
          </p>
        </div>
      </div>
    </footer>
  )
}
