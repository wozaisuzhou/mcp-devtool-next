'use client'
import { useStore } from '@/store'
import { Sidebar } from '@/components/inspector/Sidebar'
import { DetailPane } from '@/components/inspector/DetailPane'

export default function InspectorPage() {
  const { getActiveTab } = useStore()
  const activeTab = getActiveTab()
  const connected = activeTab?.connected ?? false

  return (
    <div className="flex h-full">
      <Sidebar />
      <DetailPane />
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
             style={{ top: '96px' }}>
          <div className="text-center text-[#5a5a70]">
            <div className="text-4xl mb-3 opacity-20">⬡</div>
            <p className="text-[13px]">Connect to an MCP server to start inspecting</p>
            <p className="text-[11px] mt-1 opacity-60">Enter a server URL above and click Connect</p>
          </div>
        </div>
      )}
    </div>
  )
}
