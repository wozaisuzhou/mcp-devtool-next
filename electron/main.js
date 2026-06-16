const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let nextServerProcess

function isDevelopment() {
  return process.env.NODE_ENV === 'development' || 
         process.argv.includes('--dev') || 
         !app.isPackaged
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Needed for local development
    },
    title: 'MCP DevTool',
    icon: path.join(__dirname, '../public/icon.png')
  })

  // Load the app
  if (isDevelopment()) {
    // In development, load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, start local Next.js server and load from it
    startNextServer()
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000')
    }, 2000) // Wait for server to start
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    if (nextServerProcess) {
      nextServerProcess.kill()
    }
  })
}

function startNextServer() {
  const serverPath = path.join(__dirname, '../node_modules/.bin/next')
  const appPath = path.join(__dirname, '..')
  
  console.log('Starting Next.js server from:', appPath)
  
  nextServerProcess = spawn('node', [serverPath, 'start'], {
    cwd: appPath,
    env: { ...process.env, PORT: '3000' }
  })

  nextServerProcess.stdout.on('data', (data) => {
    console.log('Next.js:', data.toString())
  })

  nextServerProcess.stderr.on('data', (data) => {
    console.error('Next.js error:', data.toString())
  })

  nextServerProcess.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`)
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextServerProcess) {
      nextServerProcess.kill()
    }
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('quit', () => {
  if (nextServerProcess) {
    nextServerProcess.kill()
  }
})

// Handle certificate errors for development (for self-signed HTTPS)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDevelopment()) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

// Allow navigation to external links
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', async (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    // Allow navigation to same domain or safe protocols
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      event.preventDefault()
      require('electron').shell.openExternal(navigationUrl)
    }
  })
})