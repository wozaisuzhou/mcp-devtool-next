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
  onClose: () => void
  onSaved?: (id: string) => void
}

type Step = 'details' | 'saving' | 'done' | 'error'

export function SaveSessionModal({
  config, serverInfo, tools, resources, prompts, traces,
  onClose, onSaved,
}: Props) {
  const [step, setStep]       = useState<Step>('details')
  const [name, setName]       = useState('')
  const [label, setLabel]     = useState('')
  const [email, setEmail]     = useState('')
  const [savedId, setSavedId] = useState('')
  const [errMsg, setErrMsg]   = useState('')

  const connected = !!serverInfo

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (!connected) {
      setErrMsg('No active MCP connection to save.')
      setStep('error')
      return
    }

    setStep('saving')
    try {
      const res = await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          label: label.trim() || undefined,
          userEmail: email.trim() || undefined,
          serverUrl: config.url,
          serverInfo,
          transport: config.transport,
          tools,
          resources,
          prompts,
          traces,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedId(data.id)
      onSaved?.(data.id)
      setStep('done')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Save failed')
      setStep('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#141416] border border-[#2a2a32] rounded-xl shadow-2xl w-full max-w-sm mx-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a2a32]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#e8e8f0]">Save session</h2>
            <p className="text-[12px] text-[#9090a8] mt-0.5">
              Snapshot this connection for regression testing.
            </p>
          </div>
          <button onClick={onClose} className="text-[#5a5a70] hover:text-[#e8e8f0] transition-colors mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        {/* ── Server info pill ── */}
        {connected && serverInfo && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-[#1a1a1e] border border-[#2a2a32] rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dd68c] flex-shrink-0" />
            <span className="text-[12px] text-[#e8e8f0] font-medium">{serverInfo.name}</span>
            <span className="text-[10px] text-[#5a5a70] font-mono ml-auto">v{serverInfo.version}</span>
          </div>
        )}
        {!connected && (
          <div className="mx-6 mt-4 text-[12px] text-[#f0a840] bg-[#1a1610] border border-[#2a1a1a] rounded-lg px-3 py-2">
            Connect to an MCP server before saving a session.
          </div>
        )}

        {/* ── Step: details form ── */}
        {(step === 'details' || step === 'saving') && (
          <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-3">

            {/* Session name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider">
                Session name <span className="text-[#f06a6a]">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Baseline – June 2025"
                disabled={step === 'saving'}
                className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg px-3 py-2 text-[13px]
                           text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                           transition-colors disabled:opacity-50"
              />
            </div>

            {/* Label / version tag */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider">
                Label <span className="text-[#5a5a70] normal-case font-normal">(for regression grouping)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. v1, baseline, post-deploy"
                disabled={step === 'saving'}
                className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg px-3 py-2 text-[13px]
                           text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                           transition-colors disabled:opacity-50"
              />
            </div>

            {/* Email — sign-up prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider">
                Your email <span className="text-[#5a5a70] normal-case font-normal">(to find your sessions later)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={step === 'saving'}
                className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg px-3 py-2 text-[13px]
                           text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                           transition-colors disabled:opacity-50"
              />
            </div>

            {/* Counts summary */}
            <div className="flex gap-3 text-[11px] text-[#9090a8]">
              <span>{tools.length} tools</span>
              <span className="text-[#2a2a32]">·</span>
              <span>{resources.length} resources</span>
              <span className="text-[#2a2a32]">·</span>
              <span>{prompts.length} prompts</span>
              <span className="text-[#2a2a32]">·</span>
              <span>{traces.length} traces</span>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !connected || step === 'saving'}
              className="mt-1 w-full py-2 rounded-lg text-[13px] font-semibold bg-[#5a54c4] text-white
                         hover:bg-[#7c6ff7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2"
            >
              {step === 'saving' ? <><span className="spinner" /> Saving…</> : 'Save snapshot'}
            </button>
          </form>
        )}

        {/* ── Step: done ── */}
        {step === 'done' && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#0d2a1e] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3dd68c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l4 4 8-8"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#e8e8f0]">Session saved</p>
              <p className="text-[12px] text-[#9090a8] mt-1">
                Snapshot stored with {tools.length} tools, {resources.length} resources,
                {' '}{prompts.length} prompts, and {traces.length} traces.
              </p>
              <p className="text-[10px] text-[#5a5a70] font-mono mt-2">{savedId}</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[12px] font-medium bg-[#222228] text-[#9090a8]
                         hover:bg-[#2a2a32] transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Step: error ── */}
        {step === 'error' && (
          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-[12px] text-[#f06a6a] bg-[#1a0d0d] border border-[#2a1515] rounded-lg px-3 py-2">
              {errMsg}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-2 rounded-lg text-[12px] font-medium bg-[#222228] text-[#9090a8]
                           hover:bg-[#2a2a32] transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[12px] font-medium bg-[#222228] text-[#9090a8]
                           hover:bg-[#2a2a32] transition-colors"
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
