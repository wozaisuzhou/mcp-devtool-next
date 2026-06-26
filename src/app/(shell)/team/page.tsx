'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'
import type { TeamWithMembers, TeamJoinRequest } from '@/lib/types'

interface TeamListItem {
  id: string
  name: string
  ownerEmail: string
  inviteCode?: string
  createdAt: string
  myRole: 'owner' | 'member'
}

export default function TeamPage() {
  const { user, ready } = useRegisteredUser()
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<(TeamWithMembers & { myRole: 'owner' | 'member' }) | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Create team dialog
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Join team dialog
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinPendingTeam, setJoinPendingTeam] = useState<string | null>(null)

  // Invite member
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Rename
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const [copied, setCopied] = useState(false)
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    if (!user) return
    setLoadingTeams(true)
    try {
      const res = await fetch(`/api/teams?userEmail=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      setTeams(data.teams ?? [])
      if (data.teams?.length > 0 && !selectedId) setSelectedId(data.teams[0].id)
    } finally {
      setLoadingTeams(false)
    }
  }, [user, selectedId])

  useEffect(() => { if (ready) fetchTeams() }, [ready, fetchTeams])

  const fetchDetail = useCallback(async (id: string) => {
    if (!user) return
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/teams/${id}?userEmail=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      if (data.team) setDetail(data.team)
    } finally {
      setLoadingDetail(false)
    }
  }, [user])

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
    else setDetail(null)
  }, [selectedId, fetchDetail])

  async function createTeam() {
    if (!user || !createName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), ownerEmail: user.email }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error ?? 'Failed to create'); return }
      setTeams(prev => [...prev, data.team])
      setSelectedId(data.team.id)
      setShowCreate(false)
      setCreateName('')
    } finally {
      setCreating(false)
    }
  }

  async function joinTeam() {
    if (!user || !joinCode.trim()) return
    setJoining(true)
    setJoinError('')
    setJoinPendingTeam(null)
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, inviteCode: joinCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? 'Invalid code'); return }
      // Request is pending — don't close the dialog, show confirmation instead
      setJoinPendingTeam(data.teamName)
      setJoinCode('')
    } finally {
      setJoining(false)
    }
  }

  async function deleteTeam(id: string) {
    if (!user) return
    setDeletingTeamId(id)
    try {
      await fetch(`/api/teams/${id}?userEmail=${encodeURIComponent(user.email)}`, { method: 'DELETE' })
      setTeams(prev => prev.filter(t => t.id !== id))
      if (selectedId === id) { setSelectedId(null); setDetail(null) }
    } finally {
      setDeletingTeamId(null)
    }
  }

  async function leaveTeam(id: string) {
    if (!user) return
    setDeletingTeamId(id)
    try {
      await fetch(`/api/teams/${id}/members?userEmail=${encodeURIComponent(user.email)}&targetEmail=${encodeURIComponent(user.email)}`, { method: 'DELETE' })
      setTeams(prev => prev.filter(t => t.id !== id))
      if (selectedId === id) { setSelectedId(null); setDetail(null) }
    } finally {
      setDeletingTeamId(null)
    }
  }

  async function inviteMember() {
    if (!user || !detail || !inviteEmail.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess(false)
    try {
      const res = await fetch(`/api/teams/${detail.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: user.email, inviteeEmail: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error ?? 'Failed to invite'); return }
      setInviteSuccess(true)
      setInviteEmail('')
      fetchDetail(detail.id)
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(targetEmail: string) {
    if (!user || !detail) return
    setRemovingEmail(targetEmail)
    try {
      await fetch(`/api/teams/${detail.id}/members?userEmail=${encodeURIComponent(user.email)}&targetEmail=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' })
      fetchDetail(detail.id)
    } finally {
      setRemovingEmail(null)
    }
  }

  async function processRequest(requestId: string, action: 'approve' | 'reject') {
    if (!user || !detail) return
    setProcessingRequestId(requestId)
    try {
      await fetch(`/api/teams/${detail.id}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: user.email, requestId, action }),
      })
      fetchDetail(detail.id)
    } finally {
      setProcessingRequestId(null)
    }
  }

  async function renameTeam(id: string) {
    if (!user || !renameValue.trim()) { setRenamingId(null); return }
    await fetch(`/api/teams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameValue.trim(), userEmail: user.email }),
    })
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name: renameValue.trim() } : t))
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, name: renameValue.trim() } : prev)
    setRenamingId(null)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!ready) return null

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-center text-[var(--c-text-3)]">
        <div>
          <p className="text-3xl mb-3 opacity-20">👥</p>
          <p className="text-[15px]">Sign in to create or join a team</p>
          <p className="text-[13px] mt-1 opacity-60">Use the Sign in button in the top bar</p>
        </div>
      </div>
    )
  }

  const pendingCount = detail?.joinRequests?.length ?? 0

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Team list ── */}
      <aside className="w-64 flex-shrink-0 border-r border-[var(--c-border)] flex flex-col bg-[var(--c-bg-1)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--c-border)]">
          <span className="text-[13px] font-semibold text-[var(--c-text-2)] uppercase tracking-wider">Teams</span>
          <div className="flex gap-1">
            <button
              onClick={() => { setShowJoin(true); setJoinError(''); setJoinPendingTeam(null) }}
              title="Join with invite code"
              className="px-2 py-1 rounded text-[12px] font-medium bg-[var(--c-bg-2)] text-[var(--c-text-2)]
                         border border-[var(--c-border)] hover:border-[var(--c-border-2)] transition-colors"
            >
              Join
            </button>
            <button
              onClick={() => { setShowCreate(true); setCreateError('') }}
              title="Create new team"
              className="w-7 h-7 flex items-center justify-center rounded text-[var(--c-text-3)]
                         hover:text-[var(--c-purple)] hover:bg-[var(--c-purple-bg)] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          {loadingTeams && <p className="text-[13px] text-[var(--c-text-3)] p-3">Loading…</p>}
          {!loadingTeams && teams.length === 0 && (
            <div className="px-3 py-6 text-center text-[13px] text-[var(--c-text-3)]">
              <p>No teams yet.</p>
              <p className="mt-1 opacity-60">Create one or join with an invite code.</p>
            </div>
          )}
          {teams.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors
                ${selectedId === t.id
                  ? 'bg-[var(--c-bg-3)] text-[var(--c-text)]'
                  : 'text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)] hover:text-[var(--c-text)]'
                }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{t.name}</p>
                <p className="text-[11px] text-[var(--c-text-3)]">{t.myRole}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Team detail ── */}
      <div className="flex-1 overflow-y-auto p-6 pb-16">
        {!selectedId && (
          <div className="flex h-full items-center justify-center text-center text-[var(--c-text-3)]">
            <div>
              <p className="text-3xl mb-3 opacity-20">👥</p>
              <p className="text-[15px]">Select a team or create a new one</p>
            </div>
          </div>
        )}

        {selectedId && loadingDetail && (
          <p className="text-[14px] text-[var(--c-text-3)]">Loading…</p>
        )}

        {detail && !loadingDetail && (
          <div className="max-w-xl flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {renamingId === detail.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => renameTeam(detail.id)}
                    onKeyDown={e => { if (e.key === 'Enter') renameTeam(detail.id); if (e.key === 'Escape') setRenamingId(null) }}
                    className="text-[20px] font-bold text-[var(--c-text)] bg-transparent border-b border-[var(--c-purple-2)] outline-none w-full"
                  />
                ) : (
                  <h1
                    className={`text-[20px] font-bold text-[var(--c-text)] truncate ${detail.myRole === 'owner' ? 'cursor-text hover:text-[var(--c-purple)] transition-colors' : ''}`}
                    onClick={() => { if (detail.myRole === 'owner') { setRenamingId(detail.id); setRenameValue(detail.name) } }}
                    title={detail.myRole === 'owner' ? 'Click to rename' : undefined}
                  >
                    {detail.name}
                  </h1>
                )}
                <p className="text-[13px] text-[var(--c-text-3)] mt-0.5">
                  {detail.members.length} member{detail.members.length !== 1 ? 's' : ''} · you are {detail.myRole === 'owner' ? 'the owner' : 'a member'}
                  {pendingCount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--c-amber)] bg-[var(--c-amber-border)] px-1.5 py-0.5 rounded-full">
                      {pendingCount} pending
                    </span>
                  )}
                </p>
              </div>
              {detail.myRole === 'owner' ? (
                <button
                  onClick={() => { if (confirm(`Delete team "${detail.name}"? This cannot be undone.`)) deleteTeam(detail.id) }}
                  disabled={deletingTeamId === detail.id}
                  className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--c-red-bg)] text-[var(--c-red)]
                             border border-[var(--c-red-bg-2)] hover:bg-[var(--c-red-bg-3)] disabled:opacity-40 transition-colors"
                >
                  Delete team
                </button>
              ) : (
                <button
                  onClick={() => { if (confirm(`Leave team "${detail.name}"?`)) leaveTeam(detail.id) }}
                  disabled={deletingTeamId === detail.id}
                  className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--c-bg-2)] text-[var(--c-text-2)]
                             border border-[var(--c-border)] hover:border-[var(--c-border-2)] disabled:opacity-40 transition-colors"
                >
                  Leave team
                </button>
              )}
            </div>

            {/* Invite code — owner only */}
            {detail.myRole === 'owner' && detail.inviteCode && (
              <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-4 flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--c-text-3)]">Invite code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-[16px] font-semibold text-[var(--c-text)] tracking-widest">{detail.inviteCode}</code>
                  <button
                    onClick={() => copyCode(detail.inviteCode!)}
                    className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                               border border-[var(--c-border)] hover:border-[var(--c-border-2)] transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[12px] text-[var(--c-text-3)]">Share this code with teammates. They can join via Team → Join, then you approve their request here.</p>
              </div>
            )}

            {/* Pending join requests — owner only */}
            {detail.myRole === 'owner' && (detail.joinRequests?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--c-amber)]">
                  Pending requests ({detail.joinRequests!.length})
                </p>
                <div className="bg-[var(--c-bg-2)] border border-[var(--c-amber-border-2)] rounded-lg overflow-hidden divide-y divide-[var(--c-border)]">
                  {detail.joinRequests!.map((r: TeamJoinRequest) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[var(--c-text)] truncate">{r.userEmail}</p>
                        <p className="text-[11px] text-[var(--c-text-3)]">
                          {new Date(r.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => processRequest(r.id, 'approve')}
                          disabled={processingRequestId === r.id}
                          className="px-2.5 py-1 rounded text-[12px] font-semibold bg-[var(--c-green-bg)] text-[var(--c-green)]
                                     border border-[var(--c-green-border,var(--c-green-bg))] hover:opacity-80 disabled:opacity-40 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => processRequest(r.id, 'reject')}
                          disabled={processingRequestId === r.id}
                          className="px-2.5 py-1 rounded text-[12px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-3)]
                                     border border-[var(--c-border)] hover:border-[var(--c-border-2)] disabled:opacity-40 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--c-text-3)]">Members</p>
              <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg overflow-hidden divide-y divide-[var(--c-border)]">
                {detail.members.map(m => (
                  <div key={m.userEmail} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--c-text)] truncate">
                        {m.userEmail}
                        {m.userEmail === user.email && <span className="text-[var(--c-text-3)] ml-1.5 text-[12px]">(you)</span>}
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      m.role === 'owner'
                        ? 'bg-[var(--c-purple-bg)] text-[var(--c-purple)]'
                        : 'bg-[var(--c-bg-3)] text-[var(--c-text-3)]'
                    }`}>
                      {m.role}
                    </span>
                    {detail.myRole === 'owner' && m.role !== 'owner' && (
                      <button
                        onClick={() => removeMember(m.userEmail)}
                        disabled={removingEmail === m.userEmail}
                        className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-text-3)]
                                   hover:text-[var(--c-red)] hover:bg-[var(--c-red-bg)] disabled:opacity-40 transition-colors"
                        title="Remove member"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite member by email (owner only) */}
            {detail.myRole === 'owner' && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--c-text-3)]">Add by email</p>
                <div className="flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteError(''); setInviteSuccess(false) }}
                    onKeyDown={e => e.key === 'Enter' && inviteMember()}
                    placeholder="colleague@example.com"
                    type="email"
                    className="flex-1 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-1.5
                               text-[13px] text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none
                               focus:border-[var(--c-purple-2)] transition-colors"
                  />
                  <button
                    onClick={inviteMember}
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-3 py-1.5 rounded-md text-[13px] font-semibold bg-[var(--c-purple-2)] text-white
                               hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors"
                  >
                    {inviting ? '…' : 'Add'}
                  </button>
                </div>
                {inviteError && <p className="text-[12px] text-[var(--c-red)]">{inviteError}</p>}
                {inviteSuccess && <p className="text-[12px] text-[var(--c-green)]">Member added.</p>}
                <p className="text-[12px] text-[var(--c-text-3)]">Adds them directly without approval. They must have an account already.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create team dialog ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <h2 className="text-[16px] font-bold text-[var(--c-text)]">Create team</h2>
            <input
              autoFocus
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createTeam()}
              placeholder="Team name"
              className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px]
                         text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
            />
            {createError && <p className="text-[12px] text-[var(--c-red)]">{createError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-[13px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)] rounded-md hover:bg-[var(--c-border)] transition-colors">
                Cancel
              </button>
              <button onClick={createTeam} disabled={creating || !createName.trim()}
                className="px-3 py-1.5 text-[13px] font-semibold bg-[var(--c-purple-2)] text-white rounded-md hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors">
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Join team dialog ── */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && setShowJoin(false)}>
          <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            {joinPendingTeam ? (
              <>
                <div className="flex flex-col items-center gap-3 text-center py-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--c-amber-border)] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[var(--c-text)]">Request sent</p>
                    <p className="text-[13px] text-[var(--c-text-2)] mt-1">
                      Your request to join <strong>{joinPendingTeam}</strong> is pending.
                      The team owner will need to approve it.
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowJoin(false); setJoinPendingTeam(null) }}
                  className="w-full py-2 text-[13px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)] rounded-md hover:bg-[var(--c-border)] transition-colors">
                  Close
                </button>
              </>
            ) : (
              <>
                <h2 className="text-[16px] font-bold text-[var(--c-text)]">Join a team</h2>
                <p className="text-[13px] text-[var(--c-text-3)] -mt-2">Enter the invite code shared by the team owner. Your request will be sent for approval.</p>
                <input
                  autoFocus
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinTeam()}
                  placeholder="Invite code"
                  className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px] font-mono
                             text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)] transition-colors"
                />
                {joinError && <p className="text-[12px] text-[var(--c-red)]">{joinError}</p>}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowJoin(false)}
                    className="px-3 py-1.5 text-[13px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)] rounded-md hover:bg-[var(--c-border)] transition-colors">
                    Cancel
                  </button>
                  <button onClick={joinTeam} disabled={joining || !joinCode.trim()}
                    className="px-3 py-1.5 text-[13px] font-semibold bg-[var(--c-purple-2)] text-white rounded-md hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors">
                    {joining ? 'Sending…' : 'Send request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
