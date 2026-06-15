'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { ConnectionBar } from '@/components/ConnectionBar'

const TABS = [
  { href: '/inspector', label: 'Inspector', icon: '⬡' },
  { href: '/chat',      label: 'Chat',      icon: '◈' },
  { href: '/trace',     label: 'Trace',     icon: '◎' },
  { href: '/oauth',     label: 'OAuth',     icon: '◆' },
]

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { connected, connecting, serverInfo, traces } = useStore()

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Topbar ── */}
      <header className="flex items-center h-12 px-4 gap-6 border-b border-[#2a2a32] bg-[#141416] flex-shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[#7c6ff7] text-lg font-bold leading-none">⬡</span>
          <span className="font-semibold text-[15px] tracking-tight text-[#e8e8f0]">flashman</span>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 flex-1">
          {TABS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors
                  ${active
                    ? 'bg-[#222228] text-[#e8e8f0]'
                    : 'text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1e]'
                  }`}
              >
                <span className="text-[11px] opacity-60">{icon}</span>
                {label}
                {label === 'Trace' && traces.length > 0 && (
                  <span className="bg-[#1e1c3a] text-[#7c6ff7] text-[10px] font-bold px-1.5 py-px rounded-full">
                    {traces.length}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Status */}
        <div className="flex items-center gap-2 text-[12px]">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            connecting ? 'bg-[#f0a840] animate-pulse' :
            connected  ? 'dot-connected' :
                         'bg-[#5a5a70]'
          }`} />
          <span className="text-[#9090a8]">
            {connecting ? 'Connecting…' :
             connected  ? serverInfo?.name ?? 'Connected' :
                          'Not connected'}
          </span>
          {connected && serverInfo && (
            <span className="text-[#5a5a70] font-mono text-[10px]">
              v{serverInfo.version}
            </span>
          )}
        </div>
      </header>

      {/* ── Connection bar ── */}
      <ConnectionBar />

      {/* ── Page content ── */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
