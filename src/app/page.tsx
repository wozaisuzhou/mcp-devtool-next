'use client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useState } from 'react'
import { SignInModal } from '@/components/SignInModal'
import { SignUpGateModal } from '@/components/SignUpGateModal'
import { Footer } from '@/components/Footer'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'
import type { RegisteredUser } from '@/hooks/useRegisteredUser'

type Modal = 'none' | 'signin' | 'signup'

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: 'Inspector',
    desc: 'Browse every tool, resource, and prompt your MCP server exposes. Call any tool live with a built-in JSON editor.',
    href: '/inspector',
    color: 'var(--c-purple)',
    bg: 'rgba(124,111,247,0.10)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Chat',
    desc: 'Test multi-turn prompts against your MCP server exactly as Claude would use them — no wiring required.',
    href: '/chat',
    color: 'var(--c-blue)',
    bg: 'rgba(96,165,250,0.10)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Trace',
    desc: 'Every JSON-RPC message logged in real time. Full diff support to spot exactly what changed between calls.',
    href: '/trace',
    color: 'var(--c-green)',
    bg: 'rgba(52,211,153,0.10)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
    title: 'Sessions',
    desc: 'Save inspection snapshots and replay them later. Share exact server states with teammates without a live connection.',
    href: '/sessions',
    color: 'var(--c-amber)',
    bg: 'rgba(251,191,36,0.10)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4m0-4h6m0 0h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4m0 0V3"/>
      </svg>
    ),
    title: 'Tests',
    desc: 'Build automated test suites against your MCP tools. Define inputs, assert outputs, and run the full suite in one click.',
    href: '/tests',
    color: 'var(--c-green)',
    bg: 'rgba(52,211,153,0.10)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    ),
    title: 'CI/CD Integration',
    desc: 'Run test suites from GitHub Actions via a single API call. Generate API keys, copy the workflow YAML, done.',
    href: '/tests',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.10)',
    badge: 'New',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Performance Analytics',
    desc: 'p50 / p95 / p99 latency per tool across saved sessions. Spot regressions instantly with side-by-side session comparison.',
    href: '/analytics',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
    badge: 'New',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: 'Monitoring & Alerts',
    desc: 'Automatically reconnect to your server hourly, diff tools and schemas against the snapshot, and alert by email or webhook on change.',
    href: '/sessions',
    color: 'var(--c-amber)',
    bg: 'rgba(251,191,36,0.10)',
    badge: 'New',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'MCP Directory',
    desc: 'A searchable public catalog of community MCP servers. Browse by tool, load any session as a starting point.',
    href: '/directory',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
    badge: 'New',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Teams',
    desc: 'Share sessions and test suites across your team. Members access shared work automatically — no manual handoff.',
    href: '/team',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.10)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'OAuth',
    desc: 'Test OAuth 2.1 PKCE flows against any provider. Inspect tokens, scopes, and callback parameters at each step.',
    href: '/oauth',
    color: '#e879f9',
    bg: 'rgba(232,121,249,0.10)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Enterprise',
    desc: 'Custom branding, higher limits, webhook alerts, and dedicated support for teams running MCP in production.',
    href: '/inspector',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.10)',
  },
]

// ── Components ─────────────────────────────────────────────────────────────────

function SectionLabel({ children, color = 'var(--c-purple)' }: { children: string; color?: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color }}>
      {children}
    </p>
  )
}

function Arrow() {
  return (
    <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--c-text-3)]"
         width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Logo className="text-[20px]" />

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/directory', label: 'Directory' },
              { href: '/analytics', label: 'Analytics' },
              { href: '/bugs',      label: 'Feedback' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="px-3 py-1.5 rounded-md text-[13px] text-[var(--c-text-3)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)] transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {ready && !user ? (
              <>
                <button onClick={() => setModal('signin')}
                  className="px-3 py-1.5 rounded-md text-[14px] font-medium text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-2)] transition-colors">
                  Sign in
                </button>
                <button onClick={() => setModal('signup')}
                  className="px-3 py-1.5 rounded-md text-[14px] font-medium bg-[var(--c-bg-2)] text-[var(--c-text)] border border-[var(--c-border)] hover:bg-[var(--c-bg-3)] transition-colors">
                  Sign up free
                </button>
              </>
            ) : ready && user ? (
              <span className="text-[13px] text-[var(--c-text-3)] hidden sm:block">{user.name ?? user.email}</span>
            ) : null}
            <Link href="/inspector"
              className="px-3 py-1.5 rounded-md text-[14px] font-semibold bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors">
              Open app →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,111,247,0.12) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col items-center gap-5 max-w-3xl">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--c-purple-border)] bg-[var(--c-purple-bg)] text-[12px] font-medium text-[var(--c-purple)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-purple-2)]" />
            CI/CD · Analytics · Monitoring · Directory — all new
          </div>

          <h1 className="text-[40px] sm:text-[52px] font-bold text-[var(--c-text)] tracking-tight leading-[1.1]">
            The professional toolkit<br className="hidden sm:block" /> for MCP server development
          </h1>

          <p className="text-[16px] text-[var(--c-text-3)] leading-relaxed max-w-[560px]">
            Inspect, test, trace, and monitor your Model Context Protocol servers —
            from local dev to production. Built for teams who ship.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link href="/inspector"
              className="px-6 py-3 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors flex items-center gap-2">
              Open Inspector
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link href="/directory"
              className="px-6 py-3 rounded-lg text-[15px] font-medium bg-[var(--c-bg-2)] text-[var(--c-text-2)] border border-[var(--c-border)] hover:bg-[var(--c-bg-3)] hover:text-[var(--c-text)] transition-colors">
              Browse MCP Directory
            </Link>
            <a href="/api/download/mac"
              className="group px-5 py-2.5 rounded-lg bg-[var(--c-bg-2)] text-[var(--c-text-2)] border border-[var(--c-border)] hover:bg-[var(--c-bg-3)] hover:text-[var(--c-text)] transition-colors flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M16.365 1.43c0 1.14-.415 2.06-1.245 2.76-.83.7-1.83 1.09-3 1.02-.06-1.11.42-2.08 1.24-2.78.82-.7 1.87-1.09 3.005-1v0zM20.6 17.14c-.42.99-.92 1.94-1.5 2.85-.79 1.22-1.44 2.06-1.94 2.52-.77.75-1.6 1.14-2.49 1.16-.64.02-1.4-.18-2.29-.6-.9-.42-1.72-.62-2.48-.62-.79 0-1.63.2-2.53.62-.9.42-1.62.64-2.16.66-.85.04-1.7-.36-2.55-1.19-.55-.5-1.23-1.37-2.05-2.62-.88-1.34-1.6-2.9-2.17-4.68C.16 13.15 0 11.4 0 9.72c0-1.92.42-3.58 1.25-4.98.65-1.12 1.52-2 2.61-2.65 1.09-.65 2.27-.98 3.54-1.01.68 0 1.57.21 2.68.63.9.34 1.5.5 1.79.5.22 0 .89-.19 2-.57 1.09-.36 2.01-.51 2.76-.45 2.04.16 3.57.96 4.6 2.4-1.83 1.1-2.73 2.65-2.72 4.63.01 1.54.57 2.83 1.65 3.84.5.47 1.05.83 1.67 1.09-.13.4-.28.78-.43 1.16z"/>
              </svg>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[15px] font-medium">Download for Mac</span>
                <span className="text-[11px] text-[var(--c-text-3)] group-hover:text-[var(--c-text-2)]">Apple Silicon · v1.0.0</span>
              </span>
            </a>
            <a href="/api/download/windows"
              className="group px-5 py-2.5 rounded-lg bg-[var(--c-bg-2)] text-[var(--c-text-2)] border border-[var(--c-border)] hover:bg-[var(--c-bg-3)] hover:text-[var(--c-text)] transition-colors flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M3 5.5L10.2 4.5V11.4H3V5.5ZM10.2 12.6V19.5L3 18.5V12.6H10.2ZM11.4 4.3L21 3V11.4H11.4V4.3ZM21 12.6V21L11.4 19.7V12.6H21Z"/>
              </svg>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[15px] font-medium">Download for Windows</span>
                <span className="text-[11px] text-[var(--c-text-3)] group-hover:text-[var(--c-text-2)]">Windows 10/11 · v1.0.0</span>
              </span>
            </a>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-center">
            {[
              { value: '4', label: 'transports supported' },
              { value: 'p99', label: 'latency tracking' },
              { value: 'Free', label: 'to start' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[22px] font-bold text-[var(--c-text)]">{value}</span>
                <span className="text-[12px] text-[var(--c-text-3)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-[30px] sm:text-[36px] font-bold text-[var(--c-text)] tracking-tight">
              Everything from dev to production
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href}
                className="group relative flex flex-col gap-3 p-5 rounded-xl border border-[var(--c-border)]
                           bg-[var(--c-bg-1)] hover:bg-[var(--c-bg-2)] hover:border-[var(--c-border-2)] transition-all duration-200">
                {f.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-1.5 py-px rounded-full"
                    style={{ background: f.bg, color: f.color }}>
                    {f.badge}
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[var(--c-text)]">{f.title}</span>
                    <Arrow />
                  </div>
                  <p className="text-[12px] text-[var(--c-text-3)] leading-relaxed">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CI/CD spotlight ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionLabel color="#f472b6">CI/CD Integration</SectionLabel>
              <h2 className="text-[28px] sm:text-[34px] font-bold text-[var(--c-text)] tracking-tight leading-tight mb-4">
                Ship with confidence.<br />Catch regressions before they reach prod.
              </h2>
              <p className="text-[14px] text-[var(--c-text-3)] leading-relaxed mb-6">
                Build test suites in the UI, generate an API key, and drop one workflow file into your repo.
                Every push runs your MCP tests automatically — no separate test framework needed.
              </p>
              <ul className="flex flex-col gap-2.5 mb-8">
                {[
                  'API key auth — generate in one click, revoke anytime',
                  'GitHub Actions YAML auto-generated with your suite ID',
                  'Returns structured JSON — pass/fail/error per test case',
                  'Fails the build if any assertion or tool call errors',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--c-text-2)]">
                    <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
                style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.25)' }}>
                Set up CI/CD
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            {/* Code snippet */}
            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-1)] overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--c-border)] bg-[var(--c-bg-2)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--c-red)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--c-amber)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--c-green)]" />
                <span className="ml-2 text-[12px] text-[var(--c-text-3)] font-mono">.github/workflows/mcp-tests.yml</span>
              </div>
              <pre className="p-5 text-[12px] font-mono text-[var(--c-text-2)] overflow-x-auto leading-relaxed">{`name: MCP Regression Tests
on: [push, pull_request]
jobs:
  mcp-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run MCP test suite
        run: |
          result=$(curl -s -X POST \\
            -H "Authorization: Bearer \\
                \${{ secrets.MCP_API_KEY }}" \\
            -d '{"serverUrl":
                "\${{ vars.MCP_SERVER_URL }}"}' \\
            https://your-app.com/api/v1/ \\
            test-suites/SUITE_ID/run)

          failed=$(echo "$result" | \\
            jq '.failed + .errors')
          if [ "$failed" -gt "0" ]; then
            exit 1
          fi`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Analytics + Monitoring ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel color="#a78bfa">Observability</SectionLabel>
            <h2 className="text-[28px] sm:text-[34px] font-bold text-[var(--c-text)] tracking-tight">
              Know your server inside out
            </h2>
            <p className="text-[14px] text-[var(--c-text-3)] mt-3 max-w-lg mx-auto leading-relaxed">
              From latency percentiles to schema drift — stay ahead of problems before your users notice them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Analytics card */}
            <div className="flex flex-col gap-4 p-6 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-1)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                   style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[var(--c-text)] mb-1">Performance Analytics</h3>
                <p className="text-[13px] text-[var(--c-text-3)] leading-relaxed">
                  p50 / p95 / p99 latency per tool across all your saved sessions. Sortable table, color-coded latency,
                  and a regression tab that compares two sessions side-by-side.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                {[
                  { tool: 'search_web',    p99: '312ms', bar: 30  },
                  { tool: 'read_file',     p99: '840ms', bar: 75  },
                  { tool: 'run_terminal',  p99: '1.2s',  bar: 100 },
                ].map(r => (
                  <div key={r.tool} className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-[var(--c-text-3)] w-28 truncate">{r.tool}</span>
                    <div className="flex-1 h-1.5 bg-[var(--c-bg-3)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--c-purple-2)]" style={{ width: `${r.bar}%` }} />
                    </div>
                    <span className="text-[11px] font-mono text-[var(--c-text-2)] w-10 text-right">{r.p99}</span>
                  </div>
                ))}
              </div>
              <Link href="/analytics"
                className="text-[13px] font-semibold text-[#a78bfa] hover:underline flex items-center gap-1 mt-1">
                View analytics →
              </Link>
            </div>

            {/* Monitoring card */}
            <div className="flex flex-col gap-4 p-6 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-1)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                   style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--c-amber)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[var(--c-text)] mb-1">Monitoring & Alerts</h3>
                <p className="text-[13px] text-[var(--c-text-3)] leading-relaxed">
                  Enable monitoring on any saved session with one click. We reconnect hourly, diff the live tool list
                  and schemas against your snapshot, and alert you the moment anything changes.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 mt-auto">
                {[
                  { label: 'Tool added',      detail: 'create_issue · just now',    color: 'var(--c-green)' },
                  { label: 'Schema changed',  detail: 'search_web input · 2h ago',  color: 'var(--c-amber)' },
                  { label: 'Tool removed',    detail: 'delete_file · yesterday',    color: 'var(--c-red)'   },
                ].map(r => (
                  <div key={r.label} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[var(--c-bg-2)] border border-[var(--c-border)]">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: r.color }} />
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--c-text)]">{r.label}</p>
                      <p className="text-[11px] text-[var(--c-text-3)] font-mono">{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/sessions"
                className="text-[13px] font-semibold text-[var(--c-amber)] hover:underline flex items-center gap-1 mt-1">
                Enable monitoring →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Directory ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto text-center">
          <SectionLabel color="#34d399">MCP Directory</SectionLabel>
          <h2 className="text-[28px] sm:text-[34px] font-bold text-[var(--c-text)] tracking-tight mb-3">
            Discover community MCP servers
          </h2>
          <p className="text-[14px] text-[var(--c-text-3)] max-w-lg mx-auto leading-relaxed mb-8">
            Browse public sessions shared by the community. Search by server name, tool, or description.
            Load any entry as a starting point — then save and extend it as your own.
          </p>
          <Link href="/directory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
            Browse the Directory
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 border-t border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl border border-[var(--c-purple-border)] bg-[var(--c-purple-bg)] px-8 py-16 text-center overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-50"
                 style={{ background: 'radial-gradient(circle, #7c6ff7, transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-40"
                 style={{ background: 'radial-gradient(circle, #5a54c4, transparent 70%)' }} />

            <div className="relative z-10">
              <h2 className="text-[28px] sm:text-[34px] font-bold text-[var(--c-text)] mb-3 tracking-tight">
                Ready to ship better MCP servers?
              </h2>
              <p className="text-[14px] text-[var(--c-text-3)] mb-8 max-w-md mx-auto leading-relaxed">
                No install, no config. Paste your server URL and start inspecting in seconds.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/inspector"
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors">
                  Open Inspector →
                </Link>
                {ready && !user && (
                  <button onClick={() => setModal('signup')}
                    className="px-6 py-3 rounded-lg text-[15px] font-medium text-[var(--c-purple)] border border-[var(--c-purple-border)] hover:bg-[var(--c-purple-hover)] transition-colors">
                    Create free account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {modal === 'signin' && (
        <SignInModal onSignedIn={handleSignedIn} onClose={() => setModal('none')} />
      )}
      {modal === 'signup' && (
        <SignUpGateModal onSignedUp={handleSignedIn} onClose={() => setModal('none')} />
      )}
    </div>
  )
}
