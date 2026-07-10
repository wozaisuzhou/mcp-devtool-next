import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saved MCP Sessions',
  description: 'Save and share MCP server snapshots — tools, resources, prompts, and traces — with your team, no live connection required.',
  alternates: { canonical: '/sessions' },
}

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
