import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { TestCase, TestAssertion } from './types'

function assertResult(output: unknown, assertion: TestAssertion): 'pass' | 'fail' {
  if (assertion.type === 'none' || !assertion.expected) return 'pass'
  try {
    const expected = JSON.parse(assertion.expected)
    const actual = JSON.stringify(output)
    if (assertion.type === 'exact') return JSON.stringify(expected) === actual ? 'pass' : 'fail'
    if (assertion.type === 'contains') return actual.includes(JSON.stringify(expected).slice(1, -1)) ? 'pass' : 'fail'
  } catch { return 'fail' }
  return 'pass'
}

export interface CaseRunResult {
  caseId: string
  caseName: string
  toolName: string
  status: 'pass' | 'fail' | 'error'
  output?: unknown
  error?: string
  durationMs: number
}

export interface SuiteRunResult {
  passed: number
  failed: number
  errors: number
  total: number
  durationMs: number
  results: CaseRunResult[]
}

export async function runSuite(
  cases: TestCase[],
  serverUrl: string,
  transport: 'http-sse' | 'auto' = 'auto',
  authToken?: string,
): Promise<SuiteRunResult> {
  const client = new Client(
    { name: 'MCP CI Runner', version: '1.0.0' },
    { capabilities: {} }
  )

  const headers: Record<string, string> = {}
  if (authToken?.trim()) headers['Authorization'] = `Bearer ${authToken.trim()}`

  if (transport === 'auto') {
    try {
      const t = new StreamableHTTPClientTransport(new URL(serverUrl), { requestInit: { headers } })
      await client.connect(t)
    } catch {
      const t = new SSEClientTransport(new URL(serverUrl), { requestInit: { headers } })
      await client.connect(t)
    }
  } else {
    const t = new SSEClientTransport(new URL(serverUrl), { requestInit: { headers } })
    await client.connect(t)
  }

  const suiteStart = performance.now()
  const results: CaseRunResult[] = []

  for (const tc of cases) {
    if (!tc.toolName) continue

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(tc.input || '{}')
    } catch {
      results.push({ caseId: tc.id, caseName: tc.name, toolName: tc.toolName, status: 'error', error: 'Invalid JSON input', durationMs: 0 })
      continue
    }

    const start = performance.now()
    try {
      const res = await client.callTool({ name: tc.toolName, arguments: parsed })
      const durationMs = Math.round(performance.now() - start)
      const output = res.content
      const status = res.isError ? 'error' : assertResult(output, tc.assertion)
      results.push({ caseId: tc.id, caseName: tc.name, toolName: tc.toolName, status, output, durationMs })
    } catch (err) {
      const durationMs = Math.round(performance.now() - start)
      results.push({
        caseId: tc.id, caseName: tc.name, toolName: tc.toolName,
        status: 'error',
        error: err instanceof Error ? err.message : 'Tool call failed',
        durationMs,
      })
    }
  }

  try { await client.close() } catch {}

  const passed  = results.filter(r => r.status === 'pass').length
  const failed  = results.filter(r => r.status === 'fail').length
  const errors  = results.filter(r => r.status === 'error').length

  return {
    passed, failed, errors,
    total: results.length,
    durationMs: Math.round(performance.now() - suiteStart),
    results,
  }
}
