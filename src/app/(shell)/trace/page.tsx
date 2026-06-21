'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import type { TraceEvent } from '@/lib/types'

export default function TracePage() {
  const { getActiveTab, clearTraces } = useStore()
  const activeTab = getActiveTab()
  const traces = activeTab?.traces ?? []
  const [selected, setSelected] = useState<TraceEvent | null>(null)
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all')
  const [search, setSearch] = useState('')

  const filtered = traces.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (search && !t.tool.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function exportJSON() {
    const blob = new Blob([JSON.stringify(traces, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mcp-traces-${Date.now()}.json`
    a.click()
  }

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--c-border)] bg-[var(--c-bg-1)] flex-shrink-0">
        <span className="text-[14px] font-semibold text-[var(--c-text-2)]">Call history</span>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
          className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-2 py-1 text-[14px] text-[var(--c-text-2)] outline-none cursor-pointer"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by tool name…"
          className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-1 text-[14px] text-[var(--c-text)]
                     placeholder-[var(--c-text-3)] outline-none w-48 focus:border-[var(--c-purple-2)] transition-colors"
        />
        <div className="flex-1" />
        <button onClick={exportJSON}
          className="px-3 py-1 rounded-md text-[13px] font-semibold bg-[var(--c-bg-2)] border border-[var(--c-border)]
                     text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors">
          Export JSON
        </button>
        <button onClick={() => { clearTraces(); setSelected(null) }}
          className="px-3 py-1 rounded-md text-[13px] font-semibold bg-[var(--c-red-bg)] border border-[var(--c-red-bg-2)]
                     text-[var(--c-red)] hover:bg-[var(--c-red-bg-3)] transition-colors">
          Clear all
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Trace list */}
        <div className="w-80 flex-shrink-0 border-r border-[var(--c-border)] overflow-y-auto pb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--c-text-3)] text-[14px] gap-2">
              <span className="text-3xl opacity-20">◎</span>
              <p>{traces.length > 0 ? 'No matches' : 'No traces yet'}</p>
              <p className="text-[12px] opacity-60">Run tools to see history here</p>
            </div>
          ) : (
            filtered.map(t => (
              <TraceRow
                key={t.id}
                trace={t}
                active={selected?.id === t.id}
                onClick={() => setSelected(t)}
              />
            ))
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto p-5 pb-12">
          {selected
            ? <TraceDetail trace={selected} />
            : (
              <div className="flex items-center justify-center h-full text-[var(--c-text-3)] text-[14px]">
                Select a trace to inspect
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

function TraceRow({ trace, active, onClick }: { trace: TraceEvent; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 border-b border-[var(--c-border)] transition-colors
        ${active ? 'bg-[var(--c-purple-bg)] border-l-2 border-l-[var(--c-purple)]' : 'hover:bg-[var(--c-bg-2)]'}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          trace.status === 'success' ? 'bg-[var(--c-green)]' : 'bg-[var(--c-red)]'
        }`} />
        <span className="font-mono text-[14px] font-semibold text-[var(--c-text)] flex-1 truncate">
          {trace.tool}
        </span>
        <span className="font-mono text-[13px] text-[var(--c-text-3)]">{trace.durationMs}ms</span>
      </div>
      <div className="flex gap-3 mt-1 text-[13px] text-[var(--c-text-3)] pl-4">
        <span>{trace.source}</span>
        <span>{formatTime(trace.timestamp)}</span>
        <span className="truncate">{trace.serverId}</span>
      </div>
    </button>
  )
}

function TraceDetail({ trace }: { trace: TraceEvent }) {
  const barWidth = Math.min(100, Math.round((trace.durationMs / 2000) * 100))

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header row */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[17px] font-bold text-[var(--c-text)]">{trace.tool}</span>
        <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${
          trace.status === 'success' ? 'bg-[var(--c-green-bg)] text-[var(--c-green)]' : 'bg-[var(--c-red-bg)] text-[var(--c-red)]'
        }`}>{trace.status}</span>
        <span className="ml-auto text-[14px] text-[var(--c-text-3)] font-mono">{trace.durationMs}ms · {formatTime(trace.timestamp)}</span>
      </div>

      {/* Waterfall */}
      <Section title="Duration">
        <div className="bg-[var(--c-bg-2)] rounded-lg px-3 py-2.5">
          <div className="flex justify-between text-[12px] text-[var(--c-text-3)] font-mono mb-2">
            <span>0ms</span><span>{trace.durationMs}ms</span>
          </div>
          <div className="bg-[var(--c-bg-3)] rounded h-2">
            <div className="h-2 rounded bg-[var(--c-purple)] opacity-80" style={{ width: `${barWidth}%` }} />
          </div>
        </div>
      </Section>

      {/* Input */}
      <Section title="Input">
        <CodeBlock>{JSON.stringify(trace.input, null, 2)}</CodeBlock>
      </Section>

      {/* Output / Error */}
      <Section title={trace.status === 'error' ? 'Error' : 'Output'}>
        <CodeBlock className={trace.status === 'error' ? 'text-[var(--c-red)] bg-[var(--c-red-bg)] border-[var(--c-red-bg-2)]' : 'text-[var(--c-green)] bg-[var(--c-green-bg)] border-[var(--c-green-bg-2)]'}>
          {trace.error ?? JSON.stringify(trace.output, null, 2)}
        </CodeBlock>
      </Section>

      {/* Meta */}
      <Section title="Metadata">
        <CodeBlock className="text-[12px]">
          {JSON.stringify({ id: trace.id, type: trace.type, source: trace.source, serverId: trace.serverId, timestamp: trace.timestamp }, null, 2)}
        </CodeBlock>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--c-text-3)] mb-2">{title}</p>
      {children}
    </div>
  )
}

function CodeBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <pre className={`bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-3 font-mono text-[13px]
                    text-[var(--c-text-2)] overflow-x-auto whitespace-pre-wrap break-all leading-relaxed ${className}`}>
      {children}
    </pre>
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
