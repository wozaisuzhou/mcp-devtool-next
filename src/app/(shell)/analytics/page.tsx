'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'

interface ToolStat {
  name: string
  calls: number
  errors: number
  errorRate: number
  p50: number
  p95: number
  p99: number
  avg: number
}

interface Session { id: string; name: string; savedAt: string; traceCount: number }
interface Totals  { calls: number; errors: number; errorRate: number; p99: number }

type SortKey = 'name' | 'calls' | 'p50' | 'p95' | 'p99' | 'errorRate'

function ms(v: number) { return `${v}ms` }
function pctColor(v: number) {
  if (v === 0) return 'text-[var(--c-text-3)]'
  if (v < 5)  return 'text-[var(--c-green)]'
  if (v < 15) return 'text-[var(--c-amber)]'
  return 'text-[var(--c-red)]'
}
function latencyColor(v: number) {
  if (v < 200)  return 'text-[var(--c-green)]'
  if (v < 1000) return 'text-[var(--c-amber)]'
  return 'text-[var(--c-red)]'
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl">
      <span className="text-[12px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider">{label}</span>
      <span className="text-[22px] font-bold text-[var(--c-text)]">{value}</span>
      {sub && <span className="text-[12px] text-[var(--c-text-3)]">{sub}</span>}
    </div>
  )
}

function LatencyBar({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[var(--c-bg-3)] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[var(--c-purple-2)]" style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[12px] font-mono w-16 text-right ${latencyColor(value)}`}>{ms(value)}</span>
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ userEmail }: { userEmail: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tools, setTools]       = useState<ToolStat[]>([])
  const [totals, setTotals]     = useState<Totals | null>(null)
  const [loading, setLoading]   = useState(true)
  const [sort, setSort]         = useState<SortKey>('p99')
  const [sortAsc, setSortAsc]   = useState(false)

  const fetchData = useCallback(async (ids?: string[]) => {
    setLoading(true)
    const params = new URLSearchParams({ userEmail })
    if (ids?.length) params.set('sessionIds', ids.join(','))
    const res  = await fetch(`/api/analytics?${params}`)
    const data = await res.json()
    setSessions(data.sessions ?? [])
    setTools(data.tools ?? [])
    setTotals(data.totals ?? null)
    setLoading(false)
  }, [userEmail])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleSession(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
    fetchData(next.size ? [...next] : undefined)
  }

  function setHeaderSort(key: SortKey) {
    if (sort === key) setSortAsc(a => !a)
    else { setSort(key); setSortAsc(false) }
  }

  const sorted = [...tools].sort((a, b) => {
    const v = sort === 'name' ? a.name.localeCompare(b.name) : (a[sort] as number) - (b[sort] as number)
    return sortAsc ? v : -v
  })
  const maxP99 = tools.length ? Math.max(...tools.map(t => t.p99)) : 0

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th onClick={() => setHeaderSort(k)}
      className="px-3 py-2 text-left text-[11px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider cursor-pointer select-none hover:text-[var(--c-text)] transition-colors whitespace-nowrap">
      {label}{sort === k ? (sortAsc ? ' ▲' : ' ▼') : ''}
    </th>
  )

  return (
    <div className="flex gap-5 h-full overflow-hidden">

      {/* Session filter sidebar */}
      <div className="w-52 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
        <p className="text-[12px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider mt-1">Sessions</p>
        <button onClick={() => { setSelected(new Set()); fetchData() }}
          className={`text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
            selected.size === 0 ? 'bg-[var(--c-purple-bg)] text-[var(--c-purple)] font-medium' : 'text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)]'
          }`}>
          All sessions
        </button>
        {sessions.map(s => (
          <button key={s.id} onClick={() => toggleSession(s.id)}
            className={`text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
              selected.has(s.id) ? 'bg-[var(--c-purple-bg)] text-[var(--c-purple)] font-medium' : 'text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)]'
            }`}>
            <span className="block truncate">{s.name}</span>
            <span className="block text-[11px] text-[var(--c-text-3)]">{s.traceCount} calls</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto min-w-0">

        {/* Summary cards */}
        {totals && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total calls"  value={totals.calls} />
            <StatCard label="Error rate"   value={`${totals.errorRate}%`} sub={`${totals.errors} errors`} />
            <StatCard label="Max p99"      value={ms(totals.p99)} />
            <StatCard label="Tools"        value={tools.length} />
          </div>
        )}

        {/* Per-tool table */}
        {loading ? (
          <p className="text-[14px] text-[var(--c-text-3)]">Loading…</p>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[var(--c-text-3)] text-center">
            <p className="text-[15px]">No trace data yet.</p>
            <p className="text-[13px] mt-1 opacity-60">Call tools in the Inspector, then save the session.</p>
          </div>
        ) : (
          <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="border-b border-[var(--c-border)] bg-[var(--c-bg-2)]">
                <tr>
                  <Th label="Tool"       k="name" />
                  <Th label="Calls"      k="calls" />
                  <Th label="p50"        k="p50" />
                  <Th label="p95"        k="p95" />
                  <Th label="p99 + bar"  k="p99" />
                  <Th label="Error rate" k="errorRate" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => (
                  <tr key={t.name}
                    className={`border-b border-[var(--c-border)] last:border-0 hover:bg-[var(--c-bg-2)] transition-colors ${i % 2 === 0 ? '' : 'bg-[var(--c-bg-1)]'}`}>
                    <td className="px-3 py-2.5 text-[13px] font-mono text-[var(--c-text)] max-w-[180px] truncate">{t.name}</td>
                    <td className="px-3 py-2.5 text-[13px] text-[var(--c-text-2)] text-right">{t.calls}</td>
                    <td className={`px-3 py-2.5 text-[12px] font-mono text-right ${latencyColor(t.p50)}`}>{ms(t.p50)}</td>
                    <td className={`px-3 py-2.5 text-[12px] font-mono text-right ${latencyColor(t.p95)}`}>{ms(t.p95)}</td>
                    <td className="px-3 py-2.5 min-w-[160px]"><LatencyBar value={t.p99} max={maxP99} /></td>
                    <td className={`px-3 py-2.5 text-[12px] font-mono text-right ${pctColor(t.errorRate)}`}>{t.errorRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Regression tab ────────────────────────────────────────────────────────────

function RegressionTab({ userEmail }: { userEmail: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selA, setSelA]         = useState('')
  const [selB, setSelB]         = useState('')
  const [dataA, setDataA]       = useState<{ name: string; tools: ToolStat[] } | null>(null)
  const [dataB, setDataB]       = useState<{ name: string; tools: ToolStat[] } | null>(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    fetch(`/api/analytics?userEmail=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions ?? []))
  }, [userEmail])

  async function compare() {
    if (!selA || !selB || selA === selB) return
    setLoading(true)
    const params = new URLSearchParams({ userEmail, compareA: selA, compareB: selB })
    const res  = await fetch(`/api/analytics?${params}`)
    const data = await res.json()
    setDataA(data.sessionA)
    setDataB(data.sessionB)
    setLoading(false)
  }

  const allTools = dataA && dataB
    ? [...new Set([...dataA.tools.map(t => t.name), ...dataB.tools.map(t => t.name)])]
    : []

  function getDelta(toolName: string, key: 'p50' | 'p99') {
    const a = dataA?.tools.find(t => t.name === toolName)?.[key] ?? 0
    const b = dataB?.tools.find(t => t.name === toolName)?.[key] ?? 0
    if (!a || !b) return null
    const delta = b - a
    const pct   = Math.round((delta / a) * 100)
    return { delta, pct }
  }

  return (
    <div className="flex flex-col gap-5 overflow-y-auto h-full">

      {/* Pickers */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider">Baseline (A)</label>
          <select value={selA} onChange={e => setSelA(e.target.value)}
            className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px]
                       text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors min-w-[200px]">
            <option value="">Select session…</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider">Compare (B)</label>
          <select value={selB} onChange={e => setSelB(e.target.value)}
            className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px]
                       text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors min-w-[200px]">
            <option value="">Select session…</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={compare} disabled={!selA || !selB || selA === selB || loading}
          className="px-4 py-2 rounded-lg text-[14px] font-semibold bg-[var(--c-purple-2)] text-white
                     hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors">
          {loading ? 'Comparing…' : 'Compare'}
        </button>
      </div>

      {/* Regression table */}
      {dataA && dataB && allTools.length > 0 && (
        <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-[var(--c-border)] bg-[var(--c-bg-2)]">
            {['Tool', `A · ${dataA.name}`, `B · ${dataB.name}`, 'Δ p99'].map(h => (
              <div key={h} className="px-3 py-2 text-[11px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider truncate">{h}</div>
            ))}
          </div>
          {allTools.map((toolName, i) => {
            const a    = dataA.tools.find(t => t.name === toolName)
            const b    = dataB.tools.find(t => t.name === toolName)
            const diff = getDelta(toolName, 'p99')
            const isRegression = diff && diff.pct > 20
            const isImproved   = diff && diff.pct < -10
            return (
              <div key={toolName}
                className={`grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-[var(--c-border)] last:border-0 items-center
                  ${isRegression ? 'bg-[var(--c-red-bg-4)]' : isImproved ? 'bg-[var(--c-green-bg)]' : i % 2 === 0 ? '' : 'bg-[var(--c-bg-1)]'}`}>
                <div className="px-3 py-2.5 text-[13px] font-mono text-[var(--c-text)] truncate">{toolName}</div>
                <div className="px-3 py-2.5 text-[12px] font-mono text-[var(--c-text-2)]">
                  {a ? <><span className={latencyColor(a.p99)}>{ms(a.p99)}</span> p99 · {a.calls} calls</> : <span className="text-[var(--c-text-3)]">—</span>}
                </div>
                <div className="px-3 py-2.5 text-[12px] font-mono text-[var(--c-text-2)]">
                  {b ? <><span className={latencyColor(b.p99)}>{ms(b.p99)}</span> p99 · {b.calls} calls</> : <span className="text-[var(--c-text-3)]">—</span>}
                </div>
                <div className="px-3 py-2.5 text-[13px] font-mono font-semibold">
                  {diff ? (
                    <span className={diff.pct > 0 ? 'text-[var(--c-red)]' : diff.pct < 0 ? 'text-[var(--c-green)]' : 'text-[var(--c-text-3)]'}>
                      {diff.pct > 0 ? '+' : ''}{diff.pct}% ({diff.delta > 0 ? '+' : ''}{diff.delta}ms)
                    </span>
                  ) : <span className="text-[var(--c-text-3)]">—</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {dataA && dataB && allTools.length === 0 && (
        <p className="text-[14px] text-[var(--c-text-3)]">No tool traces in these sessions to compare.</p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, ready } = useRegisteredUser()
  const [tab, setTab]   = useState<'overview' | 'regression'>('overview')

  if (!ready) return null
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-center text-[var(--c-text-3)]">
        <div>
          <p className="text-3xl mb-3 opacity-20">📊</p>
          <p className="text-[15px]">Sign in to view performance analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--c-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-[var(--c-text)]">Performance Analytics</h1>
            <p className="text-[13px] text-[var(--c-text-3)] mt-0.5">p50/p95/p99 latency and error rates across your saved sessions.</p>
          </div>
          <div className="flex gap-1 bg-[var(--c-bg-2)] rounded-lg p-1 border border-[var(--c-border)]">
            {(['overview', 'regression'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors capitalize ${
                  tab === t
                    ? 'bg-[var(--c-bg-1)] text-[var(--c-text)] shadow-sm border border-[var(--c-border)]'
                    : 'text-[var(--c-text-3)] hover:text-[var(--c-text)]'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 py-5">
        {tab === 'overview'    && <OverviewTab   userEmail={user.email} />}
        {tab === 'regression'  && <RegressionTab userEmail={user.email} />}
      </div>
    </div>
  )
}
