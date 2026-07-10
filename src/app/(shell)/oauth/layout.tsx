import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP OAuth Tester',
  description: 'Test OAuth 2.1 PKCE flows against any MCP provider and inspect tokens, scopes, and callback parameters at each step.',
  alternates: { canonical: '/oauth' },
}

export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
