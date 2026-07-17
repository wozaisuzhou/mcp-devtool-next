// src/app/api/proxy/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { getMcpClient, setMcpClient } from '../client'
import { assertPublicMcpUrl } from '../ssrf-guard'

function buildAuthorizationHeader(url: string, authToken: string) {
  const trimmed = authToken.trim()
  if (!trimmed) return undefined
  if (/^(bearer|token)\s+/i.test(trimmed)) return trimmed

  if (url.includes('githubcopilot.com')) {
    // GitHub Copilot accepts GitHub tokens as Bearer authorization by default.
    return `Bearer ${trimmed}`
  }

  return `Bearer ${trimmed}`
}

export async function POST(req: NextRequest) {
  const { url, transport, authToken } = await req.json() as {
    url: string
    transport: 'http-sse' | 'stdio' | 'auto'
    authToken?: string
  }

  if (transport === 'stdio') {
    // stdio connections spawn a local process and are only ever initiated from the
    // Electron desktop app, over IPC (see electron/mcp-stdio.ts) — never over HTTP.
    return NextResponse.json({ error: 'stdio transport is not supported over this endpoint' }, { status: 400 })
  }

  const normalizedAuthToken = authToken?.trim()

  // Clean up any existing connection
  const existing = getMcpClient()
  if (existing) {
    try { await existing.close() } catch {}
    setMcpClient(null)
  }

  try {
    await assertPublicMcpUrl(url)

    console.log(`[MCP Connect] Attempting to connect to: ${url} via ${transport}`)
    console.log(`[MCP Connect] Auth token provided: ${!!authToken}`)

    const client = new Client(
      { name: 'Bubble MCP', version: '0.1.0' },
      { capabilities: { tools: {}, resources: {}, prompts: {} } as Record<string, unknown> }
    )

    let mcpTransport
    let clientAlreadyConnected = false

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }

    if (normalizedAuthToken) {
      const authHeader = buildAuthorizationHeader(url, normalizedAuthToken)
      if (authHeader) {
        headers['Authorization'] = authHeader
        if (url.includes('githubcopilot.com')) {
          console.log(`[MCP Connect] Using GitHub Copilot auth header: ${authHeader.split(' ')[0]}`)
        } else {
          console.log(`[MCP Connect] Using standard Bearer token authentication`)
        }
      }
    }

    console.log(`[MCP Connect] Request headers:`, Object.keys(headers))

    if (transport === 'auto') {
      // Try StreamableHTTP first, fall back to SSE
      console.log(`[MCP Connect] Trying StreamableHTTP transport first...`)
      try {
        const streamableTransport = new StreamableHTTPClientTransport(new URL(url), {
          requestInit: { headers }
        })
        await client.connect(streamableTransport)
        mcpTransport = streamableTransport
        clientAlreadyConnected = true
        console.log(`[MCP Connect] Successfully connected with StreamableHTTP transport`)
      } catch (streamableError) {
        console.log(`[MCP Connect] StreamableHTTP failed: ${streamableError instanceof Error ? streamableError.message : 'Unknown error'}`)
        console.log(`[MCP Connect] Falling back to SSE transport...`)

        try {
          const sseTransport = new SSEClientTransport(new URL(url), {
            requestInit: { headers }
          })
          await client.connect(sseTransport)
          mcpTransport = sseTransport
          clientAlreadyConnected = true
          console.log(`[MCP Connect] Successfully connected with SSE transport`)
        } catch (sseError) {
          console.error(`[MCP Connect] Both transport methods failed`)
          throw sseError
        }
      }
    } else {
      // Use specified transport (http-sse)
      console.log(`[MCP Connect] Creating SSE transport to: ${url}`)
      try {
        mcpTransport = new SSEClientTransport(new URL(url), {
          requestInit: { headers }
        })
      } catch (urlError) {
        console.error(`[MCP Connect] Invalid URL: ${url}`, urlError)
        throw new Error(`Invalid URL format: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`)
      }
    }

    if (!clientAlreadyConnected) {
      console.log(`[MCP Connect] Attempting to connect client...`)
      await client.connect(mcpTransport)
    }

    setMcpClient(client)
    console.log(`[MCP Connect] Client connected successfully`)

    // Fetch all capabilities in parallel
    console.log(`[MCP Connect] Fetching server capabilities...`)
    const [toolsRes, resourcesRes, promptsRes] = await Promise.allSettled([
      client.listTools(),
      client.listResources(),
      client.listPrompts(),
    ])

    console.log(`[MCP Connect] Tools result: ${toolsRes.status}`)
    console.log(`[MCP Connect] Resources result: ${resourcesRes.status}`)
    console.log(`[MCP Connect] Prompts result: ${promptsRes.status}`)

    if (toolsRes.status === 'rejected') {
      console.error(`[MCP Connect] Tools fetch failed:`, toolsRes.reason)
    }
    if (resourcesRes.status === 'rejected') {
      console.error(`[MCP Connect] Resources fetch failed:`, resourcesRes.reason)
    }
    if (promptsRes.status === 'rejected') {
      console.error(`[MCP Connect] Prompts fetch failed:`, promptsRes.reason)
    }

    const serverInfo = client.getServerVersion() ?? { name: 'unknown', version: '0.0.0' }
    console.log(`[MCP Connect] Server info:`, serverInfo)

    return NextResponse.json({
      serverInfo: {
        name: serverInfo.name,
        version: serverInfo.version,
        protocolVersion: '2025-11-25',
      },
      tools: toolsRes.status === 'fulfilled' ? toolsRes.value.tools : [],
      resources: resourcesRes.status === 'fulfilled' ? resourcesRes.value.resources : [],
      prompts: promptsRes.status === 'fulfilled' ? promptsRes.value.prompts : [],
    })
  } catch (err: unknown) {
    console.error(`[MCP Connect] Connection error:`, err)
    let msg = err instanceof Error ? err.message : 'Connection failed'
    
    // Provide specific guidance for GitHub Copilot
    if (url.includes('githubcopilot.com')) {
      if (!authToken) {
        msg = 'GitHub Copilot requires authentication. Please provide a GitHub Personal Access Token.'
      } else if (msg.includes('405') || msg.includes('Method Not Allowed')) {
        msg = 'GitHub Copilot connection failed. The server may require specific authentication or connection parameters. Please ensure you have a valid GitHub token with appropriate scopes.'
      } else if (msg.includes('401') || msg.includes('Unauthorized')) {
        msg = 'Authentication failed for GitHub Copilot. Please check that your GitHub token is valid and has the required scopes (repo, read:org, etc.).'
      }
    }
    
    // Provide more detailed error information
    const errorDetails = {
      message: msg,
      url,
      transport,
      hasAuthToken: !!authToken,
      timestamp: new Date().toISOString()
    }
    
    console.error(`[MCP Connect] Error details:`, errorDetails)
    return NextResponse.json({ error: msg, details: errorDetails }, { status: 500 })
  }
}

