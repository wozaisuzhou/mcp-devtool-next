// src/lib/types.ts

export type UserPlan = 'free' | 'silver' | 'gold' | 'enterprise'

export const PLAN_LIMITS: Record<Exclude<UserPlan, 'enterprise'>, { sessions: number; suites: number; casesPerSuite: number }> = {
  free:   { sessions: 10,  suites: 1,  casesPerSuite: 10 },
  silver: { sessions: 30,  suites: 10, casesPerSuite: 15 },
  gold:   { sessions: 100, suites: 30, casesPerSuite: 30 },
}

export const ENTERPRISE_DEFAULTS = { sessions: 1000, suites: 500, casesPerSuite: 500 }

export interface EnterpriseLimits {
  sessions: number
  suites: number
  casesPerSuite: number
}

export interface RegisteredUser {
  email: string
  name?: string
  plan?: UserPlan
  enterprise_limits?: EnterpriseLimits | null
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

export interface Team {
  id: string
  name: string
  ownerEmail: string
  inviteCode?: string  // only returned to the team owner
  createdAt: string
}

export interface TeamMember {
  userEmail: string
  role: 'owner' | 'member'
  joinedAt: string
}

export interface TeamJoinRequest {
  id: string
  userEmail: string
  requestedAt: string
}

export interface TeamWithMembers extends Team {
  members: TeamMember[]
  joinRequests?: TeamJoinRequest[]  // pending requests, only populated for owner
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
