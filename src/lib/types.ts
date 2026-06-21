// src/lib/types.ts

export type UserPlan = 'free' | 'paid'

export const PLAN_LIMITS = {
  free: { sessions: 10, suites: 1, casesPerSuite: 10 },
  paid: { sessions: 30, suites: 20, casesPerSuite: 50 },
} as const

export interface RegisteredUser {
  email: string
  name?: string
  plan?: UserPlan
}

export type EventStatus = 'success' | 'error' | 'timeout'
export type EventType = 'tool_call' | 'resource_read' | 'prompt_get' | 'error'
export type TransportType = 'http-sse' | 'stdio' | 'auto'

export interface ServerInfo {
  name: string
  version: string
  protocolVersion: string
}

export interface MCPTool {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPPrompt {
  name: string
  description?: string
  arguments?: Array<{ name: string; description?: string; required?: boolean }>
}

export interface TraceEvent {
  id: string
  tool: string
  type: EventType
  input: unknown
  output?: unknown
  error?: string
  status: EventStatus
  durationMs: number
  timestamp: string
  serverId: string
  source: 'inspector' | 'chat'
}

export interface ConnectionConfig {
  url: string
  transport: TransportType
  authToken?: string
}

export interface UserActivity {
  id: string
  userId: string
  timestamp: string
  activityType: 'tool_call' | 'resource_read' | 'connection' | 'error' | 'chat'
  serverId: string
  toolName?: string
  input?: Record<string, unknown>
  output?: unknown
  error?: string
  status?: 'success' | 'error' | 'timeout'
  durationMs?: number
  sessionId?: string
  metadata?: {
    ip?: string
    userAgent?: string
    userId?: string
  }
}

export interface ActivityFilter {
  userId?: string
  activityType?: string
  serverId?: string
  sessionId?: string
  startDate?: string
  endDate?: string
  limit?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | unknown[]
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: unknown
  error?: string
  durationMs: number
  status: EventStatus
}

export type TestAssertionType = 'none' | 'exact' | 'contains'

export interface TestAssertion {
  type: TestAssertionType
  expected?: string
}

export interface TestResult {
  status: 'pass' | 'fail' | 'error'
  output?: unknown
  error?: string
  durationMs: number
  timestamp: string
}

export interface TestCase {
  id: string
  name: string
  toolName: string
  input: string
  assertion: TestAssertion
  lastResult?: TestResult
}

export interface TestSuite {
  id: string
  name: string
  description?: string
  cases: TestCase[]
  createdAt: string
  updatedAt: string
}
