import { app, BrowserWindow, ipcMain, shell, utilityProcess } from 'electron'
import type { UtilityProcess } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as net from 'net'
import { execSync } from 'child_process'
import { connectStdio, callStdioTool, callStdioResource, disconnectStdio, disconnectAll } from './mcp-stdio.js'

const isProd = app.isPackaged

// ── Fix PATH (macOS/Linux desktop launch loses shell PATH) ────────────────────
function fixPath() {
  if (process.platform === 'win32') return
  try {
    const sh  = process.env.SHELL || '/bin/zsh'
    const out = execSync(`${sh} -l -c 'echo $PATH'`, { timeout: 3000 }).toString()
    const p   = out.trim().split('\n').pop() ?? ''
    if (p) process.env.PATH = p
  } catch {}
}
fixPath()

// ── Embedded Next.js server (production only) ─────────────────────────────────

let nextServer: UtilityProcess | null = null
let serverPort  = 3000

function findFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as net.AddressInfo).port
      srv.close(() => resolve(port))
    })
  })
}

function waitForPort(port: number, timeout = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout
    function attempt() {
      const sock = net.createConnection(port, '127.0.0.1')
      sock.once('connect', () => { sock.destroy(); resolve() })
      sock.once('error', () => {
        sock.destroy()
        if (Date.now() > deadline) { reject(new Error('Server did not start in time')) }
        else setTimeout(attempt, 150)
      })
    }
    attempt()
  })
}

async function startNextServer(): Promise<void> {
  serverPort = await findFreePort()
  const serverScript = path.join(__dirname, '../.next/standalone/server.js')

  // utilityProcess.fork() runs a Node.js script inside Electron with no visible
  // window — unlike spawn(process.execPath) which opens a second Electron instance.
  nextServer = utilityProcess.fork(serverScript, [], {
    env: {
      ...process.env,
      PORT: String(serverPort),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  })

  await waitForPort(serverPort)
}

// ── Window state ──────────────────────────────────────────────────────────────

interface WindowBounds { x?: number; y?: number; width: number; height: number }

function statePath() {
  return path.join(app.getPath('userData'), 'window-state.json')
}

function loadWindowState(): WindowBounds {
  try { return JSON.parse(fs.readFileSync(statePath(), 'utf8')) }
  catch { return { width: 1100, height: 720 } }
}

function saveWindowState(win: BrowserWindow) {
  if (win.isMaximized() || win.isMinimized()) return
  fs.writeFileSync(statePath(), JSON.stringify(win.getBounds()))
}

// ── Auto-updater ──────────────────────────────────────────────────────────────

function setupUpdater() {
  if (!isProd) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { autoUpdater } = require('electron-updater')
    autoUpdater.checkForUpdatesAndNotify()
  } catch {}
}

// ── Create window ─────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null

function createWindow(port: number) {
  const bounds = loadWindowState()

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth:  800,
    minHeight: 560,
    title:     'Bubble MCP',
    titleBarStyle:        process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 14 } : undefined,
    show: true,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-fail-load', (_, code, desc) => {
    console.error(`[Bubble MCP] load failed: ${code} ${desc}`)
  })

  mainWindow.loadURL(`http://127.0.0.1:${port}/inspector`)

  mainWindow.on('close',  () => { if (mainWindow) saveWindowState(mainWindow) })
  mainWindow.on('closed', () => { mainWindow = null })
}

// ── IPC: MCP stdio ────────────────────────────────────────────────────────────

function registerIpc() {
  ipcMain.handle('mcp:connect', (_, { tabId, command }: { tabId: string; command: string }) =>
    connectStdio(tabId, command)
  )
  ipcMain.handle('mcp:callTool', (_, { tabId, toolName, input }: { tabId: string; toolName: string; input: Record<string, unknown> }) =>
    callStdioTool(tabId, toolName, input)
  )
  ipcMain.handle('mcp:callResource', (_, { tabId, uri }: { tabId: string; uri: string }) =>
    callStdioResource(tabId, uri)
  )
  ipcMain.handle('mcp:disconnect', (_, { tabId }: { tabId: string }) =>
    disconnectStdio(tabId)
  )
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  registerIpc()
  setupUpdater()

  if (isProd) {
    await startNextServer()
  }

  createWindow(isProd ? serverPort : 3000)
})

app.on('before-quit', () => {
  disconnectAll()
  nextServer?.kill()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow(isProd ? serverPort : 3000)
})
