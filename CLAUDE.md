# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run dev:https    # Start with HTTPS (localhost:3443)
npm run build        # Production build
npm run lint         # ESLint via next lint
npm run electron-dev # Run Electron + Next.js concurrently (desktop mode)
```

No test runner is configured. Type-check with `npx tsc --noEmit`.

## Environment

Copy `.env.example` to `.env.local`. Required for database features:
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — Supabase project credentials
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `NEXT_PUBLIC_APP_URL` — password reset emails (optional; falls back to console logging the reset URL)

## Architecture

### Deployment modes
The app runs as a **Next.js web app** or an **Electron desktop app** (wraps the same Next.js build). Electron entry is `electron/main.ts`; the compiled output is `main.js`.

### App structure (`src/`)
- `app/(shell)/` — All main pages share a shell layout (`layout.tsx`) that renders the topbar, `ConnectionBar`, `NavSidebar`, and modals. Routes: `inspector`, `sessions`, `tests`, `trace`, `chat`, `oauth`.
- `app/api/proxy/` — Server-side MCP proxy. Holds a **module-level singleton** MCP client (`client.ts`). All browser tool calls route through `/api/proxy/call`, `/api/proxy/resource`, etc.
- `app/api/auth/` — Email+bcrypt auth: signin, signup, change-password, forgot/reset password (via Supabase `registered_users` table).
- `app/api/sessions/` — CRUD for saved session snapshots in Supabase.
- `app/api/tests/suites/` — CRUD for test suites in Supabase.
- `components/` — UI components. `ConnectionBar` owns the tab bar and connect/disconnect flow. `inspector/` has the two-panel layout (sidebar + DetailPane).
- `store/index.ts` — Single Zustand store. All UI state lives here: tabs, connection state, chat messages, user auth.
- `lib/db.ts` — Lazy Supabase client singleton (server-side only).
- `lib/types.ts` — All shared TypeScript types.
- `lib/limits.ts` — Plan-gated limits (`free`/`paid`).

### MCP proxy singleton caveat
`src/app/api/proxy/client.ts` exports a module-level `mcpClient`. In Next.js dev mode this is per-process, but in multi-process production deployments each worker has its own client. The UI supports multiple **tabs** (tracked in Zustand), but the server only holds **one live MCP connection** at a time — connecting replaces any existing client.

### Tab state and `sessionLoaded`
Each Zustand tab has `connected`, `connecting`, and `sessionLoaded` flags.
- `sessionLoaded: true` means the tab is in **snapshot mode** (loaded from a saved session) — the tab shows a blue "snapshot" badge and tools/resources are browsable without a live connection. Inputs in `ConnectionBar` remain editable so the user can connect.
- `liveConnected = connected && !sessionLoaded` — used throughout to distinguish a real live connection from a snapshot. `setConnected()` always clears `sessionLoaded` to transition from snapshot → live.

### Auth flow
User is stored in `localStorage` via Zustand (`USER_STORAGE_KEY = 'flashman_user'`). The `useRegisteredUser` hook initializes from storage on mount. Auth is email+password (bcrypt); no JWT/session tokens — the client just holds the user object and passes `userEmail` as a query param to API routes. Plan (`free`/`paid`) is stored on the `registered_users` row.

### Database schema (Supabase/PostgreSQL)
Migrations in `migrations/` run in order:
- `registered_users` — email PK, name, plan (`free`/`paid`)
- `saved_sessions` — full MCP snapshot (tools/resources/prompts/traces as JSONB), owned by `user_email`
- `test_suites` — test cases stored as JSONB `cases` column, owned by `user_email`
- `password_reset_tokens`, `bug_reports` — supporting tables

### MCP tool call error handling
The MCP protocol distinguishes transport errors (exceptions → HTTP 500 from proxy) from tool-level errors (`result.isError = true` → HTTP 200 from proxy). The proxy sets `status: 'error'` in the JSON body for both cases. Client code must use `data.status` (not `res.ok`) to determine trace status, and must display `data.result` (not `data.error`) when `isError: true` since the error content is in the result body.
