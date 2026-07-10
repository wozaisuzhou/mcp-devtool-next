import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Chat Playground',
  description: 'Test multi-turn prompts against your MCP server exactly as Claude would use them — no wiring required.',
  alternates: { canonical: '/chat' },
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
