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
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#2a2a32] bg-[#141416] flex-shrink-0">
        <span className="text-[12px] font-semibold text-[#9090a8]">Call history</span>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
          className="bg-[#1a1a1e] border border-[#2a2a32] rounded-md px-2 py-1 text-[12px] text-[#9090a8] outline-none cursor-pointer"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by tool name…"
          className="bg-[#1a1a1e] border border-[#2a2a32] rounded-md px-3 py-1 text-[12px] text-[#e8e8f0]
                     placeholder-[#5a5a70] outline-none w-48 focus:border-[#5a54c4] transition-colors"
        />
        <div className="flex-1" />
        <button onClick={exportJSON}
          className="px-3 py-1 rounded-md text-[11px] font-semibold bg-[#1a1a1e] border border-[#2a2a32]
                     text-[#9090a8] hover:text-[#e8e8f0] transition-colors">
          Export JSON
        </button>
        <button onClick={() => { clearTraces(); setSelected(null) }}
          className="px-3 py-1 rounded-md text-[11px] font-semibold bg-[#2a1010] border border-[#3a1a1a]
                     text-[#f06a6a] hover:bg-[#3a1414] transition-colors">
          Clear all
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Trace list */}
        <div className="w-80 flex-shrink-0 border-r border-[#2a2a32] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#5a5a70] text-[12px] gap-2">
              <span className="text-3xl opacity-20">◎</span>
              <p>{traces.length > 0 ? 'No matches' : 'No traces yet'}</p>
              <p className="text-[10px] opacity-60">Run tools to see history here</p>
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
        <div className="flex-1 overflow-y-auto p-5">
          {selected
            ? <TraceDetail trace={selected} />
            : (
              <div className="flex items-center justify-center h-full text-[#5a5a70] text-[12px]">
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
      className={`w-full text-left px-3.5 py-2.5 border-b border-[#2a2a32] transition-colors
        ${active ? 'bg-[#1e1c3a] border-l-2 border-l-[#7c6ff7]' : 'hover:bg-[#1a1a1e]'}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          trace.status === 'success' ? 'bg-[#3dd68c]' : 'bg-[#f06a6a]'
        }`} />
        <span className="font-mono text-[12px] font-semibold text-[#e8e8f0] flex-1 truncate">
          {trace.tool}
        </span>
        <span className="font-mono text-[11px] text-[#5a5a70]">{trace.durationMs}ms</span>
      </div>
      <div className="flex gap-3 mt-1 text-[11px] text-[#5a5a70] pl-4">
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
        <span className="font-mono text-[15px] font-bold text-[#e8e8f0]">{trace.tool}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          trace.status === 'success' ? 'bg-[#0d2a1e] text-[#3dd68c]' : 'bg-[#2a1010] text-[#f06a6a]'
        }`}>{trace.status}</span>
        <span className="ml-auto text-[12px] text-[#5a5a70] font-mono">{trace.durationMs}ms · {formatTime(trace.timestamp)}</span>
      </div>

      {/* Waterfall */}
      <Section title="Duration">
        <div className="bg-[#1a1a1e] rounded-lg px-3 py-2.5">
          <div className="flex justify-between text-[10px] text-[#5a5a70] font-mono mb-2">
            <span>0ms</span><span>{trace.durationMs}ms</span>
          </div>
          <div className="bg-[#222228] rounded h-2">
            <div className="h-2 rounded bg-[#7c6ff7] opacity-80" style={{ width: `${barWidth}%` }} />
          </div>
        </div>
      </Section>

      {/* Input */}
      <Section title="Input">
        <CodeBlock>{JSON.stringify(trace.input, null, 2)}</CodeBlock>
      </Section>

      {/* Output / Error */}
      <Section title={trace.status === 'error' ? 'Error' : 'Output'}>
        <CodeBlock className={trace.status === 'error' ? 'text-[#f06a6a] bg-[#2a1010] border-[#3a1a1a]' : 'text-[#3dd68c] bg-[#0d2a1e] border-[#1a3a28]'}>
          {trace.error ?? JSON.stringify(trace.output, null, 2)}
        </CodeBlock>
      </Section>

      {/* Meta */}
      <Section title="Metadata">
        <CodeBlock className="text-[10px]">
          {JSON.stringify({ id: trace.id, type: trace.type, source: trace.source, serverId: trace.serverId, timestamp: trace.timestamp }, null, 2)}
        </CodeBlock>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a70] mb-2">{title}</p>
      {children}
    </div>
  )
}

function CodeBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <pre className={`bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-3 font-mono text-[11px]
                    text-[#9090a8] overflow-x-auto whitespace-pre-wrap break-all leading-relaxed ${className}`}>
      {children}
    </pre>
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
