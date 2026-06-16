'use client'
import { useState } from 'react'
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

  const [url, setUrl] = useState(activeTab.config.url || '')
  const [transport, setTransport] = useState<TransportType>(activeTab.config.transport || 'auto')
  const [token, setToken] = useState(activeTab.config.authToken || '')
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [newTabName, setNewTabName] = useState('')
  const [showNewTabDialog, setShowNewTabDialog] = useState(false)
  const [newServerName, setNewServerName] = useState('')

  const isGitHubCopilot = url.includes('githubcopilot.com')

  async function connect() {
    if (!url.trim()) return
    const authToken = token.trim()
    setConnecting(true)
    setConfig({ url: url.trim(), transport, authToken })

    try {
      const res = await fetch('/api/proxy/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), transport, authToken: authToken || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Connection failed')
      setConnected(data.serverInfo, data.tools, data.resources, data.prompts)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function disconnect() {
    fetch('/api/proxy/disconnect', { method: 'POST' }).catch(() => {})
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
    <div className="flex flex-col gap-2 bg-[#141416] border-b border-[#2a2a32] flex-shrink-0">
      {/* Tab Bar */}
      <div className="flex items-center px-4 py-2 gap-1 overflow-x-auto border-b border-[#2a2a32]">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
              activeTabId === tab.id
                ? 'bg-[#222228] text-[#e8e8f0]'
                : 'bg-transparent text-[#9090a8] hover:bg-[#1a1a1e]'
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
                className="bg-[#1a1a1e] border border-[#5a54c4] rounded px-2 py-1 text-[12px] outline-none text-[#e8e8f0]"
              />
            ) : (
              <button
                onClick={() => switchTab(tab.id)}
                onDoubleClick={() => handleRenameTab(tab.id)}
                className="text-[12px] font-medium hover:underline"
              >
                {tab.name}
              </button>
            )}
            {tab.connected && (
              <span className="w-2 h-2 rounded-full bg-[#7c6ff7] flex-shrink-0" />
            )}
            <button
              onClick={() => deleteTab(tab.id)}
              className="text-[10px] text-[#5a5a70] hover:text-[#f06a6a] ml-1"
              title="Delete server"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={() => handleCreateNewTab()}
          className="ml-2 px-2 py-1.5 text-[12px] font-semibold bg-[#222228] text-[#9090a8] hover:bg-[#2a2a32]
                     hover:text-[#e8e8f0] rounded-md transition-colors"
        >
          + New
        </button>
      </div>

      {/* Connection Bar */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a70] whitespace-nowrap">
            Server
          </span>

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && connect()}
            placeholder="https://your-server.com/mcp"
            disabled={activeTab.connected || activeTab.connecting}
            className="flex-1 bg-[#1a1a1e] border border-[#2a2a32] rounded-md px-3 py-1.5 text-[12px] font-mono
                       text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          />

          <select
            value={transport}
            onChange={(e) => setTransport(e.target.value as TransportType)}
            disabled={activeTab.connected || activeTab.connecting}
            className="bg-[#1a1a1e] border border-[#2a2a32] rounded-md px-2 py-1.5 text-[12px]
                       text-[#9090a8] outline-none cursor-pointer disabled:opacity-40"
          >
            <option value="auto">Auto-detect</option>
            <option value="http-sse">HTTP / SSE</option>
            <option value="stdio">stdio</option>
          </select>

          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
            placeholder={isGitHubCopilot ? "GitHub token" : "Bearer token"}
            disabled={activeTab.connected || activeTab.connecting}
            className="w-48 bg-[#1a1a1e] border border-[#2a2a32] rounded-md px-3 py-1.5 text-[12px] font-mono
                       text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                       disabled:opacity-40 transition-colors"
          />

          {activeTab.connected ? (
            <button
              onClick={disconnect}
              className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#2a1010] text-[#f06a6a]
                         border border-[#3a1a1a] hover:bg-[#3a1414] transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={activeTab.connecting || !url.trim()}
              className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#5a54c4] text-white
                         hover:bg-[#7c6ff7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center gap-2"
            >
              {activeTab.connecting ? <span className="spinner">●</span> : 'Connect'}
            </button>
          )}
        </div>

        {isGitHubCopilot && !token && (
          <div className="text-[11px] text-[#f0a840] bg-[#1a1610] border border-[#2a1a1a] rounded px-3 py-2">
            <strong>GitHub Copilot requires authentication:</strong> 
            Enter your GitHub Personal Access Token. Create one at 
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" 
               className="text-[#7c6ff7] hover:underline ml-1">GitHub Settings → Tokens</a>
            {' '}with scopes: <code className="text-[#9090a8]">repo, read:org</code>
          </div>
        )}
      </div>

      {/* New Server Dialog */}
      {showNewTabDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg p-4 w-96 shadow-2xl">
            <h2 className="text-[13px] font-bold text-[#e8e8f0] mb-3">Create New Server Connection</h2>
            <input
              autoFocus
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewServer()
                if (e.key === 'Escape') setShowNewTabDialog(false)
              }}
              placeholder="Server name (optional)"
              className="w-full bg-[#141416] border border-[#2a2a32] rounded px-3 py-2 text-[12px] font-mono
                         text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                         transition-colors mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewTabDialog(false)}
                className="px-3 py-1.5 text-[12px] font-semibold bg-[#222228] text-[#9090a8]
                           hover:bg-[#2a2a32] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewServer}
                className="px-3 py-1.5 text-[12px] font-semibold bg-[#5a54c4] text-white
                           hover:bg-[#7c6ff7] rounded transition-colors"
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
