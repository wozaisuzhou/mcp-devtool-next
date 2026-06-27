'use client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
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
    icon: '◇',
    title: 'Tests',
    desc: 'Build automated test suites against your MCP tools. Define inputs, assert outputs, and run the full suite with one click.',
    href: '/tests',
    color: 'var(--c-green)',
  },
  {
    icon: '◆',
    title: 'OAuth',
    desc: 'Test OAuth 2.1 PKCE flows against any provider. Inspect tokens, scopes, and callback parameters at each step.',
    href: '/oauth',
    color: '#e879f9',
  },
  {
    icon: '⊹',
    title: 'Teams',
    desc: 'Invite colleagues, share saved sessions and test suites across the team. Members see shared work automatically — no manual handoff.',
    href: '/team',
    color: '#22d3ee',
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
            <Logo className="text-[20px]" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/bugs"
              className="px-3 py-1.5 rounded-md text-[13px] text-[var(--c-text-3)] hover:text-[var(--c-text)]
                         hover:bg-[var(--c-bg-2)] transition-colors hidden sm:block"
            >
              Feedback
            </Link>
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
          <Logo className="text-[60px]" />

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

            {/* Feedback card */}
            <Link
              href="/bugs"
              className="group flex flex-col gap-3 p-5 rounded-xl border border-dashed border-[var(--c-border)]
                         bg-[var(--c-bg-1)] hover:bg-[var(--c-bg-2)] hover:border-[var(--c-border-2)]
                         transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[20px] text-[var(--c-text-3)]">⚑</span>
                <span className="font-semibold text-[15px] text-[var(--c-text)]">Feedback</span>
                <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--c-text-3)]"
                     width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <p className="text-[13px] text-[var(--c-text-3)] leading-relaxed">
                Found a bug or have a feature idea? Tell us — we read every submission.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Teams spotlight ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#22d3ee' }}>New — Teams</p>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[var(--c-text)] tracking-tight">
              Build together, not in silos
            </h2>
            <p className="text-[14px] text-[var(--c-text-3)] mt-3 max-w-lg mx-auto leading-relaxed">
              Create a team, invite colleagues, and share your work instantly.
              No more copy-pasting server states or re-running tests from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                title: 'Shared sessions',
                desc: 'Save an MCP server snapshot and share it with your team. Teammates load it in one click — no live connection needed.',
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4m0-4h6m0 0h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4m0 0V3"/>
                  </svg>
                ),
                title: 'Shared test suites',
                desc: 'Write once, run everywhere. Share test suites with your team so everyone validates against the same tool contracts.',
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                ),
                title: 'Invite & collaborate',
                desc: 'Create a team with an invite code or direct email invite. Manage members, approve join requests, and keep your workspace organised.',
              },
            ].map((item) => (
              <div key={item.title}
                   className="flex flex-col gap-3 p-5 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-1)]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee' }}>
                  {item.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--c-text)]">{item.title}</h3>
                <p className="text-[13px] text-[var(--c-text-3)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/team"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
              style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)' }}
            >
              Go to Teams
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
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
          <div className="relative rounded-2xl border border-[var(--c-purple-border)] bg-[var(--c-purple-bg)] p-12 text-center overflow-hidden">
            {/* glow orbs */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-50"
                 style={{ background: 'radial-gradient(circle, #7c6ff7, transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-40"
                 style={{ background: 'radial-gradient(circle, #5a54c4, transparent 70%)' }} />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 rounded-full blur-3xl opacity-20"
                 style={{ background: 'radial-gradient(ellipse, #9d8fff, transparent 70%)' }} />
            <div className="relative z-10 mb-5"><Logo className="text-[36px]" /></div>
            <h2 className="relative z-10 text-[26px] font-bold text-[var(--c-text)] mb-2">Ready to ship faster?</h2>
            <p className="relative z-10 text-[14px] text-[var(--c-text-3)] mb-7 max-w-md mx-auto">
              Open the inspector now — no install, no config. Connect your MCP server URL and go.
            </p>
            <div className="relative z-10 flex items-center justify-center gap-3">
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
