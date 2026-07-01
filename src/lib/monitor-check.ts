import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { diffCapabilities, hasDiff, type CapabilityDiff } from './diff'
import type { MCPTool, MCPResource, MCPPrompt } from './types'

export interface LiveCapabilities {
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
}

export async function fetchLiveCapabilities(serverUrl: string, transport = 'auto'): Promise<LiveCapabilities> {
  const client = new Client({ name: 'MCP Monitor', version: '1.0.0' }, { capabilities: {} })

  if (transport === 'auto') {
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(serverUrl)))
    } catch {
      await client.connect(new SSEClientTransport(new URL(serverUrl)))
    }
  } else {
    await client.connect(new SSEClientTransport(new URL(serverUrl)))
  }

  const [toolsRes, resourcesRes, promptsRes] = await Promise.allSettled([
    client.listTools(),
    client.listResources(),
    client.listPrompts(),
  ])

  try { await client.close() } catch {}

  return {
    tools:     toolsRes.status     === 'fulfilled' ? (toolsRes.value.tools     as MCPTool[])     : [],
    resources: resourcesRes.status === 'fulfilled' ? (resourcesRes.value.resources as MCPResource[]) : [],
    prompts:   promptsRes.status   === 'fulfilled' ? (promptsRes.value.prompts   as MCPPrompt[])   : [],
  }
}

export { diffCapabilities, hasDiff, type CapabilityDiff }

export async function sendAlertEmail(
  toEmail: string,
  sessionName: string,
  serverUrl: string,
  diff: CapabilityDiff,
) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log(`[monitor] Changes on ${sessionName} (${serverUrl}):`, JSON.stringify(diff))
    return
  }

  const lines: string[] = []
  const section = (title: string, d: typeof diff.tools) => {
    if (d.added.length)   lines.push(`<b>${title} added:</b> ${d.added.join(', ')}`)
    if (d.removed.length) lines.push(`<b>${title} removed:</b> ${d.removed.join(', ')}`)
    if (d.changed.length) lines.push(`<b>${title} schema changed:</b> ${d.changed.join(', ')}`)
  }
  section('Tools', diff.tools)
  section('Resources', diff.resources)
  section('Prompts', diff.prompts)

  const html = `
    <p>Your monitored MCP server <b>${sessionName}</b> (<code>${serverUrl}</code>) has changed.</p>
    <ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>
    <p>Log in to review the full diff.</p>
  `

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to: [toEmail], subject: `MCP change detected: ${sessionName}`, html }),
  })
  if (!res.ok) console.error('[monitor] Email send failed:', res.status)
}

export async function sendWebhook(webhookUrl: string, sessionName: string, serverUrl: string, diff: CapabilityDiff) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'mcp.changed', sessionName, serverUrl, diff, timestamp: new Date().toISOString() }),
    })
  } catch (err) {
    console.error('[monitor] Webhook failed:', err)
  }
}
