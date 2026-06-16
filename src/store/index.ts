'use client'
import { create } from 'zustand'
import type {
  ConnectionConfig, ServerInfo, MCPTool, MCPResource,
  MCPPrompt, TraceEvent, ChatMessage,
} from '@/lib/types'

interface TabState {
  id: string
  name: string
  connected: boolean
  connecting: boolean
  config: ConnectionConfig
  serverInfo: ServerInfo | null
  error: string | null
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  selectedItem: { type: 'tool' | 'resource' | 'prompt'; item: MCPTool | MCPResource | MCPPrompt } | null
  traces: TraceEvent[]
}

interface AppStore {
  // ── Tabs ────────────────────────────────────────────────────
  tabs: TabState[]
  activeTabId: string

  // ── Chat ───────────────────────────────────────────────────
  messages: ChatMessage[]
  claudeApiKey: string

  // ── UI state ───────────────────────────────────────────────
  sidebarWidth: number
  sectionHeights: { tools: number; resources: number; prompts: number }

  // ── Tab Actions ────────────────────────────────────────────
  createTab: (name?: string) => void
  deleteTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  renameTab: (tabId: string, name: string) => void

  // ── Connection Actions ─────────────────────────────────────
  setConfig: (c: Partial<ConnectionConfig>) => void
  setConnected: (info: ServerInfo, tools: MCPTool[], resources: MCPResource[], prompts: MCPPrompt[]) => void
  setConnecting: (v: boolean) => void
  setDisconnected: () => void
  setError: (e: string | null) => void
  selectItem: (type: 'tool' | 'resource' | 'prompt', item: MCPTool | MCPResource | MCPPrompt) => void
  addTrace: (t: TraceEvent) => void
  clearTraces: () => void

  // ── Chat Actions ───────────────────────────────────────────
  addMessage: (m: ChatMessage) => void
  clearMessages: () => void
  setClaudeApiKey: (k: string) => void

  // ── UI Actions ─────────────────────────────────────────────
  setSidebarWidth: (w: number) => void
  setSectionHeight: (section: 'tools' | 'resources' | 'prompts', height: number) => void

  // ── Getters ────────────────────────────────────────────────
  getActiveTab: () => TabState | undefined
}

const createEmptyTab = (id: string, name: string): TabState => ({
  id,
  name,
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
})

export const useStore = create<AppStore>((set, get) => ({
  tabs: [createEmptyTab('tab-1', 'Server 1')],
  activeTabId: 'tab-1',
  messages: [],
  claudeApiKey: '',
  sidebarWidth: 256,
  sectionHeights: { tools: 150, resources: 150, prompts: 150 },

  // ── Tab Actions ────────────────────────────────────────────
  createTab: (name?: string) => set((s) => {
    const newTabId = `tab-${Date.now()}`
    const newTabs = [...s.tabs, createEmptyTab(newTabId, name || `Server ${s.tabs.length + 1}`)]
    return { tabs: newTabs, activeTabId: newTabId }
  }),

  deleteTab: (tabId: string) => set((s) => {
    const newTabs = s.tabs.filter((t) => t.id !== tabId)
    // If no tabs left, create a new empty tab
    if (newTabs.length === 0) {
      const newTabId = `tab-${Date.now()}`
      return { tabs: [createEmptyTab(newTabId, 'Server 1')], activeTabId: newTabId }
    }
    const newActiveTabId = s.activeTabId === tabId ? newTabs[0].id : s.activeTabId
    return { tabs: newTabs, activeTabId: newActiveTabId }
  }),

  switchTab: (tabId: string) => set({ activeTabId: tabId }),

  renameTab: (tabId: string, name: string) => set((s) => ({
    tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, name } : t)),
  })),

  // ── Connection Actions ─────────────────────────────────────
  setConfig: (c) => set((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    if (!tab) return s
    return {
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId ? { ...t, config: { ...t.config, ...c } } : t
      ),
    }
  }),

  setConnected: (info, tools, resources, prompts) => set((s) => ({
    tabs: s.tabs.map((t) =>
      t.id === s.activeTabId
        ? { ...t, connected: true, connecting: false, serverInfo: info, tools, resources, prompts, error: null }
        : t
    ),
  })),

  setConnecting: (v) => set((s) => ({
    tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, connecting: v } : t)),
  })),

  setDisconnected: () => set((s) => ({
    tabs: s.tabs.map((t) =>
      t.id === s.activeTabId
        ? { ...t, connected: false, connecting: false, serverInfo: null, tools: [], resources: [], prompts: [], selectedItem: null, error: null }
        : t
    ),
  })),

  setError: (e) => set((s) => ({
    tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, error: e, connecting: false } : t)),
  })),

  selectItem: (type, item) => set((s) => ({
    tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, selectedItem: { type, item } } : t)),
  })),

  addTrace: (t) => set((s) => ({
    tabs: s.tabs.map((tab) =>
      tab.id === s.activeTabId ? { ...tab, traces: [t, ...tab.traces].slice(0, 500) } : tab
    ),
  })),

  clearTraces: () => set((s) => ({
    tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, traces: [] } : t)),
  })),

  // ── Chat Actions ───────────────────────────────────────────
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),

  clearMessages: () => set({ messages: [] }),

  setClaudeApiKey: (k) => set({ claudeApiKey: k }),

  // ── UI Actions ─────────────────────────────────────────────
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(w, 600)) }),

  setSectionHeight: (section, height) => set((s) => ({
    sectionHeights: { ...s.sectionHeights, [section]: Math.max(80, height) }
  })),

  // ── Getters ────────────────────────────────────────────────
  getActiveTab: () => {
    const s = get()
    return s.tabs.find((t) => t.id === s.activeTabId)
  },
}))
