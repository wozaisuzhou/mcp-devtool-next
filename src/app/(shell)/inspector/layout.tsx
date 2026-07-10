import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Inspector',
  description: 'Browse every tool, resource, and prompt your MCP server exposes, and call any of them live with a schema-aware JSON editor.',
  alternates: { canonical: '/inspector' },
}

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
