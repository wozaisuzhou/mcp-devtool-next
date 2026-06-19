'use client'
import { useState } from 'react'
import type { MCPTool, MCPResource, MCPPrompt, ServerInfo, TraceEvent } from '@/lib/types'
import type { ConnectionConfig } from '@/lib/types'

interface Props {
  config: ConnectionConfig
  serverInfo: ServerInfo | null
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  traces: TraceEvent[]
  userEmail: string
  onClose: () => void
  onSaved?: (id: string) => void
}

type Step = 'details' | 'saving' | 'conflict' | 'overwriting' | 'done' | 'error'

export function SaveSessionModal({
  config, serverInfo, tools, resources, prompts, traces,
  userEmail, onClose, onSaved,
}: Props) {
  const [step, setStep]       = useState<Step>('details')
  const [name, setName]       = useState('')
  const [label, setLabel]     = useState('')
  const [savedId, setSavedId] = useState('')
  const [errMsg, setErrMsg]   = useState('')

  const connected = !!serverInfo

  async function doSave(overwrite: boolean) {
    const targetStep: Step = overwrite ? 'overwriting' : 'saving'
    setStep(targetStep)
    try {
      const res = await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          label: label.trim() || undefined,
          userEmail,
          serverUrl: config.url,
          serverInfo,
          transport: config.transport,
          tools,
          resources,
          prompts,
          traces,
          overwrite,
        }),
      })
      const data = await res.json()
      if (res.status === 409) {
        setStep('conflict')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedId(data.id)
      onSaved?.(data.id)
      setStep('done')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Save failed')
      setStep('error')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (!connected) {
      setErrMsg('No active MCP connection to save.')
      setStep('error')
      return
    }
    await doSave(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-sm mx-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--c-text)]">Save session</h2>
            <p className="text-[14px] text-[var(--c-text-2)] mt-0.5">
              Snapshot this connection for regression testing.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        {/* ── Account pill ── */}
        <div className="mx-6 mt-4 flex items-center gap-2 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-purple-2)] flex-shrink-0" />
          <span className="text-[14px] text-[var(--c-text-2)]">Saving as</span>
          <span className="text-[14px] text-[var(--c-text)] font-medium ml-1 truncate">{userEmail}</span>
        </div>

        {/* ── Server info pill ── */}
        {connected && serverInfo && (
          <div className="mx-6 mt-2 flex items-center gap-2 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-green)] flex-shrink-0" />
            <span className="text-[14px] text-[var(--c-text)] font-medium">{serverInfo.name}</span>
            <span className="text-[12px] text-[var(--c-text-3)] font-mono ml-auto">v{serverInfo.version}</span>
          </div>
        )}
        {!connected && (
          <div className="mx-6 mt-2 text-[14px] text-[var(--c-amber)] bg-[var(--c-amber-border)] border border-[var(--c-amber-border-2)] rounded-lg px-3 py-2">
            Connect to an MCP server before saving a session.
          </div>
        )}

        {/* ── Step: details form ── */}
        {(step === 'details' || step === 'saving' || step === 'overwriting') && (
          <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-3">

            {/* Session name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                Session name <span className="text-[var(--c-red)]">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Baseline – June 2025"
                disabled={step === 'saving' || step === 'overwriting'}
                className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                           transition-colors disabled:opacity-50"
              />
            </div>

            {/* Label / version tag */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                Label <span className="text-[var(--c-text-3)] normal-case font-normal">(for regression grouping)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. v1, baseline, post-deploy"
                disabled={step === 'saving' || step === 'overwriting'}
                className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                           transition-colors disabled:opacity-50"
              />
            </div>

            {/* Counts summary */}
            <div className="flex gap-3 text-[13px] text-[var(--c-text-2)]">
              <span>{tools.length} tools</span>
              <span className="text-[var(--c-border)]">·</span>
              <span>{resources.length} resources</span>
              <span className="text-[var(--c-border)]">·</span>
              <span>{prompts.length} prompts</span>
              <span className="text-[var(--c-border)]">·</span>
              <span>{traces.length} traces</span>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !connected || step === 'saving' || step === 'overwriting'}
              className="mt-1 w-full py-2 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white
                         hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2"
            >
              {(step === 'saving' || step === 'overwriting') ? <><span className="spinner" /> Saving…</> : 'Save snapshot'}
            </button>
          </form>
        )}

        {/* ── Step: conflict ── */}
        {step === 'conflict' && (
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex items-start gap-3 bg-[var(--c-amber-border)] border border-[var(--c-amber-border-2)] rounded-lg px-3 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-px" stroke="var(--c-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2L14 13H2L8 2z"/><path d="M8 6v3M8 11v.5"/>
              </svg>
              <div>
                <p className="text-[14px] font-semibold text-[var(--c-amber)]">Name already exists</p>
                <p className="text-[13px] text-[var(--c-text-2)] mt-0.5">
                  A session named <span className="font-mono font-semibold text-[var(--c-text)]">{name.trim()}</span> already exists.
                  Rename it or overwrite the existing snapshot.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-2 rounded-lg text-[14px] font-semibold bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                           hover:bg-[var(--c-border)] transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => doSave(true)}
                className="flex-1 py-2 rounded-lg text-[14px] font-semibold bg-[var(--c-amber-border)] text-[var(--c-amber)]
                           border border-[var(--c-amber-border-2)] hover:opacity-80 transition-colors"
              >
                Overwrite
              </button>
            </div>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === 'done' && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--c-green-bg)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--c-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l4 4 8-8"/>
              </svg>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-[var(--c-text)]">Session saved</p>
              <p className="text-[14px] text-[var(--c-text-2)] mt-1">
                Snapshot stored with {tools.length} tools, {resources.length} resources,
                {' '}{prompts.length} prompts, and {traces.length} traces.
              </p>
              <p className="text-[12px] text-[var(--c-text-3)] font-mono mt-2">{savedId}</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                         hover:bg-[var(--c-border)] transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Step: error ── */}
        {step === 'error' && (
          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-[14px] text-[var(--c-red)] bg-[var(--c-red-bg-4)] border border-[var(--c-red-border)] rounded-lg px-3 py-2">
              {errMsg}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                           hover:bg-[var(--c-border)] transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                           hover:bg-[var(--c-border)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
