'use client'
import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/store'
import type { TraceEvent } from '@/lib/types'

export default function ChatPage() {
  const { messages, addMessage, claudeApiKey, setClaudeApiKey,
          addTrace, getActiveTab } = useStore()
  const activeTab = getActiveTab()
  const tools = activeTab?.tools ?? []
  const serverInfo = activeTab?.serverInfo ?? null
  const connected = activeTab?.connected ?? false
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [keyInput, setKeyInput] = useState(claudeApiKey)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg = { role: 'user' as const, content: text }
    addMessage(userMsg)
    setLoading(true)

    try {
      const mcpTools = tools.map(t => ({
        name: t.name,
        description: t.description ?? '',
        input_schema: t.inputSchema,
      }))

      // Build message history for API (only string content for simplicity)
      const history = messages
        .filter(m => typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content as string }))

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: `You are a helpful assistant with access to an MCP server called "${serverInfo?.name ?? 'MCP Server'}". Use tools to help the user. Always explain what you're doing.`,
          messages: [...history, { role: 'user', content: text }],
          ...(mcpTools.length > 0 ? { tools: mcpTools } : {}),
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error.message)

      const assistantContent = data.content ?? []
      addMessage({ role: 'assistant', content: assistantContent })

      // Handle tool calls
      for (const block of assistantContent) {
        if (block.type !== 'tool_use') continue

        const start = performance.now()
        const callRes = await fetch('/api/proxy/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: block.name, input: block.input }),
        })
        const callData = await callRes.json()
        const durationMs = Math.round(performance.now() - start)

        const trace: TraceEvent = {
          id: crypto.randomUUID(),
          tool: block.name,
          type: 'tool_call',
          input: block.input,
          output: callData.result,
          error: callData.error,
          status: callRes.ok ? 'success' : 'error',
          durationMs,
          timestamp: new Date().toISOString(),
          serverId: serverInfo?.name ?? 'unknown',
          source: 'chat',
        }
        addTrace(trace)
      }

    } catch (err: unknown) {
      addMessage({
        role: 'assistant',
        content: `⚠️ ${err instanceof Error ? err.message : 'Something went wrong'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* API key banner */}
      {!claudeApiKey && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--c-amber-bg)] border-b border-[var(--c-amber-bg-2)] text-[var(--c-amber)] text-[14px]">
          <span>⚠</span>
          <span>Claude API key needed for chat:</span>
          <input
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            type="password"
            placeholder="sk-ant-..."
            className="bg-[var(--c-bg-2)] border border-[var(--c-amber-bg-2)] rounded px-2 py-1 font-mono text-[13px]
                       text-[var(--c-text)] outline-none w-48"
          />
          <button
            onClick={() => { setClaudeApiKey(keyInput); localStorage.setItem('mcp_claude_key', keyInput) }}
            className="px-2 py-1 rounded bg-[var(--c-amber-bg-2)] border border-[var(--c-amber-bg-3)] text-[var(--c-amber)] text-[13px] hover:bg-[var(--c-amber-bg-3)]">
            Save
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 pb-10 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-[var(--c-text-3)] text-[15px] text-center">
            <div>
              <div className="text-3xl mb-3 opacity-20">◈</div>
              <p>{connected ? `Connected to ${serverInfo?.name}. Ask me anything.` : 'Connect a server, then ask me to use its tools.'}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageRow key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <Avatar role="assistant" />
            <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-xl px-3.5 py-2.5 text-[15px] text-[var(--c-text-3)]">
              <span className="spinner" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--c-border)] bg-[var(--c-bg-1)] px-4 py-3 flex gap-3 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask Claude to use your MCP tools… (Enter to send)"
          rows={1}
          className="flex-1 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-xl px-3.5 py-2.5 text-[15px]
                     text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none resize-none max-h-32
                     focus:border-[var(--c-purple-2)] transition-colors font-sans leading-relaxed"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-lg bg-[var(--c-purple-2)] text-white flex items-center justify-center
                     hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 text-lg"
        >
          ↑
        </button>
      </div>
    </div>
  )
}

function Avatar({ role }: { role: string }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0
      ${role === 'user' ? 'bg-[var(--c-purple-bg)] text-[var(--c-purple)] border border-[var(--c-purple-2)]' : 'bg-[var(--c-bg-3)] text-[var(--c-text-2)] border border-[var(--c-border)]'}`}>
      {role === 'user' ? 'You' : 'AI'}
    </div>
  )
}

function MessageRow({ msg }: { msg: { role: string; content: string | unknown[] } }) {
  const isUser = msg.role === 'user'
  const textBlocks = Array.isArray(msg.content)
    ? msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n')
    : msg.content as string
  const toolUses = Array.isArray(msg.content)
    ? msg.content.filter((b: any) => b.type === 'tool_use')
    : []

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar role={msg.role} />
      <div className={`max-w-xl flex flex-col gap-2 ${isUser ? 'items-end' : ''}`}>
        {textBlocks && (
          <div className={`rounded-xl px-3.5 py-2.5 text-[15px] leading-relaxed
            ${isUser
              ? 'bg-[var(--c-purple-bg)] border border-[var(--c-purple-2)] text-[var(--c-text)]'
              : 'bg-[var(--c-bg-2)] border border-[var(--c-border)] text-[var(--c-text)]'}`}>
            {textBlocks}
          </div>
        )}
        {(toolUses as any[]).map((tc, i) => (
          <div key={i} className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-lg p-3 font-mono text-[13px] w-full">
            <div className="flex items-center gap-2 mb-2 text-[var(--c-purple)] font-semibold">
              <span>⚡</span>
              <span>{tc.name}</span>
            </div>
            <div className="text-[var(--c-text-2)] text-[12px]">
              {JSON.stringify(tc.input, null, 2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
