'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import type { TransportType } from '@/lib/types'

export function ConnectionBar() {
  const {
    tabs,
    activeTabId,
    getActiveTab,
    switchTab,
    createTab,
    deleteTab,
    setConfig,
    setConnected,
    setConnecting,
    setDisconnected,
    setError,
  } = useStore()

  const activeTab = getActiveTab()
  if (!activeTab) return null

  const liveConnected = activeTab.connected && !activeTab.sessionLoaded

  const [url, setUrl] = useState(activeTab.config.url || '')
  const [transport, setTransport] = useState<TransportType>(activeTab.config.transport || 'auto')
  const [token, setToken] = useState(activeTab.config.authToken || '')
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [newTabName, setNewTabName] = useState('')
  const [showNewTabDialog, setShowNewTabDialog] = useState(false)
  const [newServerName, setNewServerName] = useState('')

  useEffect(() => {
    setUrl(activeTab.config.url || '')
    setTransport(activeTab.config.transport || 'auto')
  }, [activeTabId, activeTab.config.url, activeTab.config.transport])

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI
  const isGitHubCopilot = url.includes('githubcopilot.com')
  const isStdioMode = transport === 'stdio' && isElectron

  async function connect() {
    if (!url.trim()) return
    const authToken = token.trim()
    setConnecting(true)
    setConfig({ url: url.trim(), transport, authToken })

    try {
      if (isStdioMode) {
        const api = (window as any).electronAPI
        const data = await api.mcp.connect(activeTab!.id, url.trim())
        setConnected(data.serverInfo, data.tools, data.resources, data.prompts, true)
      } else {
        const res = await fetch('/api/proxy/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim(), transport, authToken: authToken || undefined }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Connection failed')
        setConnected(data.serverInfo, data.tools, data.resources, data.prompts)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function disconnect() {
    if (activeTab!.stdioMode && isElectron) {
      ;(window as any).electronAPI.mcp.disconnect(activeTab!.id).catch(() => {})
    } else {
      fetch('/api/proxy/disconnect', { method: 'POST' }).catch(() => {})
    }
    setDisconnected()
  }

  const handleRenameTab = (tabId: string) => {
    setRenamingTabId(tabId)
    setNewTabName(tabs.find((t) => t.id === tabId)?.name || '')
  }

  const saveTabName = (tabId: string) => {
    if (newTabName.trim()) {
      const { renameTab } = useStore.getState()
      renameTab(tabId, newTabName.trim())
    }
    setRenamingTabId(null)
  }

  const handleCreateNewTab = () => {
    setShowNewTabDialog(true)
    setNewServerName('')
  }

  const createNewServer = () => {
    const finalName = newServerName.trim() || undefined
    createTab(finalName)
    setShowNewTabDialog(false)
    setNewServerName('')
  }

  return (
    <div className="flex flex-col gap-2 bg-[var(--c-bg-1)] border-b border-[var(--c-border)] flex-shrink-0">
      {/* Tab Bar */}
      <div className="flex items-center px-4 py-2 gap-1 overflow-x-auto border-b border-[var(--c-border)]">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
              activeTabId === tab.id
                ? 'bg-[var(--c-bg-3)] text-[var(--c-text)]'
                : 'bg-transparent text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)]'
            }`}
          >
            {renamingTabId === tab.id ? (
              <input
                autoFocus
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onBlur={() => saveTabName(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTabName(tab.id)
                  if (e.key === 'Escape') setRenamingTabId(null)
                }}
                onClick={() => switchTab(tab.id)}
                className="bg-[var(--c-bg-2)] border border-[var(--c-purple-2)] rounded px-2 py-1 text-[14px] outline-none text-[var(--c-text)]"
              />
            ) : (
              <button
                onClick={() => switchTab(tab.id)}
                onDoubleClick={() => handleRenameTab(tab.id)}
                className="text-[14px] font-medium hover:underline"
              >
                {tab.name}
              </button>
            )}
            {tab.connected && !tab.sessionLoaded && (
              <span className="w-2 h-2 rounded-full bg-[var(--c-purple)] flex-shrink-0" />
            )}
            <button
              onClick={() => deleteTab(tab.id)}
              className="text-[12px] text-[var(--c-text-3)] hover:text-[var(--c-red)] ml-1"
              title="Delete server"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={() => handleCreateNewTab()}
          className="ml-2 px-2 py-1.5 text-[14px] font-semibold bg-[var(--c-bg-3)] text-[var(--c-text-2)] hover:bg-[var(--c-border)]
                     hover:text-[var(--c-text)] rounded-md transition-colors"
        >
          + New
        </button>
      </div>

      {/* Connection Bar */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--c-text-3)] whitespace-nowrap">
            Server
          </span>

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && connect()}
            placeholder={isStdioMode ? 'node /path/to/server.js' : 'https://your-server.com/mcp'}
            disabled={liveConnected || activeTab.connecting}
            className="w-full bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-1.5 text-[14px] font-mono
                       text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          />

          <select
            value={transport}
            onChange={(e) => setTransport(e.target.value as TransportType)}
            disabled={liveConnected || activeTab.connecting}
            className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-2 py-1.5 text-[14px]
                       text-[var(--c-text-2)] outline-none cursor-pointer disabled:opacity-40"
          >
            <option value="auto">Auto-detect</option>
            <option value="http-sse">HTTP / SSE</option>
            {isElectron && <option value="stdio">stdio</option>}
          </select>

          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
            placeholder={isGitHubCopilot ? "GitHub token" : "Bearer token"}
            disabled={liveConnected || activeTab.connecting}
            className="w-48 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-md px-3 py-1.5 text-[14px] font-mono
                       text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                       disabled:opacity-40 transition-colors"
          />

          {liveConnected ? (
            <button
              onClick={disconnect}
              className="px-3 py-1.5 rounded-md text-[14px] font-semibold bg-[var(--c-red-bg)] text-[var(--c-red)]
                         border border-[var(--c-red-bg-2)] hover:bg-[var(--c-red-bg-3)] transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={activeTab.connecting || !url.trim()}
              className="px-3 py-1.5 rounded-md text-[14px] font-semibold bg-[var(--c-purple-2)] text-white
                         hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center gap-2"
            >
              {activeTab.connecting ? <span className="spinner">●</span> : 'Connect'}
            </button>
          )}
        </div>

        {isGitHubCopilot && !token && (
          <div className="text-[13px] text-[var(--c-amber)] bg-[var(--c-amber-border)] border border-[var(--c-amber-border-2)] rounded px-3 py-2">
            <strong>GitHub Copilot requires authentication:</strong> 
            Enter your GitHub Personal Access Token. Create one at 
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" 
               className="text-[var(--c-purple)] hover:underline ml-1">GitHub Settings → Tokens</a>
            {' '}with scopes: <code className="text-[var(--c-text-2)]">repo, read:org</code>
          </div>
        )}
      </div>

      {/* New Server Dialog */}
      {showNewTabDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-4 w-96 shadow-2xl">
            <h2 className="text-[15px] font-bold text-[var(--c-text)] mb-3">Create New Server Connection</h2>
            <input
              autoFocus
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewServer()
                if (e.key === 'Escape') setShowNewTabDialog(false)
              }}
              placeholder="Server name (optional)"
              className="w-full bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded px-3 py-2 text-[14px] font-mono
                         text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                         transition-colors mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewTabDialog(false)}
                className="px-3 py-1.5 text-[14px] font-semibold bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                           hover:bg-[var(--c-border)] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewServer}
                className="px-3 py-1.5 text-[14px] font-semibold bg-[var(--c-purple-2)] text-white
                           hover:bg-[var(--c-purple)] rounded transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
