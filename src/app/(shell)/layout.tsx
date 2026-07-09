'use client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useState } from 'react'
import { useStore } from '@/store'
import { ConnectionBar } from '@/components/ConnectionBar'
import { NavSidebar } from '@/components/NavSidebar'
import { SaveSessionModal } from '@/components/SaveSessionModal'
import { SignUpGateModal } from '@/components/SignUpGateModal'
import { SignInModal } from '@/components/SignInModal'
import { ChangePasswordModal } from '@/components/ChangePasswordModal'
import { ApiKeysModal } from '@/components/ApiKeysModal'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'
import { Footer } from '@/components/Footer'
import { useTheme } from '@/hooks/useTheme'
import type { RegisteredUser } from '@/hooks/useRegisteredUser'

type Modal = 'none' | 'signup' | 'signin' | 'save' | 'change-password' | 'api-keys'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
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
      <header className="flex items-center h-10 px-3 gap-3 border-b border-[var(--c-border)] bg-[var(--c-bg-1)] flex-shrink-0 electron-header">

        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          {user?.enterprise_logo_url ? (
            <img
              src={user.enterprise_logo_url}
              alt={user.enterprise_brand_name ?? 'Logo'}
              className="h-6 max-w-[140px] object-contain"
            />
          ) : (
            <Logo className="text-[17px]" />
          )}
        </Link>

        {/* Connection status — breadcrumb style */}
        <div className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--c-text-3)] ml-1">
          <span className="opacity-60">/</span>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            connecting    ? 'bg-[var(--c-amber)] animate-pulse' :
            sessionLoaded ? 'bg-[var(--c-blue)]' :
            connected     ? 'dot-connected' :
                            'bg-[var(--c-text-3)]'
          }`} />
          <span className={connected || sessionLoaded || connecting ? 'text-[var(--c-text-2)]' : ''}>
            {connecting    ? 'connecting…' :
             sessionLoaded ? serverInfo?.name ?? 'snapshot' :
             connected     ? serverInfo?.name ?? 'connected' :
                             'not connected'}
          </span>
          {sessionLoaded && (
            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-[var(--c-blue-bg)] text-[var(--c-blue)] font-sans">
              snapshot
            </span>
          )}
          {connected && !sessionLoaded && serverInfo && (
            <span className="text-[var(--c-text-3)] text-[11px]">
              v{serverInfo.version}
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
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
                className="px-3 py-1.5 rounded-md text-[13px] font-medium
                           text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)] transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => setModal('signup')}
                className="px-3 py-1.5 rounded-md text-[13px] font-medium
                           bg-[var(--c-bg-3)] text-[var(--c-text)] hover:bg-[var(--c-border)] transition-colors"
              >
                Sign up
              </button>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--c-text-3)] text-[12px]">{user.name ?? user.email}</span>
              <button
                onClick={() => setModal('api-keys')}
                title="API Keys"
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--c-text-3)]
                           hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </button>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium
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

      {/* ── Modals ── */}
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
      {modal === 'api-keys' && user && (
        <ApiKeysModal
          userEmail={user.email}
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
          traces={traces}
          userEmail={user.email}
          onClose={() => setModal('none')}
        />
      )}

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 overflow-hidden">
        <NavSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <ConnectionBar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
          <Footer compact />
        </div>
      </div>
    </div>
  )
}
