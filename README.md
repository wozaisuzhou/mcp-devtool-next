# flashman

A full-featured developer tool for MCP (Model Context Protocol) servers.

## Features

- **Inspector** — Connect to any MCP server, browse Tools/Resources/Prompts, call tools and inspect responses
- **Chat** — Use Claude to drive your MCP tools with natural language
- **Trace** — Full call history with duration waterfall, filtering, and JSON export
- **OAuth** — Step-by-step OAuth 2.0 + PKCE flow debugger

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to the Inspector.

### HTTPS Setup (Optional)

For secure HTTPS connections in development:

```bash
npm run setup:https    # Set up SSL certificates
npm run dev:https      # Run with HTTPS
```

For production deployment with HTTPS, see [HTTPS Setup Guide](docs/HTTPS_SETUP.md).

## Connecting to an MCP server

### HTTP / SSE (remote server)
```
https://your-server.com/mcp
```

### stdio (local process)
```
npx -y @modelcontextprotocol/server-everything
```
Set transport to `stdio` in the connection bar.

### With auth
Paste your Bearer token in the token field before connecting.

## Chat mode

Requires a Claude API key (`sk-ant-...`). Enter it in the banner at the top of the Chat tab.
The key is saved to `localStorage` — it never leaves your browser.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   └── proxy/
│   │       ├── connect/route.ts   ← Real MCP connection (solves CORS)
│   │       ├── call/route.ts      ← Tool call proxy
│   │       ├── resource/route.ts  ← Resource read proxy
│   │       └── disconnect/route.ts
│   └── (shell)/
│       ├── layout.tsx             ← Topbar + ConnectionBar
│       ├── inspector/page.tsx
│       ├── chat/page.tsx
│       ├── trace/page.tsx
│       └── oauth/page.tsx
├── components/
│   ├── ConnectionBar.tsx
│   └── inspector/
│       ├── Sidebar.tsx
│       └── DetailPane.tsx
├── store/index.ts                 ← Zustand global state
└── lib/types.ts                   ← Shared TypeScript types
```

## How the proxy works

The browser can't talk directly to MCP servers due to CORS.
Next.js API Routes act as a proxy — the frontend calls `/api/proxy/*`,
and the server-side route uses the MCP SDK to talk to the actual server.

```
Browser → /api/proxy/connect → MCP SDK → Your MCP Server
Browser → /api/proxy/call    → MCP SDK → Tool execution
```

## Environment variables

None required for basic use. Optional:

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_SERVER_URL=https://your-server.com/mcp
```

## Architecture

This is a single-user application with a shared MCP connection. All users connecting to the same deployment will share the same MCP server connection.

## Deployment

### Development with HTTPS

```bash
npm run setup:https    # Set up SSL certificates for development
npm run dev:https      # Run with HTTPS
```

### Production with Docker and HTTPS

```bash
# Set up SSL certificates
./scripts/setup-prod-ssl.sh

# Configure environment
cp .env.example .env.production
# Edit .env.production with your settings

# Deploy
docker-compose up -d --build
```

See [HTTPS Setup Guide](docs/HTTPS_SETUP.md) for detailed deployment instructions.

### Vercel (Simplest Option)

```bash
vercel
```

Vercel provides automatic HTTPS and SSL certificates.

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- `@modelcontextprotocol/sdk` (real MCP connection)
