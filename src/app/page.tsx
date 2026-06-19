'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { SignInModal } from '@/components/SignInModal'
import { SignUpGateModal } from '@/components/SignUpGateModal'
import { Footer } from '@/components/Footer'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'
import type { RegisteredUser } from '@/hooks/useRegisteredUser'

const FEATURES = [
  {
    icon: '⬡',
    title: 'Inspector',
    desc: 'Browse every tool, resource, and prompt your MCP server exposes. Call any tool with a live JSON editor and inspect structured responses.',
    href: '/inspector',
    color: 'var(--c-purple)',
  },
  {
    icon: '◈',
    title: 'Chat',
    desc: 'Converse naturally with your MCP server. Test multi-turn prompts exactly as Claude would use them — no client wiring required.',
    href: '/chat',
    color: 'var(--c-blue)',
  },
  {
    icon: '◎',
    title: 'Trace',
    desc: 'Every JSON-RPC message — requests, responses, and notifications — logged and formatted in real time with full diff support.',
    href: '/trace',
    color: 'var(--c-green)',
  },
  {
    icon: '⇄',
    title: 'Sessions',
    desc: 'Save inspection snapshots and replay them later. Share exact server states with teammates without needing a live connection.',
    href: '/sessions',
    color: 'var(--c-amber)',
  },
  {
    icon: '◆',
    title: 'OAuth',
    desc: 'Test OAuth 2.1 PKCE flows against any provider. Inspect tokens, scopes, and callback parameters at each step.',
    href: '/oauth',
    color: '#e879f9',
  },
]

const STEPS = [
  { n: '01', title: 'Connect', desc: 'Paste your MCP server URL. Supports SSE, WebSocket, and Streamable HTTP.' },
  { n: '02', title: 'Explore', desc: 'Browse tools, resources, and prompts — call them live with a built-in editor.' },
  { n: '03', title: 'Debug', desc: 'Trace every message, save sessions, and share snapshots with your team.' },
]

type Modal = 'none' | 'signin' | 'signup'

export default function LandingPage() {
  const [modal, setModal] = useState<Modal>('none')
  const { user, ready, saveUser } = useRegisteredUser()

  function handleSignedIn(u: RegisteredUser) {
    saveUser(u)
    setModal('none')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg-base)]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--c-border)] bg-[var(--c-bg-base)]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Flashman AI" width={88} height={48} className="object-contain" />
          </div>
          <div className="flex items-center gap-2">
            {ready && !user ? (
              <>
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
                             bg-[var(--c-purple-bg)] text-[var(--c-purple)] border border-[var(--c-purple-border)]
                             hover:bg-[var(--c-purple-hover)] transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : ready && user ? (
              <span className="text-[13px] text-[var(--c-text-3)]">{user.name ?? user.email}</span>
            ) : null}
            <Link
              href="/inspector"
              className="px-3 py-1.5 rounded-md text-[14px] font-semibold
                         bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors"
            >
              Open app →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(124,111,247,0.10) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col items-center gap-6 max-w-2xl">
          <Image
            src="/logo.png"
            alt="Flashman AI"
            width={260}
            height={142}
            className="object-contain drop-shadow-2xl"
            priority
          />

          <p className="text-[15px] text-[var(--c-text-3)] leading-relaxed max-w-[480px]">
            The complete developer toolkit for building, testing, and debugging
            Model Context Protocol servers — inspector, chat, tracer, and more.
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/inspector"
              className="px-5 py-2.5 rounded-lg text-[15px] font-semibold
                         bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors
                         flex items-center gap-2"
            >
              Open Inspector
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            {ready && !user && (
              <button
                onClick={() => setModal('signup')}
                className="px-5 py-2.5 rounded-lg text-[15px] font-medium
                           bg-[var(--c-bg-2)] text-[var(--c-text-2)] border border-[var(--c-border)]
                           hover:bg-[var(--c-bg-3)] hover:text-[var(--c-text)] transition-colors"
              >
                Sign up free
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-purple)] mb-3">Features</p>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[var(--c-text)] tracking-tight">
              Everything you need to ship MCP servers
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="group flex flex-col gap-3 p-5 rounded-xl border border-[var(--c-border)]
                           bg-[var(--c-bg-1)] hover:bg-[var(--c-bg-2)] hover:border-[var(--c-border-2)]
                           transition-all duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[20px]" style={{ color: f.color }}>{f.icon}</span>
                  <span className="font-semibold text-[15px] text-[var(--c-text)]">{f.title}</span>
                  <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--c-text-3)]"
                       width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
                <p className="text-[13px] text-[var(--c-text-3)] leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-purple)] mb-3">Workflow</p>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[var(--c-text)] tracking-tight">
              Up and running in seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col gap-3 p-6 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-1)]">
                <span className="text-[13px] font-mono font-bold text-[var(--c-purple-2)]">{s.n}</span>
                <h3 className="text-[17px] font-semibold text-[var(--c-text)]">{s.title}</h3>
                <p className="text-[13px] text-[var(--c-text-3)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-[var(--c-purple-border)] bg-[var(--c-purple-bg)] p-10 text-center"
               style={{ background: 'linear-gradient(135deg, rgba(30,28,58,0.8) 0%, rgba(22,20,50,0.6) 100%)' }}>
            <Image src="/logo.png" alt="Flashman AI" width={146} height={80} className="mx-auto mb-5 object-contain" />
            <h2 className="text-[26px] font-bold text-[var(--c-text)] mb-2">Ready to ship faster?</h2>
            <p className="text-[14px] text-[var(--c-text-3)] mb-7 max-w-md mx-auto">
              Open the inspector now — no install, no config. Connect your MCP server URL and go.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/inspector"
                className="px-6 py-2.5 rounded-lg text-[15px] font-semibold
                           bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors"
              >
                Open Inspector →
              </Link>
              {ready && !user && (
                <button
                  onClick={() => setModal('signup')}
                  className="px-6 py-2.5 rounded-lg text-[15px] font-medium text-[var(--c-purple)]
                             border border-[var(--c-purple-border)] hover:bg-[var(--c-purple-hover)] transition-colors"
                >
                  Create free account
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {modal === 'signin' && (
        <SignInModal
          onSignedIn={handleSignedIn}
          onClose={() => setModal('none')}
        />
      )}
      {modal === 'signup' && (
        <SignUpGateModal
          onSignedUp={handleSignedIn}
          onClose={() => setModal('none')}
        />
      )}
    </div>
  )
}
