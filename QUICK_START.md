# Quick Start Guide - MCP DevTool Installation

## 🎯 What Was Set Up

Your MCP DevTool now has **dual deployment options**:

### 1. **Electron Desktop App** (SQLite - Local Storage)
- Standalone desktop application
- All data stored locally in SQLite
- No server required
- Works offline

### 2. **Web App** (Next.js + PostgreSQL - Online Storage)
- Web-based version
- Remote PostgreSQL database
- Cloud deployment ready
- Share and collaborate

---

## ⚡ Quick Start

### **Option A: Run Electron App (Desktop)**

**macOS/Linux:**
```bash
# Install
bash scripts/install.sh

# Run development
npm run electron-dev
```

**Windows:**
```bash
scripts\install.bat
npm run electron-dev
```

This will:
- Start Next.js dev server on `http://localhost:3000`
- Launch Electron app with dev tools
- Automatically create SQLite database at `~/Library/Application Support/mcp-devtool/activities.db`

### **Option B: Run Web App**

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

---

## 📊 What Gets Stored

**Activity Type:**
- `tool_call` - MCP tool invocations
- `resource_read` - Resource access
- `connection` - Server connections
- `error` - Error events
- `chat` - Chat messages

**Data Tracked:**
```
✓ Timestamp (when)
✓ Tool/Resource name (what)
✓ Input/Output data (details)
✓ Status (success/error/timeout)
✓ Duration (performance)
✓ Session ID (grouping)
✓ Custom metadata
```

---

## 🗂️ Files Created

```
electron/
  ├── main.ts              # Electron main process with IPC handlers
  ├── db.ts                # SQLite database layer
  ├── preload.ts           # Secure IPC bridge
  └── tsconfig.json        # TypeScript config

src/
  ├── hooks/
  │   └── useActivityStorage.ts    # React hook for activities
  ├── components/
  │   └── ActivityViewer.tsx       # UI for viewing/exporting activities
  └── lib/
      └── types.ts                 # Updated types

migrations/
  └── 001_init_activities.sql      # PostgreSQL schema

scripts/
  ├── install.sh                   # macOS/Linux installer
  └── install.bat                  # Windows installer

ELECTRON_SETUP.md                   # Detailed documentation
QUICK_START.md                      # This file
```

---

## 💾 Using Activity Storage in Your Code

### **Record an Activity**

```typescript
import { useActivityStorage } from '@/hooks/useActivityStorage'

export function MyToolComponent() {
  const { addActivity } = useActivityStorage('my-user-id')

  const handleToolCall = async (toolName, input) => {
    const startTime = performance.now()
    
    try {
      const result = await callTool(toolName, input)
      const duration = performance.now() - startTime
      
      // Log the activity
      await addActivity({
        activityType: 'tool_call',
        serverId: 'production-server',
        toolName: toolName,
        input,
        output: result,
        status: 'success',
        durationMs: Math.round(duration),
      })
    } catch (error) {
      await addActivity({
        activityType: 'tool_call',
        serverId: 'production-server',
        toolName: toolName,
        input,
        error: error.message,
        status: 'error',
        durationMs: Math.round(performance.now() - startTime),
      })
    }
  }
}
```

### **Query Activities**

```typescript
const { getActivities } = useActivityStorage('my-user-id')

// Get all activities
const all = await getActivities()

// Get specific type
const toolCalls = await getActivities({
  activityType: 'tool_call',
})

// Get by date range
const recent = await getActivities({
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  limit: 100,
})
```

### **Export Data**

```typescript
const { exportActivities } = useActivityStorage()

// Export as JSON
const json = await exportActivities('json')
// Downloads activities.json

// Export as CSV
const csv = await exportActivities('csv')
// Downloads activities.csv
```

---

## 🔌 Integrate ActivityViewer Component

```typescript
// src/app/(shell)/activity/page.tsx
import { ActivityViewer } from '@/components/ActivityViewer'

export default function ActivityPage() {
  return <ActivityViewer />
}
```

Add to your shell layout navigation:
```tsx
<nav>
  <Link href="/activity">📊 Activities</Link>
</nav>
```

---

## 🚀 For Production

### **Electron App Distribution**

```bash
npm run electron-build
```

Creates installers for:
- `.dmg` (macOS)
- `.exe` / `.msi` (Windows)
- `.AppImage` / `.deb` (Linux)

### **Web App Deployment**

#### **With PostgreSQL:**

1. Set environment variable:
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/mcp_devtool"
```

2. Run migrations:
```bash
psql $DATABASE_URL < migrations/001_init_activities.sql
```

3. Deploy:
```bash
npm run build
npm start
```

---

## 🐛 Troubleshooting

**"sqlite3 module not found"**
```bash
npm rebuild better-sqlite3
```

**"Activity not saving"**
- Check console for errors: `npm run electron-dev` → F12
- Verify database file exists: `~/Library/Application Support/mcp-devtool/activities.db`
- Check IPC: `window.electronAPI` should be available

**"PostgreSQL connection failed"**
- Verify `DATABASE_URL` is set correctly
- Check database exists: `psql $DATABASE_URL -c "SELECT 1"`
- Run migrations: `psql $DATABASE_URL < migrations/001_init_activities.sql`

**"Port 3000 already in use"**
```bash
# Use different port
PORT=3001 npm run dev
```

---

## 📚 Next Steps

1. **Add Authentication**: Implement user login to track activities per user
2. **Dashboard**: Create analytics dashboard with activity stats
3. **Search**: Add full-text search for activities
4. **Notifications**: Send alerts for errors or important events
5. **Sync**: Add cloud sync between Electron and web versions

---

## 📖 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [better-sqlite3 Guide](https://github.com/WiseLibs/better-sqlite3)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**You're all set! 🎉**

Start with: `npm run electron-dev` or `npm run dev`
