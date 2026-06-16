'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import type { MCPTool, MCPResource } from '@/lib/types'
import type { TraceEvent } from '@/lib/types'

export function DetailPane() {
  const { getActiveTab, addTrace } = useStore()
  const activeTab = getActiveTab()
  const [input, setInput] = useState('{}')
  const [response, setResponse] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; data?: unknown; error?: string; durationMs?: number }>({ status: 'idle' })

  if (!activeTab) return <div className="flex-1" />

  const selectedItem = activeTab.selectedItem

  // Reset input when item changes
  const item = selectedItem?.item
  const itemName = selectedItem?.type === 'tool'
    ? (item as MCPTool).name
    : selectedItem?.type === 'resource'
    ? (item as MCPResource).uri
    : selectedItem?.type === 'prompt'
    ? (item as any).name
    : null

  async function run() {
    if (!selectedItem) return
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(input || '{}') }
    catch { setResponse({ status: 'error', error: 'Invalid JSON' }); return }

    setResponse({ status: 'loading' })

    if (selectedItem.type === 'tool') {
      const tool = selectedItem.item as MCPTool
      const res = await fetch('/api/proxy/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: tool.name, input: parsed }),
      })
      const data = await res.json()

      const trace: TraceEvent = {
        id: crypto.randomUUID(),
        tool: tool.name,
        type: 'tool_call',
        input: parsed,
        output: data.result,
        error: data.error,
        status: res.ok ? 'success' : 'error',
        durationMs: data.durationMs ?? 0,
        timestamp: new Date().toISOString(),
        serverId: activeTab.serverInfo?.name ?? 'unknown',
        source: 'inspector',
      }
      addTrace(trace)

      if (res.ok) {
        setResponse({ status: 'success', data: data.result, durationMs: data.durationMs })
      } else {
        setResponse({ status: 'error', error: data.error, durationMs: data.durationMs })
      }
    }

    if (selectedItem.type === 'resource') {
      const resource = selectedItem.item as MCPResource
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

  function formatInput() {
    try { setInput(JSON.stringify(JSON.parse(input), null, 2)) } catch {}
  }

  if (!selectedItem) return <div className="flex-1" />

  const schema = (item as MCPTool).inputSchema
  const description = (item as MCPTool).description ?? (item as MCPResource).description

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-[#2a2a32]">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono text-[15px] font-semibold text-[#e8e8f0] truncate">{itemName}</h2>
          {description && <p className="text-[12px] text-[#9090a8] mt-0.5">{description}</p>}
        </div>
        <TypeBadge type={selectedItem.type} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex gap-4 p-5">

        {/* Left: schema */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <div>
            <FieldLabel>Input schema</FieldLabel>
            <SchemaBlock schema={schema} />
          </div>
          <div>
            <FieldLabel>Server</FieldLabel>
            <CodeBlock className="text-[10px]">
              {JSON.stringify({ url: activeTab.config.url, transport: activeTab.config.transport, ...activeTab.serverInfo }, null, 2)}
            </CodeBlock>
          </div>
        </div>

        {/* Right: run */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <FieldLabel>Input (JSON)</FieldLabel>
            <button onClick={formatInput}
              className="text-[10px] px-2 py-1 rounded bg-[#1a1a1e] border border-[#2a2a32] text-[#9090a8] hover:text-[#e8e8f0] transition-colors">
              Format
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-3 font-mono text-[12px]
                       text-[#e8e8f0] outline-none resize-none min-h-[120px] focus:border-[#5a54c4] transition-colors"
          />

          <div className="flex gap-2">
            <button onClick={run}
              disabled={response.status === 'loading'}
              className="flex-1 py-2 rounded-lg bg-[#5a54c4] text-white text-[12px] font-semibold
                         hover:bg-[#7c6ff7] disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {response.status === 'loading'
                ? <><span className="spinner" /> Running…</>
                : '▶ Run'}
            </button>
            <button onClick={() => setResponse({ status: 'idle' })}
              className="px-3 py-2 rounded-lg bg-[#1a1a1e] border border-[#2a2a32] text-[12px]
                         text-[#9090a8] hover:text-[#e8e8f0] transition-colors">
              Clear
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FieldLabel>Response</FieldLabel>
              {response.durationMs !== undefined && (
                <span className="text-[10px] text-[#5a5a70] font-mono">{response.durationMs}ms</span>
              )}
            </div>
            <div className={`rounded-lg p-3 font-mono text-[11px] min-h-[120px] whitespace-pre-wrap break-all leading-relaxed
              ${response.status === 'success' ? 'bg-[#0d2a1e] border border-[#1a3a28] text-[#3dd68c]'
              : response.status === 'error'   ? 'bg-[#2a1010] border border-[#3a1a1a] text-[#f06a6a]'
              : response.status === 'loading' ? 'bg-[#1a1a1e] border border-[#2a2a32] text-[#5a5a70]'
              :                                 'bg-[#1a1a1e] border border-[#2a2a32] text-[#5a5a70]'}`}>
              {response.status === 'idle'    ? 'Run a tool to see the response.' :
               response.status === 'loading' ? 'Waiting for response…' :
               response.status === 'success' ? JSON.stringify(response.data, null, 2) :
               response.error}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a70] mb-1.5">{children}</p>
  )
}

function CodeBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <pre className={`bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-3 font-mono text-[11px]
                    text-[#9090a8] overflow-x-auto leading-relaxed ${className}`}>
      {children}
    </pre>
  )
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    tool: 'bg-[#1e1c3a] text-[#7c6ff7]',
    resource: 'bg-[#0e1e30] text-[#60a8f0]',
    prompt: 'bg-[#2a1e08] text-[#f0a840]',
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded ${styles[type] ?? ''}`}>
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
    <div className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-3 font-mono text-[11px] overflow-x-auto">
      <div className="text-[#9090a8]">
        <div>{'{'}</div>
        <div className="ml-4">
          <div><span className="text-[#9090a8]">"properties":</span> {'{'}</div>
          {Object.entries(properties).map(([key, value]: [string, any], idx) => {
            const isRequired = required.includes(key)
            return (
              <div key={key} className="ml-4">
                <span className={isRequired ? 'text-[#f0a840] font-bold' : 'text-[#9090a8]'}>
                  "{key}"
                </span>
                <span className="text-[#9090a8]">: {value?.type || 'unknown'}</span>
                {idx < Object.keys(properties).length - 1 && <span className="text-[#9090a8]">,</span>}
              </div>
            )
          })}
          <div>{'},'}</div>
        </div>
        {required.length > 0 && (
          <div className="ml-4">
            <div><span className="text-[#9090a8]">"required":</span> {'['}</div>
            {required.map((field, idx) => (
              <div key={field} className="ml-4">
                <span className="text-[#f0a840]">"{field}"</span>
                {idx < required.length - 1 && <span className="text-[#9090a8]">,</span>}
              </div>
            ))}
            <div><span className="text-[#9090a8]">]</span></div>
          </div>
        )}
        <div>{'}'}</div>
      </div>
    </div>
  )
}
