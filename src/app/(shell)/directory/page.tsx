'use client'
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store'
import { useRouter } from 'next/navigation'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'

interface DirectoryEntry {
  id: string
  name: string
  label: string | null
  serverName: string | null
  serverUrl: string
  transport: string | null
  toolCount: number
  resourceCount: number
  promptCount: number
  description: string | null
  publisher: string
  savedAt: string
  toolNames: string[]
}

const TRANSPORTS = ['', 'auto', 'http-sse', 'stdio'] as const

export default function DirectoryPage() {
  const router = useRouter()
  const { loadSession } = useStore()
  const { user } = useRegisteredUser()

  const [q, setQ]               = useState('')
  const [transport, setTransport] = useState('')
  const [entries, setEntries]   = useState<DirectoryEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [hasMore, setHasMore]   = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const fetchEntries = useCallback(async (nextPage = 0, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(nextPage) })
      if (q)         params.set('q', q)
      if (transport) params.set('transport', transport)
      const res  = await fetch(`/api/directory?${params}`)
      const data = await res.json()
      setEntries(prev => append ? [...prev, ...(data.entries ?? [])] : (data.entries ?? []))
      setHasMore(data.hasMore ?? false)
      setPage(nextPage)
    } finally {
      setLoading(false)
    }
  }, [q, transport])

  useEffect(() => { fetchEntries(0) }, [fetchEntries])

  async function handleLoad(entry: DirectoryEntry) {
    if (!user) return
    setLoadingId(entry.id)
    try {
      const res = await fetch(`/api/sessions/${entry.id}?userEmail=${encodeURIComponent(user.email)}`)
      if (!res.ok) return
      const { session } = await res.json()
      loadSession({
        sessionName: session.name,
        serverUrl:   session.server_url,
        transport:   session.transport ?? undefined,
        serverInfo:  session.server_name
          ? { name: session.server_name, version: session.server_version ?? '', protocolVersion: session.protocol_version ?? '' }
          : null,
        tools:     session.tools ?? [],
        resources: session.resources ?? [],
        prompts:   session.prompts ?? [],
        traces:    session.traces ?? [],
      })
      router.push('/inspector')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
        <h1 className="text-[18px] font-semibold text-[var(--c-text)]">MCP Directory</h1>
        <p className="text-[13px] text-[var(--c-text-3)] mt-0.5">
          Public catalog of MCP servers shared by the community.
        </p>

        {/* Search + filters */}
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchEntries(0)}
            placeholder="Search by name, server, or description…"
            className="flex-1 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px]
                       text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none
                       focus:border-[var(--c-purple-2)] transition-colors"
          />
          <select
            value={transport}
            onChange={e => setTransport(e.target.value)}
            className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px]
                       text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
          >
            <option value="">All transports</option>
            <option value="auto">Auto</option>
            <option value="http-sse">HTTP-SSE</option>
            <option value="stdio">stdio</option>
          </select>
          <button
            onClick={() => fetchEntries(0)}
            className="px-4 py-2 rounded-lg text-[14px] font-semibold bg-[var(--c-purple-2)] text-white
                       hover:bg-[var(--c-purple)] transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* ── Entry grid ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && entries.length === 0 && (
          <p className="text-[14px] text-[var(--c-text-3)]">Loading…</p>
        )}
        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--c-text-3)]">
            <p className="text-[15px]">No servers found.</p>
            <p className="text-[13px] mt-1 opacity-60">Publish a saved session from the Sessions tab to list it here.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(entry => (
            <div key={entry.id}
              className="flex flex-col gap-2 p-4 bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl
                         hover:border-[var(--c-purple-2)] transition-colors group">

              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--c-text)] truncate">{entry.serverName ?? entry.name}</p>
                  {entry.serverName && entry.name !== entry.serverName && (
                    <p className="text-[11px] text-[var(--c-text-3)] truncate">{entry.name}</p>
                  )}
                </div>
                {entry.transport && (
                  <span className="text-[11px] font-mono px-1.5 py-px rounded bg-[var(--c-bg-3)] text-[var(--c-text-3)] flex-shrink-0">
                    {entry.transport}
                  </span>
                )}
              </div>

              {/* Description */}
              {entry.description && (
                <p className="text-[13px] text-[var(--c-text-2)] line-clamp-2">{entry.description}</p>
              )}

              {/* Tool names */}
              {entry.toolNames.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.toolNames.map(t => (
                    <span key={t} className="text-[11px] font-mono px-1.5 py-px rounded-md
                                             bg-[var(--c-purple-bg)] text-[var(--c-purple)]">
                      {t}
                    </span>
                  ))}
                  {entry.toolCount > entry.toolNames.length && (
                    <span className="text-[11px] text-[var(--c-text-3)] px-1">
                      +{entry.toolCount - entry.toolNames.length} more
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex gap-2 text-[11px] text-[var(--c-text-3)]">
                  <span>{entry.toolCount}T</span>
                  <span>{entry.resourceCount}R</span>
                  <span>{entry.promptCount}P</span>
                  <span>· by {entry.publisher}</span>
                </div>
                {user ? (
                  <button
                    onClick={() => handleLoad(entry)}
                    disabled={loadingId === entry.id}
                    className="text-[12px] px-2.5 py-1 rounded-md font-medium bg-[var(--c-purple-bg)] text-[var(--c-purple)]
                               hover:bg-[var(--c-purple-hover)] disabled:opacity-40 transition-colors"
                  >
                    {loadingId === entry.id ? '…' : 'Load'}
                  </button>
                ) : (
                  <span className="text-[11px] text-[var(--c-text-3)]">Sign in to load</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchEntries(page + 1, true)}
              disabled={loading}
              className="px-5 py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-2)] text-[var(--c-text-2)]
                         border border-[var(--c-border)] hover:bg-[var(--c-bg-3)] disabled:opacity-40 transition-colors"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
