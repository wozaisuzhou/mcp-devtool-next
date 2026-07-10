export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('http'))
  ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  : 'https://bubblemcp.com'

export const SITE_NAME = 'Bubble MCP'

export const SITE_DESCRIPTION =
  'Debug, test, and monitor Model Context Protocol (MCP) servers. Inspect every tool, resource, and prompt live, ' +
  'trace JSON-RPC calls, build regression test suites, run them in CI/CD, and share sessions with your team — free to start.'
