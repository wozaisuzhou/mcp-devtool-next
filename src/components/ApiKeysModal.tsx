'use client'
import { useState, useEffect } from 'react'

interface ApiKey {
  id: string
  name: string
  created_at: string
  last_used_at: string | null
}

interface Props {
  userEmail: string
  onClose: () => void
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className="px-2 py-1 rounded text-[12px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                 hover:bg-[var(--c-border)] transition-colors flex-shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export function ApiKeysModal({ userEmail, onClose }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [selectedSuiteId, setSelectedSuiteId] = useState('')
  const [suites, setSuites] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch(`/api/v1/keys?userEmail=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => setKeys(d.keys ?? []))
      .finally(() => setLoading(false))

    fetch(`/api/tests/suites?userEmail=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => {
        const rows = (d.suites ?? []) as { id: string; name: string }[]
        setSuites(rows)
        if (rows.length > 0) setSelectedSuiteId(rows[0].id)
      })
      .catch(() => {})
  }, [userEmail])

  async function handleCreate() {
    if (!newName.trim() || !password) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, name: newName.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNewKey(data.key)
      setKeys(prev => [{ id: data.meta.id, name: data.meta.name, created_at: data.meta.created_at, last_used_at: null }, ...prev])
      setNewName('')
      setPassword('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id)
    try {
      await fetch(`/api/v1/keys/${id}?userEmail=${encodeURIComponent(userEmail)}`, { method: 'DELETE' })
      setKeys(prev => prev.filter(k => k.id !== id))
    } finally {
      setRevoking(null)
    }
  }

  const snippet = selectedSuiteId ? `curl -s -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"serverUrl": "https://your-mcp-server.com"}' \\
  ${APP_URL}/api/v1/test-suites/${selectedSuiteId}/run` : ''

  const ghAction = selectedSuiteId ? `name: MCP Regression Tests
on: [push, pull_request]
jobs:
  mcp-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run MCP test suite
        run: |
          result=$(curl -s -X POST \\
            -H "Authorization: Bearer \${{ secrets.MCP_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"serverUrl": "\${{ vars.MCP_SERVER_URL }}"}' \\
            ${APP_URL}/api/v1/test-suites/${selectedSuiteId}/run)
          echo "$result" | jq .
          failed=$(echo "$result" | jq '.failed + .errors')
          if [ "$failed" -gt "0" ]; then exit 1; fi` : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--c-border)] flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--c-text)]">API Keys</h2>
            <p className="text-[13px] text-[var(--c-text-3)] mt-0.5">Use these keys to run test suites from CI/CD pipelines.</p>
          </div>
          <button onClick={onClose} className="text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">

          {/* Create key */}
          <div>
            <p className="text-[13px] font-medium text-[var(--c-text-2)] mb-2">Create new key</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. GitHub Actions"
                  className="flex-1 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-[14px]
                             text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Confirm password"
                  className="flex-1 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-[14px]
                             text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
                />
                <button onClick={handleCreate} disabled={!newName.trim() || !password || creating}
                  className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-[var(--c-purple-2)] text-white
                             hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors">
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
              {createError && <p className="text-[12px] text-[var(--c-red)]">{createError}</p>}
            </div>
          </div>

          {/* New key reveal */}
          {newKey && (
            <div className="p-3 bg-[var(--c-green-bg)] border border-[var(--c-green-border,var(--c-border))] rounded-lg">
              <p className="text-[12px] font-semibold text-[var(--c-green)] mb-2">Copy this key now — it won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[12px] font-mono text-[var(--c-text)] break-all bg-[var(--c-bg-1)] rounded px-2 py-1 border border-[var(--c-border)]">
                  {newKey}
                </code>
                <CopyButton text={newKey} />
              </div>
            </div>
          )}

          {/* Key list */}
          <div>
            <p className="text-[13px] font-medium text-[var(--c-text-2)] mb-2">Your keys</p>
            {loading ? (
              <p className="text-[13px] text-[var(--c-text-3)]">Loading…</p>
            ) : keys.length === 0 ? (
              <p className="text-[13px] text-[var(--c-text-3)]">No API keys yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {keys.map(k => (
                  <div key={k.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-[var(--c-bg-2)] rounded-lg border border-[var(--c-border)]">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--c-text)] truncate">{k.name}</p>
                      <p className="text-[11px] text-[var(--c-text-3)]">
                        Created {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(k.id)}
                      disabled={revoking === k.id}
                      className="text-[12px] text-[var(--c-red)] hover:underline disabled:opacity-40 flex-shrink-0"
                    >
                      {revoking === k.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CI snippet */}
          {suites.length > 0 && (
            <div>
              <p className="text-[13px] font-medium text-[var(--c-text-2)] mb-2">Integration snippet</p>
              {suites.length > 1 && (
                <select value={selectedSuiteId} onChange={e => setSelectedSuiteId(e.target.value)}
                  className="mb-3 w-full bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-[13px]
                             text-[var(--c-text)] outline-none focus:border-[var(--c-purple-2)] transition-colors">
                  {suites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}

              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider">curl</p>
                    <CopyButton text={snippet} />
                  </div>
                  <pre className="text-[11px] font-mono bg-[var(--c-bg-3)] border border-[var(--c-border)] rounded-lg p-3 overflow-x-auto text-[var(--c-text-2)] whitespace-pre-wrap break-all">
                    {snippet}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-semibold text-[var(--c-text-3)] uppercase tracking-wider">GitHub Actions</p>
                    <CopyButton text={ghAction} />
                  </div>
                  <pre className="text-[11px] font-mono bg-[var(--c-bg-3)] border border-[var(--c-border)] rounded-lg p-3 overflow-x-auto text-[var(--c-text-2)] whitespace-pre-wrap">
                    {ghAction}
                  </pre>
                </div>
              </div>

              <p className="text-[11px] text-[var(--c-text-3)] mt-3">
                Store your key as a GitHub secret named <code className="font-mono">MCP_API_KEY</code> and your server URL as a variable named <code className="font-mono">MCP_SERVER_URL</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
