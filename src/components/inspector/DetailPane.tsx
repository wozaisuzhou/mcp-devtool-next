'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import type { TabState } from '@/store'
import type { MCPTool, MCPResource, MCPPrompt } from '@/lib/types'
import type { TraceEvent } from '@/lib/types'

type ItemType = 'tool' | 'resource' | 'prompt'

function keyFor(type: ItemType, item: MCPTool | MCPResource | MCPPrompt): string {
  const name = type === 'resource' ? (item as MCPResource).uri : (item as MCPTool | MCPPrompt).name
  return `${type}:${name}`
}

const TYPE_COLOR: Record<ItemType, string> = {
  tool: 'text-[var(--c-purple)]',
  resource: 'text-[var(--c-blue)]',
  prompt: 'text-[var(--c-amber)]',
}

export function DetailPane() {
  const { getActiveTab, selectItem, closeItem } = useStore()
  const activeTab = getActiveTab()

  if (!activeTab) return <div className="flex-1" />

  const { tools, resources, prompts, openItems, selectedItem } = activeTab

  const tabs = openItems
    .map((o) => {
      const list = o.type === 'tool' ? tools : o.type === 'resource' ? resources : prompts
      const item = (list as any[]).find((i) => keyFor(o.type, i) === o.key)
      return item ? { key: o.key, type: o.type, item } : null
    })
    .filter((t): t is { key: string; type: ItemType; item: MCPTool | MCPResource | MCPPrompt } => t !== null)

  const activeKey = selectedItem ? keyFor(selectedItem.type, selectedItem.item) : null

  if (tabs.length === 0) {
    return activeTab.connected ? (
      <div className="flex-1 flex items-center justify-center text-[var(--c-text-3)] text-[13px]">
        Select a tool, resource, or prompt to inspect
      </div>
    ) : <div className="flex-1" />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Editor-style tab strip ── */}
      <div className="flex items-stretch overflow-x-auto flex-shrink-0 bg-[var(--c-bg-1)] border-b border-[var(--c-border)]">
        {tabs.map(({ key, type, item }) => {
          const name = type === 'resource' ? (item as MCPResource).uri : (item as MCPTool | MCPPrompt).name
          const active = key === activeKey
          return (
            <div
              key={key}
              onClick={() => selectItem(type, item)}
              className={`group flex items-center gap-2 pl-3 pr-2 py-2 text-[13px] font-mono cursor-pointer select-none
                border-r border-[var(--c-border)] whitespace-nowrap flex-shrink-0
                ${active
                  ? 'bg-[var(--c-bg-base)] text-[var(--c-text)] border-t-2 border-t-[var(--c-purple)] -mt-px'
                  : 'text-[var(--c-text-3)] hover:text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)] border-t-2 border-t-transparent'
                }`}
            >
              <span className={`text-[10px] font-bold ${TYPE_COLOR[type]}`}>{type[0].toUpperCase()}</span>
              <span className="max-w-[160px] truncate">{name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeItem(key) }}
                className="w-4 h-4 flex items-center justify-center rounded-sm text-[var(--c-text-3)] opacity-0
                           group-hover:opacity-100 hover:bg-[var(--c-bg-3)] hover:text-[var(--c-text)] transition-opacity flex-shrink-0"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* Remount per item so local input/response state doesn't leak between tabs */}
      {selectedItem && <ItemPane key={activeKey} type={selectedItem.type} item={selectedItem.item} activeTab={activeTab} />}
    </div>
  )
}

function ItemPane({ type, item, activeTab }: { type: ItemType; item: MCPTool | MCPResource | MCPPrompt; activeTab: TabState }) {
  const { addTrace } = useStore()
  const [input, setInput] = useState('{}')
  const [response, setResponse] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; data?: unknown; error?: string; durationMs?: number }>({ status: 'idle' })
  const [terminalOpen, setTerminalOpen] = useState(true)

  const itemName = type === 'resource' ? (item as MCPResource).uri : (item as MCPTool | MCPPrompt).name
  const description = (item as MCPTool).description ?? (item as MCPResource).description
  const schema = (item as MCPTool).inputSchema
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI

  async function run() {
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(input || '{}') }
    catch { setResponse({ status: 'error', error: 'Invalid JSON' }); return }

    setResponse({ status: 'loading' })
    setTerminalOpen(true)

    if (type === 'tool') {
      const tool = item as MCPTool
      let data: { status?: string; result?: unknown; error?: string; durationMs?: number }

      if (activeTab.stdioMode && isElectron) {
        const api = (window as any).electronAPI
        const raw = await api.mcp.callTool(activeTab.id, tool.name, parsed)
        data = { status: raw.isError ? 'error' : 'success', result: raw.result, durationMs: raw.durationMs }
      } else {
        const res = await fetch('/api/proxy/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: tool.name, input: parsed }),
        })
        data = await res.json()
        if (!res.ok) data.status = 'error'
      }

      const traceStatus = (data.status ?? 'success') as 'success' | 'error'
      const trace: TraceEvent = {
        id: crypto.randomUUID(),
        tool: tool.name,
        type: 'tool_call',
        input: parsed,
        output: data.result,
        error: data.error,
        status: traceStatus,
        durationMs: data.durationMs ?? 0,
        timestamp: new Date().toISOString(),
        serverId: activeTab.serverInfo?.name ?? 'unknown',
        source: 'inspector',
      }
      addTrace(trace)

      if (traceStatus === 'success') {
        setResponse({ status: 'success', data: data.result, durationMs: data.durationMs })
      } else {
        setResponse({ status: 'error', error: data.error, data: data.result, durationMs: data.durationMs })
      }
    }

    if (type === 'resource') {
      const resource = item as MCPResource
      if (activeTab.stdioMode && isElectron) {
        const api = (window as any).electronAPI
        const raw = await api.mcp.callResource(activeTab.id, resource.uri)
        setResponse({ status: 'success', data: raw.result })
      } else {
        const res = await fetch('/api/proxy/resource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri: resource.uri }),
        })
        const data = await res.json()
        if (res.ok) setResponse({ status: 'success', data: data.result })
        else setResponse({ status: 'error', error: data.error })
      }
    }
  }

  function formatInput() {
    try { setInput(JSON.stringify(JSON.parse(input), null, 2)) } catch {}
  }

  const consoleText =
    response.status === 'idle'    ? 'Run to see the response.' :
    response.status === 'loading' ? 'Waiting for response…' :
    response.status === 'success' ? JSON.stringify(response.data, null, 2) :
    response.data != null         ? JSON.stringify(response.data, null, 2) : response.error

  const consoleColor =
    response.status === 'success' ? 'text-[var(--c-green)]' :
    response.status === 'error'   ? 'text-[var(--c-red)]' :
                                     'text-[var(--c-text-3)]'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-3 border-b border-[var(--c-border)] flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono text-[15px] font-semibold text-[var(--c-text)] truncate">{itemName}</h2>
          {description && <p className="text-[13px] text-[var(--c-text-2)] mt-0.5">{description}</p>}
        </div>
        <TypeBadge type={type} />
      </div>

      {/* Body: schema + input */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <div>
            <FieldLabel>Input schema</FieldLabel>
            <SchemaBlock schema={schema} />
          </div>
          <div>
            <FieldLabel>Server</FieldLabel>
            <CodeBlock className="text-[12px]">
              {JSON.stringify({ url: activeTab.config.url, transport: activeTab.config.transport, ...activeTab.serverInfo }, null, 2)}
            </CodeBlock>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <FieldLabel>Input (JSON)</FieldLabel>
            <button onClick={formatInput}
              className="text-[12px] px-2 py-1 rounded bg-[var(--c-bg-2)] border border-[var(--c-border)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors">
              Format
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded p-3 font-mono text-[14px]
                       text-[var(--c-text)] outline-none resize-none min-h-[120px] focus:border-[var(--c-purple-2)] transition-colors"
          />

          <div className="flex gap-2">
            <button onClick={run}
              disabled={response.status === 'loading'}
              className="flex-1 py-2 rounded bg-[var(--c-purple-2)] text-white text-[14px] font-semibold
                         hover:bg-[var(--c-purple)] disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {response.status === 'loading'
                ? <><span className="spinner" /> Running…</>
                : '▶ Run'}
            </button>
            <button onClick={() => setResponse({ status: 'idle' })}
              className="px-3 py-2 rounded bg-[var(--c-bg-2)] border border-[var(--c-border)] text-[14px]
                         text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom terminal panel ── */}
      <div className={`flex-shrink-0 border-t border-[var(--c-border)] bg-[var(--c-bg-base)] flex flex-col
        ${terminalOpen ? 'h-[220px]' : 'h-9'} transition-[height]`}>
        <button
          onClick={() => setTerminalOpen((v) => !v)}
          className="flex items-center gap-2 px-4 h-9 flex-shrink-0 text-[12px] font-bold uppercase tracking-widest
                     text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors"
        >
          <span className="font-mono">{terminalOpen ? '▾' : '▸'}</span>
          Console
          {response.durationMs !== undefined && (
            <span className="normal-case font-mono text-[var(--c-text-3)] font-normal tracking-normal">{response.durationMs}ms</span>
          )}
          <span className={`w-1.5 h-1.5 rounded-full ml-auto
            ${response.status === 'success' ? 'bg-[var(--c-green)]'
            : response.status === 'error' ? 'bg-[var(--c-red)]'
            : response.status === 'loading' ? 'bg-[var(--c-amber)] animate-pulse'
            : 'bg-[var(--c-text-3)]'}`} />
        </button>
        {terminalOpen && (
          <div className={`flex-1 overflow-auto px-4 pb-3 font-mono text-[13px] whitespace-pre-wrap break-all leading-relaxed ${consoleColor}`}>
            {consoleText}
          </div>
        )}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--c-text-3)] mb-1.5">{children}</p>
  )
}

function CodeBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <pre className={`bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded p-3 font-mono text-[13px]
                    text-[var(--c-text-2)] overflow-x-auto leading-relaxed ${className}`}>
      {children}
    </pre>
  )
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    tool: 'bg-[var(--c-purple-bg)] text-[var(--c-purple)]',
    resource: 'bg-[var(--c-blue-bg)] text-[var(--c-blue)]',
    prompt: 'bg-[var(--c-amber-bg)] text-[var(--c-amber)]',
  }
  return (
    <span className={`text-[12px] font-bold px-2 py-1 rounded ${styles[type] ?? ''}`}>
      {type.toUpperCase()}
    </span>
  )
}

function SchemaBlock({ schema }: { schema?: any }) {
  const required = schema?.required ?? []
  const properties = schema?.properties ?? {}

  if (!schema || Object.keys(properties).length === 0) {
    return <CodeBlock>{JSON.stringify(schema ?? {}, null, 2)}</CodeBlock>
  }

  return (
    <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded p-3 font-mono text-[13px] overflow-x-auto">
      <div className="text-[var(--c-text-2)]">
        <div>{'{'}</div>
        <div className="ml-4">
          <div><span className="text-[var(--c-text-2)]">"properties":</span> {'{'}</div>
          {Object.entries(properties).map(([key, value]: [string, any], idx) => {
            const isRequired = required.includes(key)
            return (
              <div key={key} className="ml-4">
                <span className={isRequired ? 'text-[var(--c-amber)] font-bold' : 'text-[var(--c-text-2)]'}>
                  "{key}"
                </span>
                <span className="text-[var(--c-text-2)]">: {value?.type || 'unknown'}</span>
                {idx < Object.keys(properties).length - 1 && <span className="text-[var(--c-text-2)]">,</span>}
              </div>
            )
          })}
          <div>{'},'}</div>
        </div>
        {required.length > 0 && (
          <div className="ml-4">
            <div><span className="text-[var(--c-text-2)]">"required":</span> {'['}</div>
            {required.map((field: string, idx: number) => (
              <div key={field} className="ml-4">
                <span className="text-[var(--c-amber)]">"{field}"</span>
                {idx < required.length - 1 && <span className="text-[var(--c-text-2)]">,</span>}
              </div>
            ))}
            <div><span className="text-[var(--c-text-2)]">]</span></div>
          </div>
        )}
        <div>{'}'}</div>
      </div>
    </div>
  )
}
