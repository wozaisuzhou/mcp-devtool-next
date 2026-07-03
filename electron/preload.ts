import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true as const,
  platform:   process.platform,

  mcp: {
    connect:      (tabId: string, command: string) =>
      ipcRenderer.invoke('mcp:connect', { tabId, command }),

    callTool:     (tabId: string, toolName: string, input: Record<string, unknown>) =>
      ipcRenderer.invoke('mcp:callTool', { tabId, toolName, input }),

    callResource: (tabId: string, uri: string) =>
      ipcRenderer.invoke('mcp:callResource', { tabId, uri }),

    disconnect:   (tabId: string) =>
      ipcRenderer.invoke('mcp:disconnect', { tabId }),
  },
})

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true
      platform:   string
      mcp: {
        connect:      (tabId: string, command: string)                                  => Promise<{ serverInfo: any; tools: any[]; resources: any[]; prompts: any[] }>
        callTool:     (tabId: string, toolName: string, input: Record<string, unknown>) => Promise<{ result: any; isError: boolean; durationMs: number }>
        callResource: (tabId: string, uri: string)                                      => Promise<{ result: any }>
        disconnect:   (tabId: string)                                                   => Promise<void>
      }
    }
  }
}
