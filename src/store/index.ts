'use client'
import { create } from 'zustand'
import type {
  ConnectionConfig, ServerInfo, MCPTool, MCPResource,
  MCPPrompt, TraceEvent, ChatMessage, RegisteredUser,
} from '@/lib/types'

const USER_STORAGE_KEY = 'flashman_user'

export interface TabState {
  id: string
  name: string
  connected: boolean
  connecting: boolean
  sessionLoaded: boolean
  stdioMode: boolean  // true when connected via Electron stdio IPC
  config: ConnectionConfig
  serverInfo: ServerInfo | null
  error: string | null
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  selectedItem: { type: 'tool' | 'resource' | 'prompt'; item: MCPTool | MCPResource | MCPPrompt } | null
  openItems: { key: string; type: 'tool' | 'resource' | 'prompt' }[]
  traces: TraceEvent[]
}

function itemKey(type: 'tool' | 'resource' | 'prompt', item: MCPTool | MCPResource | MCPPrompt): string {
  const name = type === 'resource' ? (item as MCPResource).uri : (item as MCPTool | MCPPrompt).name
  return `${type}:${name}`
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

  // ── Tab Actions ────────────────────────────────────────────
  createTab: (name?: string) => void
  deleteTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  renameTab: (tabId: string, name: string) => void

  // ── Connection Actions ─────────────────────────────────────
  setConfig: (c: Partial<ConnectionConfig>) => void
  setConnected: (info: ServerInfo, tools: MCPTool[], resources: MCPResource[], prompts: MCPPrompt[], stdioMode?: boolean) => void
  setConnecting: (v: boolean) => void
  setDisconnected: () => void
  setError: (e: string | null) => void
  selectItem: (type: 'tool' | 'resource' | 'prompt', item: MCPTool | MCPResource | MCPPrompt) => void
  closeItem: (key: string) => void
  addTrace: (t: TraceEvent) => void
  clearTraces: () => void
  loadSession: (params: {
    sessionName: string
    serverUrl: string
    transport?: string
    serverInfo: ServerInfo | null
    tools: MCPTool[]
    resources: MCPResource[]
    prompts: MCPPrompt[]
    traces: TraceEvent[]
  }) => void

  // ── Chat Actions ───────────────────────────────────────────
  addMessage: (m: ChatMessage) => void
  clearMessages: () => void
  setClaudeApiKey: (k: string) => void

  // ── UI Actions ─────────────────────────────────────────────
  setSidebarWidth: (w: number) => void

  // ── Auth ───────────────────────────────────────────────────
  user: RegisteredUser | null
  userReady: boolean
  initUser: () => void
  saveUser: (u: RegisteredUser) => void
  clearUser: () => void

  // ── Getters ────────────────────────────────────────────────
  getActiveTab: () => TabState | undefined
}

const createEmptyTab = (id: string, name: string): TabState => ({
  id,
  name,
  connected: false,
  connecting: false,
  sessionLoaded: false,
  stdioMode: false,
  config: { url: '', transport: 'auto', authToken: '' },
  serverInfo: null,
  error: null,
  tools: [],
  resources: [],
  prompts: [],
  selectedItem: null,
  openItems: [],
  traces: [],
})

export const useStore = create<AppStore>((set, get) => ({
  tabs: [createEmptyTab('tab-1', 'Server 1')],
  activeTabId: 'tab-1',
  messages: [],
  claudeApiKey: '',
  sidebarWidth: 256,
  user: null,
  userReady: false,

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

  setConnected: (info, tools, resources, prompts, stdioMode = false) => set((s) => ({
    tabs: s.tabs.map((t) =>
      t.id === s.activeTabId
        ? { ...t, connected: true, connecting: false, sessionLoaded: false, stdioMode, serverInfo: info, tools, resources, prompts, error: null }
        : t
    ),
  })),

  setConnecting: (v) => set((s) => ({
    tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, connecting: v } : t)),
  })),

  setDisconnected: () => set((s) => ({
    tabs: s.tabs.map((t) =>
      t.id === s.activeTabId
        ? { ...t, connected: false, connecting: false, sessionLoaded: false, stdioMode: false, serverInfo: null, tools: [], resources: [], prompts: [], selectedItem: null, openItems: [], error: null }
        : t
    ),
  })),

  loadSession: ({ sessionName, serverUrl, transport, serverInfo, tools, resources, prompts, traces }) => set((s) => ({
    tabs: s.tabs.map((t) =>
      t.id === s.activeTabId
        ? {
            ...t,
            connected: true,
            connecting: false,
            sessionLoaded: true,
            name: sessionName,
            config: { ...t.config, url: serverUrl, ...(transport ? { transport: transport as any } : {}) },
            serverInfo,
            tools,
            resources,
            prompts,
            traces,
            error: null,
            selectedItem: null,
            openItems: [],
          }
        : t
    ),
  })),

  setError: (e) => set((s) => ({
    tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, error: e, connecting: false } : t)),
  })),

  selectItem: (type, item) => set((s) => {
    const key = itemKey(type, item)
    return {
      tabs: s.tabs.map((t) => {
        if (t.id !== s.activeTabId) return t
        const alreadyOpen = t.openItems.some((o) => o.key === key)
        return {
          ...t,
          selectedItem: { type, item },
          openItems: alreadyOpen ? t.openItems : [...t.openItems, { key, type }],
        }
      }),
    }
  }),

  closeItem: (key) => set((s) => ({
    tabs: s.tabs.map((t) => {
      if (t.id !== s.activeTabId) return t
      const idx = t.openItems.findIndex((o) => o.key === key)
      if (idx === -1) return t
      const newOpenItems = t.openItems.filter((o) => o.key !== key)
      const wasSelected = t.selectedItem && itemKey(t.selectedItem.type, t.selectedItem.item) === key
      if (!wasSelected) return { ...t, openItems: newOpenItems }

      const fallback = newOpenItems[idx] ?? newOpenItems[idx - 1]
      let selectedItem: TabState['selectedItem'] = null
      if (fallback) {
        const list = fallback.type === 'tool' ? t.tools : fallback.type === 'resource' ? t.resources : t.prompts
        const item = list.find((i: any) => itemKey(fallback.type, i) === fallback.key)
        if (item) selectedItem = { type: fallback.type, item }
      }
      return { ...t, openItems: newOpenItems, selectedItem }
    }),
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

  // ── Auth ───────────────────────────────────────────────────
  initUser: () => {
    if (get().userReady) return
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY)
      set({ user: raw ? JSON.parse(raw) : null, userReady: true })
    } catch {
      set({ userReady: true })
    }
  },

  saveUser: (u) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u))
    set({ user: u })
  },

  clearUser: () => {
    localStorage.removeItem(USER_STORAGE_KEY)
    set({ user: null })
  },

  // ── Getters ────────────────────────────────────────────────
  getActiveTab: () => {
    const s = get()
    return s.tabs.find((t) => t.id === s.activeTabId)
  },
}))
