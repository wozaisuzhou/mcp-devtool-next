// Manages direct stdio MCP connections (one per tab) in the Electron main process.
// Uses dynamic import() so the ESM-only SDK loads inside a CJS process.

interface StdioEntry {
  client: any
  transport: any
}

const connections = new Map<string, StdioEntry>()

function parseCommand(raw: string): { command: string; args: string[] } {
  const tokens: string[] = []
  let current = ''
  let inQuote: '"' | "'" | null = null
  for (const ch of raw.trim()) {
    if (inQuote) {
      if (ch === inQuote) inQuote = null
      else current += ch
    } else if (ch === '"' || ch === "'") {
      inQuote = ch
    } else if (ch === ' ') {
      if (current) { tokens.push(current); current = '' }
    } else {
      current += ch
    }
  }
  if (current) tokens.push(current)
  return { command: tokens[0] ?? '', args: tokens.slice(1) }
}

export async function connectStdio(tabId: string, rawCommand: string) {
  await disconnectStdio(tabId)

  const { command, args } = parseCommand(rawCommand)

  const { Client }               = await import('@modelcontextprotocol/sdk/client/index.js' as string)
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js' as string)

  const transport = new StdioClientTransport({ command, args })
  const client    = new Client({ name: 'bubble-mcp', version: '1.0.0' }, { capabilities: {} })
  await client.connect(transport)

  const [toolsRes, resourcesRes, promptsRes] = await Promise.allSettled([
    client.listTools(),
    client.listResources(),
    client.listPrompts(),
  ])

  connections.set(tabId, { client, transport })

  return {
    serverInfo: client.getServerVersion() ?? { name: command, version: '?' },
    tools:      toolsRes.status     === 'fulfilled' ? toolsRes.value.tools         : [],
    resources:  resourcesRes.status === 'fulfilled' ? resourcesRes.value.resources : [],
    prompts:    promptsRes.status   === 'fulfilled' ? promptsRes.value.prompts     : [],
  }
}

export async function callStdioTool(tabId: string, toolName: string, input: Record<string, unknown>) {
  const entry = connections.get(tabId)
  if (!entry) throw new Error('Not connected via stdio')
  const start  = Date.now()
  const result = await entry.client.callTool({ name: toolName, arguments: input })
  return { result: result.content, isError: !!result.isError, durationMs: Date.now() - start }
}

export async function callStdioResource(tabId: string, uri: string) {
  const entry = connections.get(tabId)
  if (!entry) throw new Error('Not connected via stdio')
  const result = await entry.client.readResource({ uri })
  return { result: result.contents }
}

export async function disconnectStdio(tabId: string) {
  const entry = connections.get(tabId)
  if (!entry) return
  try { await entry.transport.close() } catch {}
  connections.delete(tabId)
}

export function disconnectAll() {
  for (const [tabId] of connections) disconnectStdio(tabId).catch(() => {})
}
