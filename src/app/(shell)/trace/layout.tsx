import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Trace Viewer',
  description: 'Full JSON-RPC request/response log for your MCP server, captured in real time with diff support to spot exactly what changed.',
  alternates: { canonical: '/trace' },
}

export default function TraceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
