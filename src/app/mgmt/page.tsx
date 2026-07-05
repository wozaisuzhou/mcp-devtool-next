'use client'
import { useState, useEffect, useCallback } from 'react'
import type { UserPlan, EnterpriseLimits } from '@/lib/types'
import { PLAN_LIMITS, ENTERPRISE_DEFAULTS } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  email: string
  name: string | null
  plan: UserPlan
  enterprise_limits: EnterpriseLimits | null
  created_at: string
  usage: { sessions: number; suites: number }
}

interface AnalyticsSummary {
  total: number
  today: number
  week: number
  window: number
  uniqueVisitors: number
  signedIn: number
}

interface DailyVisit { date: string; visits: number; unique: number }
interface TopPage    { path: string; count: number }
interface RecentVisit {
  path: string
  visitorId: string
  userEmail: string | null
  referrer: string | null
  ipAddress: string | null
  createdAt: string
}

const PLANS: UserPlan[] = ['free', 'silver', 'gold', 'enterprise']

const PLAN_COLORS: Record<UserPlan, string> = {
  free:       'bg-[var(--c-bg-3)] text-[var(--c-text-2)]',
  silver:     'bg-[#e8e8f0] text-[#5555aa] dark:bg-[#2a2a44] dark:text-[#9999dd]',
  gold:       'bg-[#fdf3d0] text-[#b8860b] dark:bg-[#3a3010] dark:text-[#f0c040]',
  enterprise: 'bg-[var(--c-purple-bg)] text-[var(--c-purple)]',
}

function planLimits(plan: UserPlan, el: EnterpriseLimits | null) {
  if (plan === 'enterprise') return el ?? ENTERPRISE_DEFAULTS
  return PLAN_LIMITS[plan]
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-4 py-3">
      <p className="text-[12px] text-[var(--c-text-3)]">{label}</p>
      <p className="text-[22px] font-bold text-[var(--c-text)]">{value}</p>
      {sub && <p className="text-[11px] text-[var(--c-text-3)] mt-0.5">{sub}</p>}
    </div>
  )
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? 'bg-[var(--c-red)]' : pct >= 70 ? 'bg-yellow-400' : 'bg-[var(--c-green)]'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-[var(--c-bg-3)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] text-[var(--c-text-3)]">{used}/{limit}</span>
    </div>
  )
}

// ─── Edit plan modal ──────────────────────────────────────────────────────────

interface EditModalProps {
  user: UserRow
  onClose: () => void
  onSave: (email: string, plan: UserPlan, el: EnterpriseLimits | null) => Promise<void>
}

function EditModal({ user, onClose, onSave }: EditModalProps) {
  const [plan, setPlan] = useState<UserPlan>(user.plan)
  const [el, setEl] = useState<EnterpriseLimits>(user.enterprise_limits ?? ENTERPRISE_DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true); setError('')
    try {
      await onSave(user.email, plan, plan === 'enterprise' ? el : null)
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl shadow-2xl w-[420px] p-6">
        <h2 className="text-[16px] font-semibold text-[var(--c-text)] mb-1">Edit user plan</h2>
        <p className="text-[13px] text-[var(--c-text-3)] mb-5 break-all">{user.email}</p>

        <label className="block text-[13px] font-medium text-[var(--c-text-2)] mb-1.5">Plan</label>
        <div className="flex gap-2 mb-5 flex-wrap">
          {PLANS.map((p) => (
            <button key={p} onClick={() => setPlan(p)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors capitalize ${
                plan === p
                  ? 'border-[var(--c-purple-2)] bg-[var(--c-purple-bg)] text-[var(--c-purple)]'
                  : 'border-[var(--c-border)] text-[var(--c-text-2)] hover:border-[var(--c-purple-2)]'
              }`}
            >{p}</button>
          ))}
        </div>

        {plan === 'enterprise' ? (
          <div className="mb-5 p-4 bg-[var(--c-bg-2)] rounded-lg border border-[var(--c-border)]">
            <p className="text-[12px] font-semibold text-[var(--c-text-2)] uppercase tracking-wider mb-3">Enterprise limits</p>
            <div className="flex flex-col gap-3">
              {(['sessions', 'suites', 'casesPerSuite'] as const).map((field) => (
                <div key={field} className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-[var(--c-text-2)] w-32">
                    {field === 'casesPerSuite' ? 'Tests/suite' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input type="number" min={1} value={el[field]}
                    onChange={(e) => setEl((prev) => ({ ...prev, [field]: Number(e.target.value) }))}
                    className="w-24 text-[13px] text-right bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md px-2 py-1
                               text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
                  />
                </div>
              ))}
              <div className="border-t border-[var(--c-border)] pt-3 mt-1 flex flex-col gap-3">
                <p className="text-[12px] font-semibold text-[var(--c-text-2)] uppercase tracking-wider">Branding</p>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-[var(--c-text-2)] w-32">Brand name</label>
                  <input type="text" value={el.brand_name ?? ''}
                    onChange={(e) => setEl((prev) => ({ ...prev, brand_name: e.target.value || undefined }))}
                    placeholder="Acme Corp"
                    className="flex-1 text-[13px] bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md px-2 py-1
                               text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-[var(--c-text-2)] w-32">Logo URL</label>
                  <input type="url" value={el.logo_url ?? ''}
                    onChange={(e) => setEl((prev) => ({ ...prev, logo_url: e.target.value || undefined }))}
                    placeholder="https://..."
                    className="flex-1 text-[13px] bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md px-2 py-1
                               text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
                  />
                </div>
                {el.logo_url && (
                  <img src={el.logo_url} alt="preview" className="h-8 object-contain rounded border border-[var(--c-border)] p-1 bg-white" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 bg-[var(--c-bg-2)] rounded-lg border border-[var(--c-border)] text-[13px] text-[var(--c-text-2)]">
            <div className="flex justify-between"><span>Sessions</span><span className="font-mono">{PLAN_LIMITS[plan].sessions}</span></div>
            <div className="flex justify-between mt-1"><span>Test suites</span><span className="font-mono">{PLAN_LIMITS[plan].suites}</span></div>
            <div className="flex justify-between mt-1"><span>Tests/suite</span><span className="font-mono">{PLAN_LIMITS[plan].casesPerSuite}</span></div>
          </div>
        )}

        {error && <p className="text-[13px] text-[var(--c-red)] mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-[14px] text-[var(--c-text-2)] border border-[var(--c-border)] hover:bg-[var(--c-bg-2)] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 rounded-lg text-[14px] font-semibold bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bar chart (pure CSS, no library) ────────────────────────────────────────

function MiniBarChart({ data, valueKey, labelKey }: {
  data: Record<string, any>[]
  valueKey: string
  labelKey: string
}) {
  const max = Math.max(...data.map((d) => d[valueKey] as number), 1)
  return (
    <div className="flex items-end gap-px h-20 w-full">
      {data.map((d, i) => {
        const pct = Math.max(2, Math.round((d[valueKey] / max) * 100))
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
            <div
              className="w-full rounded-sm bg-[var(--c-purple-2)] opacity-70 group-hover:opacity-100 transition-opacity"
              style={{ height: `${pct}%` }}
            />
            {/* tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[var(--c-bg-3)] border border-[var(--c-border)]
                            text-[10px] text-[var(--c-text)] rounded px-1.5 py-0.5 whitespace-nowrap
                            opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
              {d[labelKey]}: {d[valueKey]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Traffic tab ──────────────────────────────────────────────────────────────

function TrafficTab({ adminEmail }: { adminEmail: string }) {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [dailyVisits, setDailyVisits] = useState<DailyVisit[]>([])
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([])

  const fetch_ = useCallback(async (d: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/mgmt/analytics?adminEmail=${encodeURIComponent(adminEmail)}&days=${d}`)
      const data = await res.json()
      if (res.ok) {
        setSummary(data.summary)
        setTopPages(data.topPages)
        setDailyVisits(data.dailyVisits)
        setRecentVisits(data.recentVisits)
      }
    } finally {
      setLoading(false)
    }
  }, [adminEmail])

  useEffect(() => { fetch_(days) }, [days, fetch_])

  const maxPageCount = Math.max(...topPages.map((p) => p.count), 1)

  return (
    <div className="px-6 pb-16">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[13px] text-[var(--c-text-2)]">Window:</span>
        {[7, 30, 60, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-lg text-[13px] font-medium border transition-colors ${
              days === d
                ? 'border-[var(--c-purple-2)] bg-[var(--c-purple-bg)] text-[var(--c-purple)]'
                : 'border-[var(--c-border)] text-[var(--c-text-2)] hover:border-[var(--c-purple-2)]'
            }`}
          >{d}d</button>
        ))}
        <button onClick={() => fetch_(days)}
          className="ml-auto px-3 py-1 rounded-lg text-[13px] border border-[var(--c-border)] text-[var(--c-text-2)] hover:border-[var(--c-purple-2)] transition-colors">
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-[14px] text-[var(--c-text-3)] py-8">Loading…</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="Today"            value={summary?.today ?? 0} />
            <StatCard label="This week"        value={summary?.week ?? 0} />
            <StatCard label={`Last ${days}d`}  value={summary?.window ?? 0} />
            <StatCard label="Unique visitors"  value={summary?.uniqueVisitors ?? 0} sub={`last ${days}d`} />
            <StatCard label="Signed-in visits" value={summary?.signedIn ?? 0} />
            <StatCard label="Anonymous"        value={(summary?.window ?? 0) - (summary?.signedIn ?? 0)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily chart */}
            <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-4">
              <p className="text-[13px] font-semibold text-[var(--c-text-2)] mb-3">
                Daily page views — last {days} days
              </p>
              {dailyVisits.length > 0 ? (
                <>
                  <MiniBarChart data={dailyVisits} valueKey="visits" labelKey="date" />
                  <div className="flex justify-between mt-1 text-[10px] text-[var(--c-text-3)]">
                    <span>{dailyVisits[0]?.date}</span>
                    <span>{dailyVisits[dailyVisits.length - 1]?.date}</span>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-[var(--c-text-3)]">No data yet.</p>
              )}
            </div>

            {/* Top pages */}
            <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-4">
              <p className="text-[13px] font-semibold text-[var(--c-text-2)] mb-3">Top pages</p>
              {topPages.length === 0 ? (
                <p className="text-[13px] text-[var(--c-text-3)]">No data yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {topPages.map(({ path, count }) => (
                    <div key={path} className="flex items-center gap-2">
                      <span className="text-[12px] font-mono text-[var(--c-text)] truncate flex-1 min-w-0">{path}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-24 h-1.5 rounded-full bg-[var(--c-bg-3)]">
                          <div className="h-full rounded-full bg-[var(--c-purple-2)]"
                            style={{ width: `${Math.round((count / maxPageCount) * 100)}%` }} />
                        </div>
                        <span className="text-[12px] text-[var(--c-text-3)] w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent visits */}
          <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-4">
            <p className="text-[13px] font-semibold text-[var(--c-text-2)] mb-3">Recent visits</p>
            {recentVisits.length === 0 ? (
              <p className="text-[13px] text-[var(--c-text-3)]">No visits recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--c-border)] text-left text-[var(--c-text-3)]">
                      <th className="pb-2 pr-4 font-medium">Time</th>
                      <th className="pb-2 pr-4 font-medium">Path</th>
                      <th className="pb-2 pr-4 font-medium">Visitor</th>
                      <th className="pb-2 pr-4 font-medium">IP</th>
                      <th className="pb-2 pr-4 font-medium">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVisits.map((v, i) => (
                      <tr key={i} className="border-b border-[var(--c-bg-3)] hover:bg-[var(--c-bg-3)] transition-colors">
                        <td className="py-1.5 pr-4 text-[var(--c-text-3)] whitespace-nowrap">
                          {new Date(v.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-1.5 pr-4 font-mono text-[var(--c-text)] max-w-[200px] truncate">{v.path}</td>
                        <td className="py-1.5 pr-4 text-[var(--c-text-2)] max-w-[180px] truncate">
                          {v.userEmail ?? <span className="text-[var(--c-text-3)]">anon·{v.visitorId.slice(0, 8)}</span>}
                        </td>
                        <td className="py-1.5 pr-4 font-mono text-[var(--c-text-2)] whitespace-nowrap">
                          {v.ipAddress ?? <span className="text-[var(--c-text-3)]">—</span>}
                        </td>
                        <td className="py-1.5 pr-4 text-[var(--c-text-3)] max-w-[160px] truncate">
                          {v.referrer ? (
                            <span title={v.referrer}>{v.referrer.replace(/^https?:\/\//, '').slice(0, 40)}</span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({ adminEmail }: { adminEmail: string }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [saveMsg, setSaveMsg] = useState('')

  const fetchUsers = useCallback(async (s: string, p: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ adminEmail })
      if (s) params.set('search', s)
      if (p) params.set('plan', p)
      const res = await fetch(`/api/mgmt/users?${params}`)
      const data = await res.json()
      if (res.ok) setUsers(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [adminEmail])

  useEffect(() => { fetchUsers(search, planFilter) }, [search, planFilter, fetchUsers])

  async function handleSave(email: string, plan: UserPlan, el: EnterpriseLimits | null) {
    const res = await fetch('/api/mgmt/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, email, plan, enterprise_limits: el }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Save failed')
    setUsers((prev) => prev.map((u) => u.email === email ? { ...u, plan, enterprise_limits: el } : u))
    setSaveMsg(`Updated ${email}`)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const planCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.plan] = (acc[u.plan] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="px-6 pb-16">
      {editUser && (
        <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={handleSave} />
      )}

      {saveMsg && (
        <div className="mb-4 text-[13px] text-[var(--c-green)] bg-[var(--c-green-bg)] px-3 py-1.5 rounded-lg inline-block">
          {saveMsg}
        </div>
      )}

      {/* Plan summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <StatCard label="Total users" value={users.length} />
        {PLANS.map((p) => (
          <StatCard key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} value={planCounts[p] ?? 0} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-4">
        <input type="text" placeholder="Search by email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-[13px] bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-1.5
                     text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none
                     focus:border-[var(--c-purple-2)] transition-colors w-64"
        />
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="text-[13px] bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-1.5
                     text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors">
          <option value="">All plans</option>
          {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <button onClick={() => fetchUsers(search, planFilter)}
          className="px-4 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--c-bg-2)] border border-[var(--c-border)]
                     text-[var(--c-text-2)] hover:border-[var(--c-purple-2)] transition-colors">
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-[14px] text-[var(--c-text-3)] py-8">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-[14px] text-[var(--c-text-3)] py-8">No users found.</p>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-left text-[var(--c-text-3)]">
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Sessions</th>
                <th className="pb-2 pr-4 font-medium">Suites</th>
                <th className="pb-2 pr-4 font-medium">Limits</th>
                <th className="pb-2 pr-4 font-medium">Joined</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const limits = planLimits(u.plan, u.enterprise_limits)
                return (
                  <tr key={u.email} className="border-b border-[var(--c-bg-2)] hover:bg-[var(--c-bg-2)] group transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-[var(--c-text)] max-w-[220px] truncate">{u.email}</td>
                    <td className="py-2.5 pr-4 text-[var(--c-text-2)] max-w-[140px] truncate">{u.name ?? '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold capitalize ${PLAN_COLORS[u.plan]}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4"><UsageBar used={u.usage.sessions} limit={limits.sessions} /></td>
                    <td className="py-2.5 pr-4"><UsageBar used={u.usage.suites} limit={limits.suites} /></td>
                    <td className="py-2.5 pr-4 text-[var(--c-text-3)] whitespace-nowrap">
                      {limits.sessions}s / {limits.suites}t / {limits.casesPerSuite}c
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--c-text-3)] whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <button onClick={() => setEditUser(u)}
                        className="px-3 py-1 rounded-lg text-[12px] font-medium text-[var(--c-purple)] bg-[var(--c-purple-bg)]
                                   opacity-0 group-hover:opacity-100 hover:bg-[var(--c-purple-hover)] transition-all">
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'users' | 'traffic'

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('users')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    const res = await fetch(`/api/mgmt/users?adminEmail=${encodeURIComponent(adminEmail)}`)
    if (res.status === 403) {
      setAuthError('Access denied. Your email is not in the admin list.')
      return
    }
    setAuthed(true)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <form onSubmit={handleAuth} className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-xl p-8 w-[360px] shadow-lg">
          <h1 className="text-[20px] font-bold text-[var(--c-text)] mb-1">Admin Dashboard</h1>
          <p className="text-[13px] text-[var(--c-text-3)] mb-6">Enter your admin email to continue</p>
          <input type="email" placeholder="your@email.com" value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)} required
            className="w-full text-[14px] bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg px-3 py-2
                       text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none
                       focus:border-[var(--c-purple-2)] transition-colors mb-3"
          />
          {authError && <p className="text-[13px] text-[var(--c-red)] mb-3">{authError}</p>}
          <button type="submit"
            className="w-full py-2 rounded-lg text-[14px] font-semibold bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors">
            Access dashboard
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      {/* Header */}
      <div className="border-b border-[var(--c-border)] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-[var(--c-text)]">Admin Dashboard</h1>
          <p className="text-[12px] text-[var(--c-text-3)] mt-0.5">Signed in as {adminEmail}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-[var(--c-border)] px-6 flex gap-1 pt-2">
        {(['users', 'traffic'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-[13px] font-medium rounded-t-lg transition-colors capitalize ${
              activeTab === t
                ? 'text-[var(--c-purple)] border-b-2 border-[var(--c-purple-2)]'
                : 'text-[var(--c-text-3)] hover:text-[var(--c-text-2)]'
            }`}
          >
            {t === 'users' ? 'Users' : 'Traffic'}
          </button>
        ))}
      </div>

      <div className="pt-5">
        {activeTab === 'users'   && <UsersTab   adminEmail={adminEmail} />}
        {activeTab === 'traffic' && <TrafficTab adminEmail={adminEmail} />}
      </div>
    </div>
  )
}
