import type { MCPTool, MCPResource, MCPPrompt } from './types'

export interface DiffResult {
  added: string[]
  removed: string[]
  changed: string[]
}

export function diffTools(a: MCPTool[], b: MCPTool[]): DiffResult {
  const aMap = new Map(a.map(t => [t.name, t]))
  const bMap = new Map(b.map(t => [t.name, t]))
  const aNames = new Set(aMap.keys())
  const bNames = new Set(bMap.keys())
  return {
    added:   [...bNames].filter(n => !aNames.has(n)),
    removed: [...aNames].filter(n => !bNames.has(n)),
    changed: [...bNames].filter(n => aNames.has(n) && (
      JSON.stringify(aMap.get(n)?.description)  !== JSON.stringify(bMap.get(n)?.description) ||
      JSON.stringify(aMap.get(n)?.inputSchema)  !== JSON.stringify(bMap.get(n)?.inputSchema)
    )),
  }
}

export function diffByName(a: Array<{ name: string }>, b: Array<{ name: string }>): DiffResult {
  const aNames = new Set(a.map(x => x.name))
  const bNames = new Set(b.map(x => x.name))
  return {
    added:   [...bNames].filter(n => !aNames.has(n)),
    removed: [...aNames].filter(n => !bNames.has(n)),
    changed: [],
  }
}

export function diffByUri(a: Array<{ uri: string }>, b: Array<{ uri: string }>): DiffResult {
  const aUris = new Set(a.map(x => x.uri))
  const bUris = new Set(b.map(x => x.uri))
  return {
    added:   [...bUris].filter(n => !aUris.has(n)),
    removed: [...aUris].filter(n => !bUris.has(n)),
    changed: [],
  }
}

export function hasDiff(...diffs: DiffResult[]): boolean {
  return diffs.some(d => d.added.length + d.removed.length + d.changed.length > 0)
}

export interface CapabilityDiff {
  tools: DiffResult
  resources: DiffResult
  prompts: DiffResult
}

export function diffCapabilities(
  snapshot: { tools: MCPTool[]; resources: MCPResource[]; prompts: MCPPrompt[] },
  live:     { tools: MCPTool[]; resources: MCPResource[]; prompts: MCPPrompt[] },
): CapabilityDiff {
  return {
    tools:     diffTools(snapshot.tools, live.tools),
    resources: diffByUri(snapshot.resources, live.resources),
    prompts:   diffByName(snapshot.prompts, live.prompts),
  }
}
