import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Performance Analytics',
  description: 'p50 / p95 / p99 latency per tool across saved MCP sessions, with side-by-side regression comparison.',
  alternates: { canonical: '/analytics' },
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
