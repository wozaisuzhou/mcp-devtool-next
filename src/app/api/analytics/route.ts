import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import type { TraceEvent } from '@/lib/types'

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)]
}

function statsForTool(durations: number[], errors: number) {
  const sorted = [...durations].sort((a, b) => a - b)
  const calls  = durations.length + errors
  return {
    calls,
    errors,
    errorRate: calls ? Math.round((errors / calls) * 1000) / 10 : 0,
    p50:  pct(sorted, 50),
    p95:  pct(sorted, 95),
    p99:  pct(sorted, 99),
    avg:  sorted.length ? Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length) : 0,
  }
}

interface ToolAgg {
  durations: number[]
  errors: number
}

function aggregateTraces(traces: TraceEvent[]) {
  const byTool = new Map<string, ToolAgg>()
  for (const t of traces) {
    if (!t.tool) continue
    const agg = byTool.get(t.tool) ?? { durations: [], errors: 0 }
    if (t.status === 'success') agg.durations.push(t.durationMs)
    else agg.errors++
    byTool.set(t.tool, agg)
  }
  return Array.from(byTool.entries())
    .map(([name, agg]) => ({ name, ...statsForTool(agg.durations, agg.errors) }))
    .sort((a, b) => b.p99 - a.p99)
}

// GET /api/analytics?userEmail=...&sessionIds=id1,id2
export async function GET(req: NextRequest) {
  const userEmail  = req.nextUrl.searchParams.get('userEmail')?.trim()
  const sessionIds = req.nextUrl.searchParams.get('sessionIds')?.split(',').filter(Boolean)
  const compareA   = req.nextUrl.searchParams.get('compareA')?.trim()
  const compareB   = req.nextUrl.searchParams.get('compareB')?.trim()

  if (!userEmail) return NextResponse.json({ error: 'userEmail required' }, { status: 400 })

  // Regression mode: compare two specific sessions
  if (compareA && compareB) {
    const { data } = await db
      .from('saved_sessions')
      .select('id, name, traces')
      .in('id', [compareA, compareB])
      .eq('user_email', userEmail)

    const find = (id: string) => (data ?? []).find((s: any) => s.id === id)
    const sA = find(compareA)
    const sB = find(compareB)
    return NextResponse.json({
      sessionA: sA ? { id: sA.id, name: sA.name, tools: aggregateTraces(sA.traces ?? []) } : null,
      sessionB: sB ? { id: sB.id, name: sB.name, tools: aggregateTraces(sB.traces ?? []) } : null,
    })
  }

  // Overview: aggregate across selected (or all) sessions
  let query = db
    .from('saved_sessions')
    .select('id, name, saved_at, trace_count, traces')
    .eq('user_email', userEmail)
    .order('saved_at', { ascending: false })
    .limit(50)

  if (sessionIds?.length) query = query.in('id', sessionIds)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  const sessions = (data ?? []).map((s: any) => ({
    id: s.id, name: s.name, savedAt: s.saved_at, traceCount: s.trace_count ?? 0,
  }))

  const allTraces: TraceEvent[] = (data ?? []).flatMap((s: any) => s.traces ?? [])
  const tools = aggregateTraces(allTraces)
  const totalCalls  = tools.reduce((s, t) => s + t.calls, 0)
  const totalErrors = tools.reduce((s, t) => s + t.errors, 0)

  return NextResponse.json({
    sessions,
    tools,
    totals: {
      calls: totalCalls,
      errors: totalErrors,
      errorRate: totalCalls ? Math.round((totalErrors / totalCalls) * 1000) / 10 : 0,
      p99: tools.length ? Math.max(...tools.map(t => t.p99)) : 0,
    },
  })
}
