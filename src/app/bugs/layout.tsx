import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feedback & Bug Reports',
  description: 'Report a bug or share a feature idea for Bubble MCP. Bug bounty: get $50 for any bug report we accept.',
  alternates: { canonical: '/bugs' },
}

export default function BugsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
