'use client'
import { create } from 'zustand'
import type {
  ConnectionConfig, ServerInfo, MCPTool, MCPResource,
  MCPPrompt, TraceEvent, ChatMessage,
} from '@/lib/types'

interface AppStore {
  // ── Connection ─────────────────────────────────────────────
  connected: boolean
  connecting: boolean
  config: ConnectionConfig
  serverInfo: ServerInfo | null
  error: string | null

  // ── MCP capabilities ───────────────────────────────────────
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]

  // ── Inspector selection ────────────────────────────────────
  selectedItem: { type: 'tool' | 'resource' | 'prompt'; item: MCPTool | MCPResource | MCPPrompt } | null

  // ── Trace history ──────────────────────────────────────────
  traces: TraceEvent[]

  // ── Chat ───────────────────────────────────────────────────
  messages: ChatMessage[]
  claudeApiKey: string

  // ── Actions ────────────────────────────────────────────────
  setConfig: (c: Partial<ConnectionConfig>) => void
  setConnected: (info: ServerInfo, tools: MCPTool[], resources: MCPResource[], prompts: MCPPrompt[]) => void
  setConnecting: (v: boolean) => void
  setDisconnected: () => void
  setError: (e: string | null) => void
  selectItem: (type: 'tool' | 'resource' | 'prompt', item: MCPTool | MCPResource | MCPPrompt) => void
  addTrace: (t: TraceEvent) => void
  clearTraces: () => void
  addMessage: (m: ChatMessage) => void
  clearMessages: () => void
  setClaudeApiKey: (k: string) => void
}

export const useStore = create<AppStore>((set) => ({
  connected: false,
  connecting: false,
  config: { url: '', transport: 'auto', authToken: '' },
  serverInfo: null,
  error: null,
  tools: [],
  resources: [],
  prompts: [],
  selectedItem: null,
  traces: [],
  messages: [],
  claudeApiKey: '',

  setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),

  setConnected: (info, tools, resources, prompts) =>
    set({ connected: true, connecting: false, serverInfo: info, tools, resources, prompts, error: null }),

  setConnecting: (v) => set({ connecting: v }),

  setDisconnected: () =>
    set({ connected: false, connecting: false, serverInfo: null,
          tools: [], resources: [], prompts: [], selectedItem: null, error: null }),

  setError: (e) => set({ error: e, connecting: false }),

  selectItem: (type, item) => set({ selectedItem: { type, item } }),

  addTrace: (t) => set((s) => ({ traces: [t, ...s.traces].slice(0, 500) })),

  clearTraces: () => set({ traces: [] }),

  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),

  clearMessages: () => set({ messages: [] }),

  setClaudeApiKey: (k) => set({ claudeApiKey: k }),
}))
