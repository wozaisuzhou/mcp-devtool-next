'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import type { TransportType } from '@/lib/types'

export function ConnectionBar() {
  const { config, connected, connecting, setConfig, setConnected, setConnecting, setDisconnected, setError } = useStore()
  const [url, setUrl] = useState(config.url || '')
  const [transport, setTransport] = useState<TransportType>(config.transport || 'auto')
  const [token, setToken] = useState(config.authToken || '')

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

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-[#141416] border-b border-[#2a2a32] flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a70] whitespace-nowrap">
          Server
        </span>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && connect()}
          placeholder="https://your-server.com/mcp"
          disabled={connected || connecting}
          className="flex-1 bg-[#1a1a1e] border border-[#2a2a32] rounded-md px-3 py-1.5 text-[12px] font-mono
                     text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        />

        <select
          value={transport}
          onChange={(e) => setTransport(e.target.value as TransportType)}
          disabled={connected || connecting}
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
          disabled={connected || connecting}
          className="w-48 bg-[#1a1a1e] border border-[#2a2a32] rounded-md px-3 py-1.5 text-[12px] font-mono
                     text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                     disabled:opacity-40 transition-colors"
        />

        {connected ? (
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
            disabled={connecting || !url.trim()}
            className="px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#5a54c4] text-white
                       hover:bg-[#7c6ff7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                       flex items-center gap-2"
          >
            {connecting ? <span className="spinner">●</span> : 'Connect'}
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
  )
}
