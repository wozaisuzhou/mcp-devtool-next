'use client'
import { useEffect, useState, useCallback } from 'react'
import type { MCPTool, MCPResource, MCPPrompt } from '@/lib/types'

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
}

interface FullSession extends SavedSession {
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  traces: unknown[]
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
    <span className={`text-[10px] font-bold px-1.5 py-px rounded-full ${color}`}>
      {label} {count}
    </span>
  )
}

function DiffList({ title, diff }: { title: string; diff: DiffResult }) {
  const total = diff.added.length + diff.removed.length + diff.changed.length
  if (total === 0) {
    return (
      <div>
        <p className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider mb-1">{title}</p>
        <p className="text-[11px] text-[#5a5a70]">No changes</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider mb-2">
        {title}
        <span className="ml-2 font-normal normal-case">
          <DiffBadge label="+" count={diff.added.length} color="bg-[#0d2a1e] text-[#3dd68c]" />
          {' '}
          <DiffBadge label="−" count={diff.removed.length} color="bg-[#2a0d0d] text-[#f06a6a]" />
        </span>
      </p>
      <div className="flex flex-col gap-0.5">
        {diff.added.map((n) => (
          <span key={n} className="text-[11px] font-mono text-[#3dd68c]">+ {n}</span>
        ))}
        {diff.removed.map((n) => (
          <span key={n} className="text-[11px] font-mono text-[#f06a6a]">− {n}</span>
        ))}
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const [sessions, setSessions]   = useState<SavedSession[]>([])
  const [loading, setLoading]     = useState(true)
  const [compareA, setCompareA]   = useState<string>('')
  const [compareB, setCompareB]   = useState<string>('')
  const [fullA, setFullA]         = useState<FullSession | null>(null)
  const [fullB, setFullB]         = useState<FullSession | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

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

  const toolDiff     = fullA && fullB ? diffByName(fullA.tools, fullB.tools) : null
  const resourceDiff = fullA && fullB ? diffByUri(fullA.resources, fullB.resources) : null
  const promptDiff   = fullA && fullB ? diffByName(fullA.prompts, fullB.prompts) : null

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Session list ── */}
      <div className="w-80 flex-shrink-0 border-r border-[#2a2a32] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2a32] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#e8e8f0]">Saved sessions</span>
          <span className="text-[10px] text-[#5a5a70]">{sessions.length} total</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 text-[12px] text-[#5a5a70]">Loading…</div>
          )}
          {!loading && sessions.length === 0 && (
            <div className="p-6 text-center text-[12px] text-[#5a5a70]">
              <p>No saved sessions yet.</p>
              <p className="mt-1 opacity-60">Click "Save session" in the toolbar to create one.</p>
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="px-4 py-3 border-b border-[#1a1a1e] hover:bg-[#1a1a1e] group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#e8e8f0] truncate">{s.name}</p>
                  {s.label && (
                    <span className="text-[10px] bg-[#1e1c3a] text-[#7c6ff7] px-1.5 py-px rounded-full font-medium">
                      {s.label}
                    </span>
                  )}
                  <p className="text-[10px] text-[#5a5a70] font-mono mt-1 truncate">{s.server_url}</p>
                  <div className="flex gap-2 mt-1 text-[10px] text-[#9090a8]">
                    <span>{s.tool_count}T</span>
                    <span>{s.resource_count}R</span>
                    <span>{s.prompt_count}P</span>
                    <span>{s.trace_count} calls</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteSession(s.id)}
                  disabled={deletingId === s.id}
                  className="text-[10px] text-[#5a5a70] hover:text-[#f06a6a] opacity-0 group-hover:opacity-100
                             transition-all disabled:opacity-30"
                >
                  ✕
                </button>
              </div>

              {/* Compare selectors */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => setCompareA(compareA === s.id ? '' : s.id)}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                    compareA === s.id
                      ? 'bg-[#5a54c4] text-white'
                      : 'bg-[#222228] text-[#9090a8] hover:bg-[#2a2a32]'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setCompareB(compareB === s.id ? '' : s.id)}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                    compareB === s.id
                      ? 'bg-[#3d5a3e] text-[#3dd68c]'
                      : 'bg-[#222228] text-[#9090a8] hover:bg-[#2a2a32]'
                  }`}
                >
                  B
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Diff / comparison panel ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {!compareA || !compareB ? (
          <div className="flex h-full items-center justify-center text-center text-[#5a5a70]">
            <div>
              <p className="text-3xl mb-3 opacity-20">⇄</p>
              <p className="text-[13px]">Select an <strong className="text-[#5a54c4]">A</strong> and a <strong className="text-[#3dd68c]">B</strong> session to compare</p>
              <p className="text-[11px] mt-1 opacity-60">Diff shows added/removed tools, resources, and prompts</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#5a54c4] font-bold uppercase tracking-wider">A — Baseline</p>
                <p className="text-[13px] font-medium text-[#e8e8f0] truncate">
                  {sessions.find((s) => s.id === compareA)?.name ?? compareA}
                </p>
              </div>
              <span className="text-[#5a5a70]">→</span>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] text-[#3dd68c] font-bold uppercase tracking-wider">B — New version</p>
                <p className="text-[13px] font-medium text-[#e8e8f0] truncate">
                  {sessions.find((s) => s.id === compareB)?.name ?? compareB}
                </p>
              </div>
              <button
                onClick={runDiff}
                disabled={loadingDiff}
                className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[#5a54c4] text-white
                           hover:bg-[#7c6ff7] disabled:opacity-40 transition-colors flex items-center gap-2"
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
                    <div key={label} className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-3">
                      <p className="text-[10px] text-[#9090a8] mb-2">{icon} {label}</p>
                      {diff.added.length === 0 && diff.removed.length === 0 ? (
                        <p className="text-[12px] text-[#3dd68c]">✓ Identical</p>
                      ) : (
                        <div className="flex gap-2">
                          {diff.added.length > 0 && (
                            <span className="text-[11px] text-[#3dd68c]">+{diff.added.length}</span>
                          )}
                          {diff.removed.length > 0 && (
                            <span className="text-[11px] text-[#f06a6a]">−{diff.removed.length}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Detailed diffs */}
                <div className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-4 flex flex-col gap-5">
                  <DiffList title="Tools" diff={toolDiff} />
                  <DiffList title="Resources" diff={resourceDiff} />
                  <DiffList title="Prompts" diff={promptDiff} />
                </div>

                {/* Trace count comparison */}
                <div className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-4">
                  <p className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider mb-2">Recorded calls</p>
                  <div className="flex gap-6 text-[12px]">
                    <div>
                      <span className="text-[#5a54c4] font-bold">A</span>
                      <span className="text-[#e8e8f0] ml-2">{fullA?.trace_count ?? 0} calls</span>
                    </div>
                    <div>
                      <span className="text-[#3dd68c] font-bold">B</span>
                      <span className="text-[#e8e8f0] ml-2">{fullB?.trace_count ?? 0} calls</span>
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
