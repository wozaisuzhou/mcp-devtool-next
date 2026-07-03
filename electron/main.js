"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const net = __importStar(require("net"));
const child_process_1 = require("child_process");
const mcp_stdio_js_1 = require("./mcp-stdio.js");
const isProd = electron_1.app.isPackaged;
// ── Fix PATH (macOS/Linux desktop launch loses shell PATH) ────────────────────
function fixPath() {
    if (process.platform === 'win32')
        return;
    try {
        const sh = process.env.SHELL || '/bin/zsh';
        const out = (0, child_process_1.execSync)(`${sh} -l -c 'echo $PATH'`, { timeout: 3000 }).toString();
        const p = out.trim().split('\n').pop() ?? '';
        if (p)
            process.env.PATH = p;
    }
    catch { }
}
fixPath();
// ── Embedded Next.js server (production only) ─────────────────────────────────
let nextServer = null;
let serverPort = 3000;
function findFreePort() {
    return new Promise((resolve) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const port = srv.address().port;
            srv.close(() => resolve(port));
        });
    });
}
function waitForPort(port, timeout = 20000) {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeout;
        function attempt() {
            const sock = net.createConnection(port, '127.0.0.1');
            sock.once('connect', () => { sock.destroy(); resolve(); });
            sock.once('error', () => {
                sock.destroy();
                if (Date.now() > deadline) {
                    reject(new Error('Server did not start in time'));
                }
                else
                    setTimeout(attempt, 150);
            });
        }
        attempt();
    });
}
async function startNextServer() {
    serverPort = await findFreePort();
    const serverScript = path.join(__dirname, '../.next/standalone/server.js');
    // utilityProcess.fork() runs a Node.js script inside Electron with no visible
    // window — unlike spawn(process.execPath) which opens a second Electron instance.
    nextServer = electron_1.utilityProcess.fork(serverScript, [], {
        env: {
            ...process.env,
            PORT: String(serverPort),
            HOSTNAME: '127.0.0.1',
            NODE_ENV: 'production',
        },
        stdio: 'pipe',
    });
    await waitForPort(serverPort);
}
function statePath() {
    return path.join(electron_1.app.getPath('userData'), 'window-state.json');
}
function loadWindowState() {
    try {
        return JSON.parse(fs.readFileSync(statePath(), 'utf8'));
    }
    catch {
        return { width: 1100, height: 720 };
    }
}
function saveWindowState(win) {
    if (win.isMaximized() || win.isMinimized())
        return;
    fs.writeFileSync(statePath(), JSON.stringify(win.getBounds()));
}
// ── Auto-updater ──────────────────────────────────────────────────────────────
function setupUpdater() {
    if (!isProd)
        return;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { autoUpdater } = require('electron-updater');
        autoUpdater.checkForUpdatesAndNotify();
    }
    catch { }
}
// ── Create window ─────────────────────────────────────────────────────────────
let mainWindow = null;
function createWindow(port) {
    const bounds = loadWindowState();
    mainWindow = new electron_1.BrowserWindow({
        ...bounds,
        minWidth: 800,
        minHeight: 560,
        title: 'Bubble MCP',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 14 } : undefined,
        show: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    mainWindow.webContents.on('did-fail-load', (_, code, desc) => {
        console.error(`[Bubble MCP] load failed: ${code} ${desc}`);
    });
    mainWindow.loadURL(`http://127.0.0.1:${port}/inspector`);
    mainWindow.on('close', () => { if (mainWindow)
        saveWindowState(mainWindow); });
    mainWindow.on('closed', () => { mainWindow = null; });
}
// ── IPC: MCP stdio ────────────────────────────────────────────────────────────
function registerIpc() {
    electron_1.ipcMain.handle('mcp:connect', (_, { tabId, command }) => (0, mcp_stdio_js_1.connectStdio)(tabId, command));
    electron_1.ipcMain.handle('mcp:callTool', (_, { tabId, toolName, input }) => (0, mcp_stdio_js_1.callStdioTool)(tabId, toolName, input));
    electron_1.ipcMain.handle('mcp:callResource', (_, { tabId, uri }) => (0, mcp_stdio_js_1.callStdioResource)(tabId, uri));
    electron_1.ipcMain.handle('mcp:disconnect', (_, { tabId }) => (0, mcp_stdio_js_1.disconnectStdio)(tabId));
}
// ── App lifecycle ─────────────────────────────────────────────────────────────
electron_1.app.whenReady().then(async () => {
    registerIpc();
    setupUpdater();
    if (isProd) {
        await startNextServer();
    }
    createWindow(isProd ? serverPort : 3000);
});
electron_1.app.on('before-quit', () => {
    (0, mcp_stdio_js_1.disconnectAll)();
    nextServer?.kill();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (mainWindow === null)
        createWindow(isProd ? serverPort : 3000);
});
