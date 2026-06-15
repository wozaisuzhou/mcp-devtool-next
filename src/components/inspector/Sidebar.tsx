'use client'
import { useStore } from '@/store'
import type { MCPTool, MCPResource, MCPPrompt } from '@/lib/types'

export function Sidebar() {
  const { tools, resources, prompts, selectedItem, selectItem } = useStore()

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#2a2a32] flex flex-col overflow-hidden bg-[#0d0d0f]">
      <Section
        title="Tools"
        count={tools.length}
        countColor="text-[#7c6ff7] bg-[#1e1c3a]"
      >
        {tools.map((t) => (
          <SidebarItem
            key={t.name}
            icon="T"
            label={t.name}
            badge="TOOL"
            badgeClass="bg-[#1e1c3a] text-[#7c6ff7]"
            active={selectedItem?.type === 'tool' && (selectedItem.item as MCPTool).name === t.name}
            onClick={() => selectItem('tool', t)}
          />
        ))}
      </Section>

      <Section
        title="Resources"
        count={resources.length}
        countColor="text-[#60a8f0] bg-[#0e1e30]"
      >
        {resources.map((r) => (
          <SidebarItem
            key={r.uri}
            icon="R"
            label={r.name}
            badge="RES"
            badgeClass="bg-[#0e1e30] text-[#60a8f0]"
            active={selectedItem?.type === 'resource' && (selectedItem.item as MCPResource).uri === r.uri}
            onClick={() => selectItem('resource', r)}
          />
        ))}
      </Section>

      <Section
        title="Prompts"
        count={prompts.length}
        countColor="text-[#f0a840] bg-[#2a1e08]"
      >
        {prompts.map((p) => (
          <SidebarItem
            key={p.name}
            icon="P"
            label={p.name}
            badge="PROMPT"
            badgeClass="bg-[#2a1e08] text-[#f0a840]"
            active={selectedItem?.type === 'prompt' && (selectedItem.item as MCPPrompt).name === p.name}
            onClick={() => selectItem('prompt', p)}
          />
        ))}
      </Section>
    </aside>
  )
}

function Section({ title, count, countColor, children }: {
  title: string
  count: number
  countColor: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#2a2a32]">
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a70]">{title}</span>
        <span className={`text-[10px] font-bold px-1.5 py-px rounded-full ${countColor}`}>{count}</span>
      </div>
      <div className="overflow-y-auto max-h-48">{children}</div>
    </div>
  )
}

function SidebarItem({ icon, label, badge, badgeClass, active, onClick }: {
  icon: string
  label: string
  badge: string
  badgeClass: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-left transition-colors
        ${active
          ? 'bg-[#1e1c3a] text-[#7c6ff7]'
          : 'text-[#9090a8] hover:bg-[#1a1a1e] hover:text-[#e8e8f0]'
        }`}
    >
      <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0
        ${active ? 'bg-[#2a2860] text-[#7c6ff7]' : 'bg-[#222228] text-[#5a5a70]'}`}>
        {icon}
      </span>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono">{label}</span>
      <span className={`text-[9px] font-bold px-1.5 py-px rounded flex-shrink-0 ${badgeClass}`}>{badge}</span>
    </button>
  )
}
