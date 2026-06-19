'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useStore } from '@/store'
import { ConnectionBar } from '@/components/ConnectionBar'
import { SaveSessionModal } from '@/components/SaveSessionModal'
import { SignUpGateModal } from '@/components/SignUpGateModal'
import { SignInModal } from '@/components/SignInModal'
import { ChangePasswordModal } from '@/components/ChangePasswordModal'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'
import { useTheme } from '@/hooks/useTheme'
import type { RegisteredUser } from '@/hooks/useRegisteredUser'

const TABS = [
  { href: '/inspector', label: 'Inspector', icon: '⬡' },
  { href: '/chat',      label: 'Chat',      icon: '◈' },
  { href: '/trace',     label: 'Trace',     icon: '◎' },
  { href: '/sessions',  label: 'Sessions',  icon: '⇄' },
  { href: '/oauth',     label: 'OAuth',     icon: '◆' },
]

type Modal = 'none' | 'signup' | 'signin' | 'save' | 'change-password'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [modal, setModal] = useState<Modal>('none')
  const { getActiveTab } = useStore()
  const { user, ready, saveUser, clearUser } = useRegisteredUser()
  const { theme, toggleTheme } = useTheme()

  const activeTab = getActiveTab()
  const connected = activeTab?.connected ?? false
  const connecting = activeTab?.connecting ?? false
  const sessionLoaded = activeTab?.sessionLoaded ?? false
  const serverInfo = activeTab?.serverInfo ?? null
  const traces = activeTab?.traces ?? []

  function handleSaveClick() {
    if (!ready) return
    setModal(user ? 'save' : 'signup')
  }

  function handleSignedUp(newUser: RegisteredUser) {
    saveUser(newUser)
    setModal('save')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Topbar ── */}
      <header className="flex items-center h-12 px-4 gap-6 border-b border-[var(--c-border)] bg-[var(--c-bg-1)] flex-shrink-0">

        {/* Logo */}
        <Link href="/" className="flex items-center mr-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="Flashman AI" width={80} height={44} className="object-contain" />
        </Link>

        {/* Tabs */}
        <nav className="flex gap-1 flex-1">
          {TABS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors
                  ${active
                    ? 'bg-[var(--c-bg-3)] text-[var(--c-text)]'
                    : 'text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)]'
                  }`}
              >
                <span className="text-[13px] opacity-60">{icon}</span>
                {label}
                {label === 'Trace' && traces.length > 0 && (
                  <span className="bg-[var(--c-purple-bg)] text-[var(--c-purple)] text-[12px] font-bold px-1.5 py-px rounded-full">
                    {traces.length}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Status + Save Session */}
        <div className="flex items-center gap-3 text-[14px]">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              connecting    ? 'bg-[var(--c-amber)] animate-pulse' :
              sessionLoaded ? 'bg-[var(--c-blue)]' :
              connected     ? 'dot-connected' :
                              'bg-[var(--c-text-3)]'
            }`} />
            <span className="text-[var(--c-text-2)]">
              {connecting    ? 'Connecting…' :
               sessionLoaded ? serverInfo?.name ?? 'Snapshot' :
               connected     ? serverInfo?.name ?? 'Connected' :
                               'Not connected'}
            </span>
            {sessionLoaded && (
              <span className="text-[12px] font-bold px-1.5 py-px rounded-full bg-[var(--c-blue-bg)] text-[var(--c-blue)]">
                snapshot
              </span>
            )}
            {connected && !sessionLoaded && serverInfo && (
              <span className="text-[var(--c-text-3)] font-mono text-[12px]">
                v{serverInfo.version}
              </span>
            )}
          </div>

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--c-text-3)]
                       hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)] transition-colors"
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {ready && !user && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setModal('signin')}
                className="px-3 py-1.5 rounded-md text-[14px] font-medium
                           text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)] transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => setModal('signup')}
                className="px-3 py-1.5 rounded-md text-[14px] font-medium
                           bg-[var(--c-bg-3)] text-[var(--c-text)] hover:bg-[var(--c-border)] transition-colors"
              >
                Sign up
              </button>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--c-text-3)] text-[13px]">{user.name ?? user.email}</span>
              <button
                onClick={() => setModal('change-password')}
                title="Change password"
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--c-text-3)]
                           hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </button>
              <button
                onClick={clearUser}
                title="Sign out"
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--c-text-3)]
                           hover:text-[var(--c-red)] hover:bg-[var(--c-red-bg)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[14px] font-medium
                       bg-[var(--c-purple-bg)] text-[var(--c-purple)] border border-[var(--c-purple-border)]
                       hover:bg-[var(--c-purple-hover)] hover:border-[var(--c-purple-2)] transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9"/>
            </svg>
            Save session
          </button>
        </div>
      </header>

      {modal === 'signup' && (
        <SignUpGateModal
          onSignedUp={handleSignedUp}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'signin' && (
        <SignInModal
          onSignedIn={(u) => { saveUser(u); setModal('none') }}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'change-password' && user && (
        <ChangePasswordModal
          email={user.email}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'save' && user && (
        <SaveSessionModal
          config={activeTab?.config ?? { url: '', transport: 'auto' }}
          serverInfo={serverInfo}
          tools={activeTab?.tools ?? []}
          resources={activeTab?.resources ?? []}
          prompts={activeTab?.prompts ?? []}
          traces={activeTab?.traces ?? []}
          userEmail={user.email}
          onClose={() => setModal('none')}
        />
      )}

      {/* ── Connection bar ── */}
      <ConnectionBar />

      {/* ── Page content ── */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
