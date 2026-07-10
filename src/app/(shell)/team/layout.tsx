import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Team Collaboration for MCP Testing',
  description: 'Share MCP sessions and test suites across your team, with role-based access so the right people can connect or edit.',
  alternates: { canonical: '/team' },
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
