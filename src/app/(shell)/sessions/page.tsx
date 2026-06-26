'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'
import type { MCPTool, MCPResource, MCPPrompt, TraceEvent } from '@/lib/types'

interface SavedSession {
  id: string
  name: string
  label: string | null
  user_email: string | null
  server_url: string
  server_name: string | null
  server_version: string | null
  protocol_version: string | null
  transport: string | null
  tool_count: number
  resource_count: number
  prompt_count: number
  trace_count: number
  saved_at: string
  team_id: string | null
  teamName?: string | null
}

interface FullSession extends SavedSession {
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  traces: TraceEvent[]
}

interface DiffResult {
  added: string[]
  removed: string[]
  changed: string[]
}

function diffByName(
  a: Array<{ name: string }>,
  b: Array<{ name: string }>
): DiffResult {
  const aNames = new Set(a.map((x) => x.name))
  const bNames = new Set(b.map((x) => x.name))
  return {
    added:   [...bNames].filter((n) => !aNames.has(n)),
    removed: [...aNames].filter((n) => !bNames.has(n)),
    changed: [],
  }
}

function diffByUri(
  a: Array<{ uri: string }>,
  b: Array<{ uri: string }>
): DiffResult {
  const aUris = new Set(a.map((x) => x.uri))
  const bUris = new Set(b.map((x) => x.uri))
  return {
    added:   [...bUris].filter((n) => !aUris.has(n)),
    removed: [...aUris].filter((n) => !bUris.has(n)),
    changed: [],
  }
}

function DiffBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null
  return (
    <span className={`text-[12px] font-bold px-1.5 py-px rounded-full ${color}`}>
      {label} {count}
    </span>
  )
}

function DiffList({ title, diff }: { title: string; diff: DiffResult }) {
  const total = diff.added.length + diff.removed.length + diff.changed.length
  if (total === 0) {
    return (
      <div>
        <p className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-1">{title}</p>
        <p className="text-[13px] text-[var(--c-text-3)]">No changes</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-2">
        {title}
        <span className="ml-2 font-normal normal-case">
          <DiffBadge label="+" count={diff.added.length} color="bg-[var(--c-green-bg)] text-[var(--c-green)]" />
          {' '}
          <DiffBadge label="−" count={diff.removed.length} color="bg-[var(--c-red-deep)] text-[var(--c-red)]" />
        </span>
      </p>
      <div className="flex flex-col gap-0.5">
        {diff.added.map((n) => (
          <span key={n} className="text-[13px] font-mono text-[var(--c-green)]">+ {n}</span>
        ))}
        {diff.removed.map((n) => (
          <span key={n} className="text-[13px] font-mono text-[var(--c-red)]">− {n}</span>
        ))}
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const router = useRouter()
  const { loadSession } = useStore()
  const { user, ready } = useRegisteredUser()
  const [sessions, setSessions]   = useState<SavedSession[]>([])
  const [loading, setLoading]     = useState(true)
  const [compareA, setCompareA]   = useState<string>('')
  const [compareB, setCompareB]   = useState<string>('')
  const [fullA, setFullA]         = useState<FullSession | null>(null)
  const [fullB, setFullB]         = useState<FullSession | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const url = `/api/sessions?userEmail=${encodeURIComponent(user.email)}`
      const res = await fetch(url)
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (ready) fetchSessions()
  }, [ready, fetchSessions])

  async function loadFull(id: string): Promise<FullSession | null> {
    const res = await fetch(`/api/sessions/${id}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.session as FullSession
  }

  async function runDiff() {
    if (!compareA || !compareB) return
    setLoadingDiff(true)
    const [a, b] = await Promise.all([loadFull(compareA), loadFull(compareB)])
    setFullA(a)
    setFullB(b)
    setLoadingDiff(false)
  }

  async function deleteSession(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (compareA === id) setCompareA('')
      if (compareB === id) setCompareB('')
      if (fullA?.id === id) setFullA(null)
      if (fullB?.id === id) setFullB(null)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleLoad(s: SavedSession) {
    setLoadingSessionId(s.id)
    try {
      const full = await loadFull(s.id)
      if (!full) return
      loadSession({
        sessionName: full.name,
        serverUrl: full.server_url,
        transport: full.transport ?? undefined,
        serverInfo: full.server_name
          ? { name: full.server_name, version: full.server_version ?? '', protocolVersion: full.protocol_version ?? '' }
          : null,
        tools: full.tools,
        resources: full.resources,
        prompts: full.prompts,
        traces: full.traces,
      })
      router.push('/inspector')
    } finally {
      setLoadingSessionId(null)
    }
  }

  const filteredSessions = search.trim()
    ? sessions.filter((s) => {
        const q = search.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          (s.label ?? '').toLowerCase().includes(q) ||
          s.server_url.toLowerCase().includes(q)
        )
      })
    : sessions

  const toolDiff     = fullA && fullB ? diffByName(fullA.tools, fullB.tools) : null
  const resourceDiff = fullA && fullB ? diffByUri(fullA.resources, fullB.resources) : null
  const promptDiff   = fullA && fullB ? diffByName(fullA.prompts, fullB.prompts) : null

  if (!ready) return null

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-center text-[var(--c-text-3)]">
        <div>
          <p className="text-3xl mb-3 opacity-20">🔒</p>
          <p className="text-[15px]">Sign in to view your saved sessions</p>
          <p className="text-[13px] mt-1 opacity-60">Use the Sign in button in the top bar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Session list ── */}
      <div className="w-80 flex-shrink-0 border-r border-[var(--c-border)] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--c-border)] flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[var(--c-text)]">Saved sessions</span>
          <span className="text-[12px] text-[var(--c-text-3)]">{sessions.length} total</span>
        </div>

        <div className="px-3 py-2 border-b border-[var(--c-border)]">
          <input
            type="text"
            placeholder="Search sessions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[13px] bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-2.5 py-1.5
                       text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none
                       focus:border-[var(--c-purple-2)] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto pb-8">
          {loading && (
            <div className="p-4 text-[14px] text-[var(--c-text-3)]">Loading…</div>
          )}
          {!loading && sessions.length === 0 && (
            <div className="p-6 text-center text-[14px] text-[var(--c-text-3)]">
              <p>No saved sessions yet.</p>
              <p className="mt-1 opacity-60">Click "Save session" in the toolbar to create one.</p>
            </div>
          )}
          {!loading && sessions.length > 0 && filteredSessions.length === 0 && (
            <div className="p-6 text-center text-[14px] text-[var(--c-text-3)]">
              No sessions match "{search}"
            </div>
          )}
          {filteredSessions.map((s) => {
            const isTeamSession = !!s.team_id
            const isOwner = s.user_email === user?.email
            const canDelete = !isTeamSession || isOwner

            return (
            <div
              key={s.id}
              className="px-4 py-3 border-b border-[var(--c-bg-2)] hover:bg-[var(--c-bg-2)] group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[14px] font-medium text-[var(--c-text)] truncate">{s.name}</p>
                    {isTeamSession && (
                      <span className="text-[11px] font-medium px-1.5 py-px rounded-full bg-[var(--c-blue-bg)] text-[var(--c-blue)] whitespace-nowrap">
                        {s.teamName ?? 'Team'}
                      </span>
                    )}
                  </div>
                  {s.label && (
                    <span className="text-[12px] bg-[var(--c-purple-bg)] text-[var(--c-purple)] px-1.5 py-px rounded-full font-medium">
                      {s.label}
                    </span>
                  )}
                  {isTeamSession && !isOwner && (
                    <p className="text-[11px] text-[var(--c-text-3)] mt-0.5 truncate">by {s.user_email}</p>
                  )}
                  <p className="text-[12px] text-[var(--c-text-3)] font-mono mt-1 truncate">{s.server_url}</p>
                  <div className="flex gap-2 mt-1 text-[12px] text-[var(--c-text-2)]">
                    <span>{s.tool_count}T</span>
                    <span>{s.resource_count}R</span>
                    <span>{s.prompt_count}P</span>
                    <span>{s.trace_count} calls</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleLoad(s)}
                    disabled={loadingSessionId === s.id}
                    className="text-[12px] px-2 py-0.5 rounded font-medium bg-[var(--c-purple-bg)] text-[var(--c-purple)]
                               opacity-0 group-hover:opacity-100 hover:bg-[var(--c-purple-hover)] transition-all
                               disabled:opacity-30"
                  >
                    {loadingSessionId === s.id ? '…' : 'Load'}
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => deleteSession(s.id)}
                      disabled={deletingId === s.id}
                      className="text-[12px] text-[var(--c-text-3)] hover:text-[var(--c-red)] opacity-0 group-hover:opacity-100
                                 transition-all disabled:opacity-30"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Compare selectors */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => setCompareA(compareA === s.id ? '' : s.id)}
                  className={`text-[12px] px-2 py-0.5 rounded font-medium transition-colors ${
                    compareA === s.id
                      ? 'bg-[var(--c-purple-2)] text-white'
                      : 'bg-[var(--c-bg-3)] text-[var(--c-text-2)] hover:bg-[var(--c-border)]'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setCompareB(compareB === s.id ? '' : s.id)}
                  className={`text-[12px] px-2 py-0.5 rounded font-medium transition-colors ${
                    compareB === s.id
                      ? 'bg-[var(--c-green-dark)] text-[var(--c-green)]'
                      : 'bg-[var(--c-bg-3)] text-[var(--c-text-2)] hover:bg-[var(--c-border)]'
                  }`}
                >
                  B
                </button>
              </div>
            </div>
          )
          })}
        </div>
      </div>

      {/* ── Diff / comparison panel ── */}
      <div className="flex-1 overflow-y-auto p-6 pb-16">
        {!compareA || !compareB ? (
          <div className="flex h-full items-center justify-center text-center text-[var(--c-text-3)]">
            <div>
              <p className="text-3xl mb-3 opacity-20">⇄</p>
              <p className="text-[15px]">Select an <strong className="text-[var(--c-purple-2)]">A</strong> and a <strong className="text-[var(--c-green)]">B</strong> session to compare</p>
              <p className="text-[13px] mt-1 opacity-60">Diff shows added/removed tools, resources, and prompts</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[var(--c-purple-2)] font-bold uppercase tracking-wider">A — Baseline</p>
                <p className="text-[15px] font-medium text-[var(--c-text)] truncate">
                  {sessions.find((s) => s.id === compareA)?.name ?? compareA}
                </p>
              </div>
              <span className="text-[var(--c-text-3)]">→</span>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] text-[var(--c-green)] font-bold uppercase tracking-wider">B — New version</p>
                <p className="text-[15px] font-medium text-[var(--c-text)] truncate">
                  {sessions.find((s) => s.id === compareB)?.name ?? compareB}
                </p>
              </div>
              <button
                onClick={runDiff}
                disabled={loadingDiff}
                className="px-4 py-1.5 rounded-lg text-[14px] font-semibold bg-[var(--c-purple-2)] text-white
                           hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {loadingDiff ? <span className="spinner" /> : '⇄'} Compare
              </button>
            </div>

            {toolDiff && resourceDiff && promptDiff && (
              <div className="flex flex-col gap-6">
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Tools', diff: toolDiff, icon: '⚙' },
                    { label: 'Resources', diff: resourceDiff, icon: '◎' },
                    { label: 'Prompts', diff: promptDiff, icon: '◈' },
                  ].map(({ label, diff, icon }) => (
                    <div key={label} className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-3">
                      <p className="text-[12px] text-[var(--c-text-2)] mb-2">{icon} {label}</p>
                      {diff.added.length === 0 && diff.removed.length === 0 ? (
                        <p className="text-[14px] text-[var(--c-green)]">✓ Identical</p>
                      ) : (
                        <div className="flex gap-2">
                          {diff.added.length > 0 && (
                            <span className="text-[13px] text-[var(--c-green)]">+{diff.added.length}</span>
                          )}
                          {diff.removed.length > 0 && (
                            <span className="text-[13px] text-[var(--c-red)]">−{diff.removed.length}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Detailed diffs */}
                <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-4 flex flex-col gap-5">
                  <DiffList title="Tools" diff={toolDiff} />
                  <DiffList title="Resources" diff={resourceDiff} />
                  <DiffList title="Prompts" diff={promptDiff} />
                </div>

                {/* Trace count comparison */}
                <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-4">
                  <p className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-2">Recorded calls</p>
                  <div className="flex gap-6 text-[14px]">
                    <div>
                      <span className="text-[var(--c-purple-2)] font-bold">A</span>
                      <span className="text-[var(--c-text)] ml-2">{fullA?.trace_count ?? 0} calls</span>
                    </div>
                    <div>
                      <span className="text-[var(--c-green)] font-bold">B</span>
                      <span className="text-[var(--c-text)] ml-2">{fullB?.trace_count ?? 0} calls</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
