const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@modelcontextprotocol/sdk', 'ws'],
  },
  output: 'standalone',
}

module.exports = nextConfig
