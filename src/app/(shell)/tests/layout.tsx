import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Test Suites',
  description: 'Build automated regression test suites for your MCP tools — define inputs, assert outputs, and run them locally or in CI/CD.',
  alternates: { canonical: '/tests' },
}

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
