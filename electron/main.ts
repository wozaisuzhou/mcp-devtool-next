import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
// runtime dev check (avoid ESM-only electron-is-dev in CommonJS/Electron builds)
const isDev = process.env.NODE_ENV !== 'production' || (process as any).defaultApp
import { initializeDatabase, addActivity, getActivities, deleteActivity } from './db'

let mainWindow: BrowserWindow | null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', async () => {
  await initializeDatabase()
  createWindow()

  // ── IPC Handlers ───────────────────────────────────────────
  ipcMain.handle('activity:add', async (_, activity) => {
    return await addActivity(activity)
  })

  ipcMain.handle('activity:getAll', async (_, filters) => {
    return await getActivities(filters)
  })

  ipcMain.handle('activity:delete', async (_, id) => {
    return await deleteActivity(id)
  })

  ipcMain.handle('activity:export', async (_, format: 'json' | 'csv') => {
    const activities = await getActivities()
    
    if (format === 'json') {
      return JSON.stringify(activities, null, 2)
    }
    
    if (format === 'csv' && activities.length > 0) {
      const headers = Object.keys(activities[0]).join(',')
      const rows = activities.map((a: any) =>
        Object.values(a).map((v) =>
          typeof v === 'string' && v.includes(',') ? `"${v}"` : v
        ).join(',')
      )
      return [headers, ...rows].join('\n')
    }
    
    return null
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
