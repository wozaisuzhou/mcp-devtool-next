import { lookup } from 'dns/promises'

function isPrivateOrReservedIp(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const a = Number(v4[1])
    const b = Number(v4[2])
    if (a === 0) return true                       // "this network"
    if (a === 10) return true                       // private
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a === 127) return true                       // loopback
    if (a === 169 && b === 254) return true           // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true   // private
    if (a === 192 && b === 168) return true            // private
    if (a >= 224) return true                          // multicast + reserved
    return false
  }

  const lower = ip.toLowerCase()
  if (lower === '::1') return true                    // loopback
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique local fc00::/7
  if (lower.startsWith('fe80')) return true            // link-local
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice('::ffff:'.length)
    if (mapped) return isPrivateOrReservedIp(mapped)
  }
  return false
}

/**
 * Blocks the server from being used as an SSRF relay into internal/private
 * infrastructure. Skipped when running inside Electron: there the request
 * originates from the user's own machine, so "localhost" is a legitimate
 * target (their own local MCP server), not a shared-infra boundary.
 */
export async function assertPublicMcpUrl(rawUrl: string): Promise<void> {
  if (process.versions.electron) return

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('Invalid URL')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs are allowed')
  }

  const hostname = parsed.hostname
  if (hostname === 'localhost' || hostname === '0.0.0.0') {
    throw new Error('Connections to local/internal addresses are not allowed')
  }

  let address: string
  try {
    address = (await lookup(hostname)).address
  } catch {
    throw new Error('Could not resolve host')
  }

  if (isPrivateOrReservedIp(address)) {
    throw new Error('Connections to local/internal addresses are not allowed')
  }
}
