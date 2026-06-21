'use client'
import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/store'
import type { MCPTool, MCPResource, MCPPrompt } from '@/lib/types'

export function Sidebar() {
  const { selectItem, sidebarWidth, setSidebarWidth, sectionHeights, setSectionHeight, getActiveTab } = useStore()
  const activeTab = getActiveTab()
  
  if (!activeTab) return null

  const tools = activeTab.tools
  const resources = activeTab.resources
  const prompts = activeTab.prompts
  const selectedItem = activeTab.selectedItem

  const resizeRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizingSection, setResizingSection] = useState<'tools-resources' | 'resources-prompts' | null>(null)
  const [searchTools, setSearchTools] = useState('')
  const [searchResources, setSearchResources] = useState('')
  const [searchPrompts, setSearchPrompts] = useState('')
  const startYRef = useRef<number>(0)
  const startHeightsRef = useRef<{ tools: number; resources: number; prompts: number }>({ ...sectionHeights })

  const filteredTools = tools.filter(t => t.name.toLowerCase().includes(searchTools.toLowerCase()))
  const filteredResources = resources.filter(r => r.name.toLowerCase().includes(searchResources.toLowerCase()))
  const filteredPrompts = prompts.filter(p => p.name.toLowerCase().includes(searchPrompts.toLowerCase()))

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setSidebarWidth])

  useEffect(() => {
    if (!resizingSection) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startYRef.current

      if (resizingSection === 'tools-resources') {
        const newToolsHeight = Math.max(80, startHeightsRef.current.tools + delta)
        const newResourcesHeight = Math.max(80, startHeightsRef.current.resources - delta)
        setSectionHeight('tools', newToolsHeight)
        setSectionHeight('resources', newResourcesHeight)
      } else if (resizingSection === 'resources-prompts') {
        const newResourcesHeight = Math.max(80, startHeightsRef.current.resources + delta)
        const newPromptsHeight = Math.max(80, startHeightsRef.current.prompts - delta)
        setSectionHeight('resources', newResourcesHeight)
        setSectionHeight('prompts', newPromptsHeight)
      }
    }

    const handleMouseUp = () => {
      setResizingSection(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingSection, setSectionHeight])

  const handleResizeStart = (section: 'tools-resources' | 'resources-prompts', e: React.MouseEvent) => {
    startYRef.current = e.clientY
    startHeightsRef.current = { ...sectionHeights }
    setResizingSection(section)
  }

  return (
    <>
      <aside style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 border-r border-[var(--c-border)] flex flex-col overflow-x-hidden overflow-y-auto bg-[var(--c-bg-base)] relative">
      <Section
        title="Tools"
        count={filteredTools.length}
        countColor="text-[var(--c-purple)] bg-[var(--c-purple-bg)]"
        height={sectionHeights.tools}
        onSearch={setSearchTools}
        searchValue={searchTools}
      >
        {filteredTools.map((t) => (
          <SidebarItem
            key={t.name}
            icon="T"
            label={t.name}
            badge="TOOL"
            badgeClass="bg-[var(--c-purple-bg)] text-[var(--c-purple)]"
            active={selectedItem?.type === 'tool' && (selectedItem.item as MCPTool).name === t.name}
            onClick={() => selectItem('tool', t)}
          />
        ))}
      </Section>

      {/* Resize Handle 1 */}
      <div
        onMouseDown={(e) => handleResizeStart('tools-resources', e)}
        className={`h-1 cursor-row-resize hover:bg-[var(--c-purple)] transition-colors ${
          resizingSection === 'tools-resources' ? 'bg-[var(--c-purple)]' : 'bg-transparent'
        }`}
        style={{ userSelect: 'none' }}
      />

      <Section
        title="Resources"
        count={filteredResources.length}
        countColor="text-[var(--c-blue)] bg-[var(--c-blue-bg)]"
        height={sectionHeights.resources}
        onSearch={setSearchResources}
        searchValue={searchResources}
      >
        {filteredResources.map((r) => (
          <SidebarItem
            key={r.uri}
            icon="R"
            label={r.name}
            badge="RES"
            badgeClass="bg-[var(--c-blue-bg)] text-[var(--c-blue)]"
            active={selectedItem?.type === 'resource' && (selectedItem.item as MCPResource).uri === r.uri}
            onClick={() => selectItem('resource', r)}
          />
        ))}
      </Section>

      {/* Resize Handle 2 */}
      <div
        onMouseDown={(e) => handleResizeStart('resources-prompts', e)}
        className={`h-1 cursor-row-resize hover:bg-[var(--c-purple)] transition-colors ${
          resizingSection === 'resources-prompts' ? 'bg-[var(--c-purple)]' : 'bg-transparent'
        }`}
        style={{ userSelect: 'none' }}
      />

      <Section
        title="Prompts"
        count={filteredPrompts.length}
        countColor="text-[var(--c-amber)] bg-[var(--c-amber-bg)]"
        height={sectionHeights.prompts}
        onSearch={setSearchPrompts}
        searchValue={searchPrompts}
      >
        {filteredPrompts.map((p) => (
          <SidebarItem
            key={p.name}
            icon="P"
            label={p.name}
            badge="PROMPT"
            badgeClass="bg-[var(--c-amber-bg)] text-[var(--c-amber)]"
            active={selectedItem?.type === 'prompt' && (selectedItem.item as MCPPrompt).name === p.name}
            onClick={() => selectItem('prompt', p)}
          />
        ))}
      </Section>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={() => setIsResizing(true)}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--c-purple)] transition-colors ${
          isResizing ? 'bg-[var(--c-purple)]' : 'bg-transparent'
        }`}
        style={{ userSelect: 'none' }}
      />
    </aside>
    </>
  )
}

function Section({ title, count, countColor, height, onSearch, searchValue, children }: {
  title: string
  count: number
  countColor: string
  height: number
  onSearch?: (value: string) => void
  searchValue?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[var(--c-border)] flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-3.5 py-2 flex-shrink-0">
        <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--c-text-3)]">{title}</span>
        <span className={`text-[12px] font-bold px-1.5 py-px rounded-full ${countColor}`}>{count}</span>
      </div>
      {onSearch && (
        <div className="px-2 pb-2 flex-shrink-0">
          <input
            value={searchValue || ''}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search…"
            className="w-full bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded px-2 py-1 text-[13px]
                       text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                       transition-colors"
          />
        </div>
      )}
      <div style={{ height: `${height}px` }} className="overflow-y-auto flex-shrink-0">
        {children}
        <div className="h-8 flex-shrink-0" />
      </div>
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
      className={`w-full flex items-center gap-2 px-3.5 py-2 text-[14px] text-left transition-colors
        ${active
          ? 'bg-[var(--c-purple-bg)] text-[var(--c-purple)]'
          : 'text-[var(--c-text-2)] hover:bg-[var(--c-bg-2)] hover:text-[var(--c-text)]'
        }`}
    >
      <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0
        ${active ? 'bg-[var(--c-purple-active)] text-[var(--c-purple)]' : 'bg-[var(--c-bg-3)] text-[var(--c-text-3)]'}`}>
        {icon}
      </span>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono">{label}</span>
      <span className={`text-[9px] font-bold px-1.5 py-px rounded flex-shrink-0 ${badgeClass}`}>{badge}</span>
    </button>
  )
}
