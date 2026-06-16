# MCP DevTool - Installation & Setup Guide

This project supports both **web** and **Electron desktop** versions, with different storage backends:

- **Web Version**: Next.js app (PostgreSQL for online storage)
- **Electron Version**: Desktop app (SQLite for local storage)

---

## Web Version (Next.js)

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL (for production deployment)

### Installation

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build
npm start
```

Visit `http://localhost:3000`

---

## Electron Version (Desktop App)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Development (runs Next.js dev server + Electron)
npm run electron-dev

# Build standalone app
npm run electron-build
```

### How It Works

1. **SQLite Database**: Activities are stored locally at `~/<User Data>/activities.db`
   - Automatic schema creation on first run
   - Indexed for fast queries
   - WAL mode enabled for better concurrency

2. **IPC Communication**: React app ↔ Electron main process
   - Preload script provides secure API
   - No direct node access from renderer process
   - Type-safe with TypeScript

3. **Storage Location**:
   - **macOS**: `~/Library/Application Support/mcp-devtool/activities.db`
   - **Windows**: `%APPDATA%/mcp-devtool/activities.db`
   - **Linux**: `~/.config/mcp-devtool/activities.db`

### File Structure

```
electron/
├── main.ts          # Electron main process
├── preload.ts       # IPC preload script
├── db.ts            # SQLite database layer
└── tsconfig.json    # TypeScript config

src/
├── hooks/
│   └── useActivityStorage.ts  # React hook for activity management
├── components/
│   └── ActivityViewer.tsx     # UI component for viewing activities
└── lib/
    └── types.ts              # Updated with UserActivity & ActivityFilter
```

---

## Activity Storage

### Recording Activities

```typescript
import { useActivityStorage } from '@/hooks/useActivityStorage'

function MyComponent() {
  const { addActivity } = useActivityStorage('user-id')

  const handleToolCall = async (toolName, input) => {
    await addActivity({
      activityType: 'tool_call',
      serverId: 'server-1',
      toolName,
      input,
      status: 'success',
      durationMs: 150,
    })
  }
}
```

### Querying Activities

```typescript
const { getActivities } = useActivityStorage('user-id')

// Get all activities
const all = await getActivities()

// Filter by type and date range
const filtered = await getActivities({
  activityType: 'tool_call',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
})
```

### Exporting Data

```typescript
const { exportActivities } = useActivityStorage()

// Export as JSON
const json = await exportActivities('json')

// Export as CSV
const csv = await exportActivities('csv')

// Download automatically
```

---

## PostgreSQL Setup (Web/Online Version)

For the web version with remote storage:

```bash
# Create database
createdb mcp_devtool

# Run migrations (add your migration files)
psql mcp_devtool < migrations/init.sql
```

### API Endpoint Example

```typescript
// src/app/api/activities/log/route.ts
export async function POST(req: NextRequest) {
  const activity = await req.json()
  
  // Store to PostgreSQL
  const result = await db.activities.create({
    userId: activity.userId,
    timestamp: new Date(),
    activityType: activity.activityType,
    // ... other fields
  })
  
  return NextResponse.json({ success: true, id: result.id })
}
```

---

## Development Tips

### Running Tests

```bash
npm test
```

### Building Distribution

```bash
# Creates installers for your OS
npm run electron-build
```

### Debugging

**Electron Dev Tools**: Automatically open with `npm run electron-dev`

**SQLite Browser**: Use `better-sqlite3` CLI to inspect database:
```bash
npx better-sqlite3 ~/Library/Application\ Support/mcp-devtool/activities.db
```

---

## Troubleshooting

**Issue**: `sqlite3` module build fails
```bash
# Rebuild native modules
npm rebuild better-sqlite3
```

**Issue**: Activities not saving
- Check that `window.electronAPI` is available
- Verify database file exists at user data path
- Check Electron console for errors (`npm run electron-dev`)

**Issue**: TypeScript errors in Electron files
```bash
# Recompile TypeScript
npm run preelectron-dev
```

---

## Security Notes

✅ **IPC is secure**: 
- Preload script whitelists only specific API methods
- No direct `require()` access from renderer process
- Context isolation enabled

✅ **Database**:
- WAL mode for crash recovery
- Prepared statements prevent SQL injection
- Foreign keys enforced

---

## Next Steps

1. Add authentication/user context
2. Implement activity analytics dashboard
3. Setup PostgreSQL for web version
4. Add activity filtering & search UI
5. Implement data retention policies

