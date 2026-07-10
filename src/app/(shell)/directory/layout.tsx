import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Server Directory',
  description: 'Browse and discover community MCP servers shared by other developers. Search by name, tool, or description.',
  alternates: { canonical: '/directory' },
}

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
