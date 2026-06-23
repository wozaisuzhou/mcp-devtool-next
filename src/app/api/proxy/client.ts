import type { Client } from '@modelcontextprotocol/sdk/client/index.js'

// Module-level singleton shared across all proxy routes within one server instance
let mcpClient: Client | null = null

export function getMcpClient() { return mcpClient }
export function setMcpClient(c: Client | null) { mcpClient = c }
