'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/store'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'
import type { TestSuite, TestCase, TestResult, TestAssertionType } from '@/lib/types'
import { PLAN_LIMITS, ENTERPRISE_DEFAULTS } from '@/lib/types'

const STORAGE_KEY = 'mcp-test-suites'

function loadLocal(): TestSuite[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveLocal(suites: TestSuite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suites))
}

function newSuite(name: string): TestSuite {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), name, description: '', cases: [], createdAt: now, updatedAt: now }
}
function newCase(toolName: string): TestCase {
  return { id: crypto.randomUUID(), name: 'Untitled test', toolName, input: '{}', assertion: { type: 'none' } }
}

function assertResult(output: unknown, assertion: TestCase['assertion']): 'pass' | 'fail' {
  if (assertion.type === 'none' || !assertion.expected) return 'pass'
  try {
    const expected = JSON.parse(assertion.expected)
    const actual = JSON.stringify(output)
    if (assertion.type === 'exact') return JSON.stringify(expected) === actual ? 'pass' : 'fail'
    if (assertion.type === 'contains') return actual.includes(JSON.stringify(expected).slice(1, -1)) ? 'pass' : 'fail'
  } catch { return 'fail' }
  return 'pass'
}

// ── DB row → TestSuite ────────────────────────────────────────────────────────

interface TestSuiteEx extends TestSuite {
  teamId?: string | null
  teamName?: string | null
  ownerEmail?: string | null
}

function rowToSuite(row: Record<string, unknown>): TestSuiteEx {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    cases: (row.cases as TestCase[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    teamId: (row.team_id as string) ?? null,
    teamName: (row.teamName as string) ?? null,
    ownerEmail: (row.user_email as string) ?? null,
  }
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: TestResult['status'] }) {
  if (!status) return (
    <span className="text-[11px] px-1.5 py-0.5 rounded font-mono bg-[var(--c-bg-3)] text-[var(--c-text-3)]">idle</span>
  )
  const map = {
    pass:  'bg-[var(--c-green-bg)] text-[var(--c-green)]',
    fail:  'bg-[var(--c-red-bg)] text-[var(--c-red)]',
    error: 'bg-[var(--c-amber-bg)] text-[var(--c-amber)]',
  }
  return <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${map[status]}`}>{status}</span>
}

// ── Test case row ─────────────────────────────────────────────────────────────

function TestCaseRow({
  tc, tools, onChange, onDelete, onRun, running,
}: {
  tc: TestCase
  tools: string[]
  onChange: (updated: TestCase) => void
  onDelete: () => void
  onRun: () => void
  running: boolean
}) {
  const [open, setOpen] = useState(false)
  const update = (patch: Partial<TestCase>) => onChange({ ...tc, ...patch })

  return (
    <div className="border border-[var(--c-border)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--c-bg-1)] cursor-pointer select-none"
           onClick={() => setOpen(o => !o)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className={`flex-shrink-0 text-[var(--c-text-3)] transition-transform ${open ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <StatusBadge status={tc.lastResult?.status} />
        <span className="flex-1 text-[13px] text-[var(--c-text)] truncate">{tc.name}</span>
        <span className="text-[12px] text-[var(--c-text-3)] font-mono truncate max-w-[160px]">{tc.toolName || '—'}</span>
        {tc.lastResult && <span className="text-[11px] text-[var(--c-text-3)]">{tc.lastResult.durationMs}ms</span>}
        <button onClick={(e) => { e.stopPropagation(); onRun() }} disabled={running || !tc.toolName}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-text-3)]
                           hover:text-[var(--c-green)] hover:bg-[var(--c-green-bg)] disabled:opacity-40
                           disabled:cursor-not-allowed transition-colors">
          {running ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-text-3)]
                           hover:text-[var(--c-red)] hover:bg-[var(--c-red-bg)] transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--c-border)] bg-[var(--c-bg-base)] p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[var(--c-text-3)] uppercase tracking-wider font-medium">Name</label>
            <input value={tc.name} onChange={e => update({ name: e.target.value })}
                   className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-1.5
                              text-[13px] text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors"/>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[var(--c-text-3)] uppercase tracking-wider font-medium">Tool</label>
            {tools.length > 0 ? (
              <select value={tc.toolName} onChange={e => update({ toolName: e.target.value })}
                      className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-1.5
                                 text-[13px] text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors">
                <option value="">— select a tool —</option>
                {tools.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input value={tc.toolName} onChange={e => update({ toolName: e.target.value })}
                     placeholder="tool_name (connect a server to pick from a list)"
                     className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-1.5
                                text-[13px] text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors
                                placeholder:text-[var(--c-text-3)]"/>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[var(--c-text-3)] uppercase tracking-wider font-medium">Input (JSON)</label>
            <textarea value={tc.input} onChange={e => update({ input: e.target.value })} rows={4} spellCheck={false}
                      className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-2
                                 text-[12px] font-mono text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)]
                                 resize-y transition-colors"/>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[var(--c-text-3)] uppercase tracking-wider font-medium">Assertion</label>
            <div className="flex gap-2">
              {(['none', 'contains', 'exact'] as TestAssertionType[]).map(t => (
                <button key={t} onClick={() => update({ assertion: { ...tc.assertion, type: t } })}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium border transition-colors
                          ${tc.assertion.type === t
                            ? 'bg-[var(--c-purple-bg)] text-[var(--c-purple)] border-[var(--c-purple-border)]'
                            : 'bg-[var(--c-bg-2)] text-[var(--c-text-2)] border-[var(--c-border)] hover:border-[var(--c-border-2)]'
                          }`}>
                  {t}
                </button>
              ))}
            </div>
            {tc.assertion.type !== 'none' && (
              <textarea value={tc.assertion.expected ?? ''} rows={3} spellCheck={false}
                        onChange={e => update({ assertion: { ...tc.assertion, expected: e.target.value } })}
                        placeholder={tc.assertion.type === 'contains'
                          ? 'JSON fragment that the output must contain'
                          : 'Exact expected JSON output'}
                        className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-2
                                   text-[12px] font-mono text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)]
                                   resize-y transition-colors placeholder:text-[var(--c-text-3)]"/>
            )}
          </div>

          {tc.lastResult && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[var(--c-text-3)] uppercase tracking-wider font-medium">Last result</label>
                <StatusBadge status={tc.lastResult.status} />
                <span className="text-[11px] text-[var(--c-text-3)]">{tc.lastResult.durationMs}ms</span>
                <span className="text-[11px] text-[var(--c-text-3)]">{new Date(tc.lastResult.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-2
                              text-[11px] font-mono text-[var(--c-text)] overflow-auto max-h-40 whitespace-pre-wrap">
                {tc.lastResult.error ?? JSON.stringify(tc.lastResult.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TestsPage() {
  const { getActiveTab } = useStore()
  const { user } = useRegisteredUser()
  const tools = getActiveTab()?.tools.map(t => t.name) ?? []

  const plan = user?.plan ?? 'free'
  const limits = plan === 'enterprise' ? ENTERPRISE_DEFAULTS : PLAN_LIMITS[plan]

  const [suites, setSuites] = useState<TestSuiteEx[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [editingName, setEditingName] = useState(false)
  const [saving, setSaving] = useState(false)
  const [limitError, setLimitError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Team sharing
  const [myTeams, setMyTeams] = useState<{ id: string; name: string }[]>([])
  const [shareTarget, setShareTarget] = useState<string | null>(null) // suiteId being shared
  const [shareTeamId, setShareTeamId] = useState('')
  const [sharing, setSharing] = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadSuites = useCallback(() => {
    if (!user) {
      const local = loadLocal()
      setSuites(local)
      if (local.length > 0) setSelectedId(s => s ?? local[0].id)
      return
    }
    fetch(`/api/tests/suites?userEmail=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(({ suites: rows }) => {
        const loaded: TestSuiteEx[] = (rows ?? []).map(rowToSuite)
        setSuites(loaded)
        if (loaded.length > 0) setSelectedId(s => s ?? loaded[0].id)
      })
      .catch(() => {
        const local = loadLocal()
        setSuites(local)
        if (local.length > 0) setSelectedId(s => s ?? local[0].id)
      })
    fetch(`/api/teams?userEmail=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => setMyTeams(d.teams ?? []))
      .catch(() => {})
  }, [user])

  useEffect(() => { loadSuites() }, [loadSuites])

  // ── Persist ───────────────────────────────────────────────────────────────
  // Debounced so rapid edits (typing in the name/input fields) don't fire a
  // request on every keystroke.

  const persist = useCallback((updated: TestSuite[], changedSuite?: TestSuite) => {
    setSuites(updated)
    if (!user) { saveLocal(updated); return }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!changedSuite) return
      setSaving(true)
      try {
        await fetch(`/api/tests/suites/${changedSuite.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: changedSuite.name,
            description: changedSuite.description,
            cases: changedSuite.cases,
          }),
        })
      } finally {
        setSaving(false)
      }
    }, 600)
  }, [user])

  const selected = suites.find(s => s.id === selectedId) ?? null
  const isReadOnly = !!selected?.teamId && selected?.ownerEmail !== user?.email

  // ── Suite CRUD ────────────────────────────────────────────────────────────

  async function addSuite() {
    setLimitError(null)
    const base = newSuite('New suite')
    if (user) {
      const res = await fetch('/api/tests/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, name: base.name, description: '', cases: [] }),
      })
      const data = await res.json()
      if (!res.ok) { setLimitError(data.error ?? 'Failed to create suite'); return }
      const s = rowToSuite(data.suite)
      setSuites(prev => [...prev, s])
      setSelectedId(s.id)
    } else {
      setSuites(prev => { const next = [...prev, base]; saveLocal(next); return next })
      setSelectedId(base.id)
    }
  }

  async function deleteSuite(id: string) {
    if (user) {
      await fetch(`/api/tests/suites/${id}`, { method: 'DELETE' })
    }
    setSuites(prev => {
      const next = prev.filter(s => s.id !== id)
      if (!user) saveLocal(next)
      return next
    })
    if (selectedId === id) setSelectedId(suites.find(s => s.id !== id)?.id ?? null)
  }

  async function shareSuite(suiteId: string, teamId: string | null) {
    if (!user) return
    setSharing(true)
    try {
      const res = await fetch(`/api/tests/suites/${suiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userEmail: user.email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setLimitError(data.error ?? 'Failed to update sharing')
        return
      }
      setSuites(prev => prev.map(s => {
        if (s.id !== suiteId) return s
        const team = myTeams.find(t => t.id === teamId)
        return { ...s, teamId: teamId ?? null, teamName: team?.name ?? null }
      }))
      setShareTarget(null)
    } finally {
      setSharing(false)
    }
  }

  function patchSuite(patch: Partial<TestSuite>) {
    if (!selected) return
    const updated = { ...selected, ...patch, updatedAt: new Date().toISOString() }
    const next = suites.map(s => s.id === selected.id ? updated : s)
    persist(next, updated)
  }

  function addCase() {
    if (!selected) return
    patchSuite({ cases: [...selected.cases, newCase(tools[0] ?? '')] })
  }

  function updateCase(tc: TestCase) {
    if (!selected) return
    patchSuite({ cases: selected.cases.map(c => c.id === tc.id ? tc : c) })
  }

  function deleteCase(id: string) {
    if (!selected) return
    patchSuite({ cases: selected.cases.filter(c => c.id !== id) })
  }

  // ── Run ───────────────────────────────────────────────────────────────────

  async function runCase(tc: TestCase): Promise<TestResult> {
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(tc.input || '{}') }
    catch { return { status: 'error', error: 'Invalid JSON input', durationMs: 0, timestamp: new Date().toISOString() } }

    const start = performance.now()
    try {
      const res = await fetch('/api/proxy/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: tc.toolName, input: parsed }),
      })
      const data = await res.json()
      const durationMs = Math.round(performance.now() - start)
      if (!res.ok) return { status: 'error', error: data.error ?? 'Request failed', output: data, durationMs, timestamp: new Date().toISOString() }
      return { status: assertResult(data.result, tc.assertion), output: data.result, durationMs, timestamp: new Date().toISOString() }
    } catch (err) {
      const durationMs = Math.round(performance.now() - start)
      return { status: 'error', error: err instanceof Error ? err.message : 'Network error', durationMs, timestamp: new Date().toISOString() }
    }
  }

  async function handleRunCase(tc: TestCase) {
    setRunningIds(prev => new Set(prev).add(tc.id))
    const result = await runCase(tc)
    updateCase({ ...tc, lastResult: result })
    setRunningIds(prev => { const s = new Set(prev); s.delete(tc.id); return s })
  }

  async function handleRunAll() {
    if (!selected) return
    for (const tc of selected.cases) {
      if (!tc.toolName) continue
      await handleRunCase(tc)
    }
  }

  const passCount = selected?.cases.filter(c => c.lastResult?.status === 'pass').length ?? 0
  const failCount = selected?.cases.filter(c => ['fail', 'error'].includes(c.lastResult?.status ?? '')).length ?? 0

  const suiteAtLimit = !!user && suites.length >= limits.suites
  const caseAtLimit  = !!user && (selected?.cases.length ?? 0) >= limits.casesPerSuite

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Suite list ── */}
      <aside className="w-56 flex-shrink-0 border-r border-[var(--c-border)] flex flex-col bg-[var(--c-bg-1)]">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--c-border)]">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--c-text-2)] uppercase tracking-wider">Suites</span>
            {user && (
              <span className={`text-[11px] font-mono ${suiteAtLimit ? 'text-[var(--c-red)]' : 'text-[var(--c-text-3)]'}`}>
                {suites.length}/{limits.suites}
              </span>
            )}
            {saving && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   className="animate-spin text-[var(--c-text-3)]">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={loadSuites} title="Refresh suites"
                    className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-text-3)]
                               hover:text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)] transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
              </svg>
            </button>
            <button onClick={addSuite} disabled={suiteAtLimit} title={suiteAtLimit ? `Limit reached (${limits.suites} suites)` : 'New suite'}
                    className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-text-3)]
                               hover:text-[var(--c-purple)] hover:bg-[var(--c-purple-bg)]
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Limit / auth hint */}
        {limitError && (
          <div className="px-3 py-2 border-b border-[var(--c-border)] bg-[var(--c-red-bg)]">
            <p className="text-[11px] text-[var(--c-red)] leading-snug">{limitError}</p>
          </div>
        )}
        {!user && (
          <div className="px-3 py-2 border-b border-[var(--c-border)] bg-[var(--c-amber-bg)]">
            <p className="text-[11px] text-[var(--c-amber)] leading-snug">Sign in to sync suites across devices</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          {suites.length === 0 && (
            <p className="text-[12px] text-[var(--c-text-3)] text-center mt-6 px-3">
              No suites yet.<br/>Click + to create one.
            </p>
          )}
          {suites.map(s => {
            const isTeam = !!s.teamId
            const isOwned = s.ownerEmail === user?.email || !s.ownerEmail
            return (
            <div key={s.id} onClick={() => setSelectedId(s.id)}
                 className={`group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors
                   ${selectedId === s.id
                     ? 'bg-[var(--c-bg-3)] text-[var(--c-text)]'
                     : 'text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)] hover:text-[var(--c-text)]'
                   }`}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] truncate">{s.name}</p>
                {isTeam && (
                  <p className="text-[10px] text-[var(--c-blue)] truncate">{s.teamName ?? 'Team'}</p>
                )}
              </div>
              <span className="text-[11px] text-[var(--c-text-3)] flex-shrink-0">{s.cases.length}</span>
              {/* Share button — only for owned personal suites when in teams */}
              {isOwned && myTeams.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShareTarget(s.id); setShareTeamId(s.teamId ?? '') }}
                  title={isTeam ? 'Change sharing' : 'Share with team'}
                  className={`opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded
                             transition-colors ${isTeam ? 'text-[var(--c-blue)]' : 'text-[var(--c-text-3)] hover:text-[var(--c-purple)]'}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
              )}
              {isOwned && (
                <button onClick={(e) => { e.stopPropagation(); deleteSuite(s.id) }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded
                                   text-[var(--c-text-3)] hover:text-[var(--c-red)] hover:bg-[var(--c-red-bg)] transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            )
          })}
        </div>
      </aside>

      {/* ── Suite detail ── */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {isReadOnly && (
            <div className="px-6 py-2 border-b border-[var(--c-border)] bg-[var(--c-blue-bg)] flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-blue)] flex-shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-[12px] text-[var(--c-blue)]">
                Shared by <strong>{selected.ownerEmail}</strong> via <strong>{selected.teamName}</strong> — read only
              </span>
            </div>
          )}
          <div className="flex items-start gap-4 px-6 py-4 border-b border-[var(--c-border)] bg-[var(--c-bg-1)] flex-shrink-0">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              {editingName && !isReadOnly ? (
                <input autoFocus value={selected.name} onChange={e => patchSuite({ name: e.target.value })}
                       onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                       className="text-[18px] font-bold text-[var(--c-text)] bg-transparent border-b border-[var(--c-purple-2)] outline-none w-full"/>
              ) : (
                <h1 onClick={() => !isReadOnly && setEditingName(true)} title={isReadOnly ? undefined : 'Click to rename'}
                    className={`text-[18px] font-bold text-[var(--c-text)] truncate ${isReadOnly ? '' : 'cursor-text hover:text-[var(--c-purple)] transition-colors'}`}>
                  {selected.name}
                </h1>
              )}
              <input value={selected.description ?? ''} onChange={e => !isReadOnly && patchSuite({ description: e.target.value })}
                     placeholder={isReadOnly ? '' : 'Add a description…'}
                     readOnly={isReadOnly}
                     className="text-[13px] text-[var(--c-text-3)] bg-transparent outline-none placeholder:text-[var(--c-text-3)]
                                hover:text-[var(--c-text-2)] focus:text-[var(--c-text-2)] transition-colors"/>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {selected.cases.some(c => c.lastResult) && (
                <div className="flex items-center gap-2 text-[12px]">
                  {passCount > 0 && <span className="text-[var(--c-green)]">{passCount} passed</span>}
                  {failCount > 0 && <span className="text-[var(--c-red)]">{failCount} failed</span>}
                </div>
              )}
              <button onClick={addCase} disabled={caseAtLimit || isReadOnly}
                      title={caseAtLimit ? `Limit reached (${limits.casesPerSuite} tests per suite)` : undefined}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium
                                 bg-[var(--c-bg-2)] text-[var(--c-text-2)] border border-[var(--c-border)]
                                 hover:text-[var(--c-text)] hover:border-[var(--c-border-2)]
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add test
                {user && (
                  <span className={`text-[11px] font-mono ml-0.5 ${caseAtLimit ? 'text-[var(--c-red)]' : 'text-[var(--c-text-3)]'}`}>
                    {selected?.cases.length ?? 0}/{limits.casesPerSuite}
                  </span>
                )}
              </button>
              <button onClick={handleRunAll} disabled={selected.cases.length === 0 || runningIds.size > 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium
                                 bg-[var(--c-purple-bg)] text-[var(--c-purple)] border border-[var(--c-purple-border)]
                                 hover:bg-[var(--c-purple-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Run all
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {selected.cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
                     strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-text-3)]">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4m0-4h6m0 0h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4m0 0V3"/>
                </svg>
                <div>
                  <p className="text-[14px] font-medium text-[var(--c-text-2)]">No test cases yet</p>
                  <p className="text-[12px] text-[var(--c-text-3)] mt-1">Add a test to call a tool and assert its output</p>
                </div>
                <button onClick={addCase}
                        className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium
                                   bg-[var(--c-purple-bg)] text-[var(--c-purple)] border border-[var(--c-purple-border)]
                                   hover:bg-[var(--c-purple-hover)] transition-colors">
                  Add first test case
                </button>
              </div>
            ) : (
              selected.cases.map(tc => (
                <TestCaseRow key={tc.id} tc={tc} tools={tools} onChange={updateCase}
                             onDelete={() => deleteCase(tc.id)} onRun={() => handleRunCase(tc)}
                             running={runningIds.has(tc.id)}/>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-[14px] font-medium text-[var(--c-text-2)]">No suite selected</p>
            <p className="text-[12px] text-[var(--c-text-3)] mt-1">Create a suite to get started</p>
            <button onClick={addSuite}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium mx-auto
                               bg-[var(--c-purple-bg)] text-[var(--c-purple)] border border-[var(--c-purple-border)]
                               hover:bg-[var(--c-purple-hover)] transition-colors">
              New suite
            </button>
          </div>
        </div>
      )}

      {/* ── Share suite dialog ── */}
      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
             onClick={e => e.target === e.currentTarget && setShareTarget(null)}>
          <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <h2 className="text-[16px] font-bold text-[var(--c-text)]">Share suite</h2>
            <select
              value={shareTeamId}
              onChange={e => setShareTeamId(e.target.value)}
              className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px]
                         text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
            >
              <option value="">Private (only me)</option>
              {myTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShareTarget(null)}
                className="px-3 py-1.5 text-[13px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)] rounded-md hover:bg-[var(--c-border)] transition-colors">
                Cancel
              </button>
              <button onClick={() => shareSuite(shareTarget, shareTeamId || null)} disabled={sharing}
                className="px-3 py-1.5 text-[13px] font-semibold bg-[var(--c-purple-2)] text-white rounded-md hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors">
                {sharing ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
