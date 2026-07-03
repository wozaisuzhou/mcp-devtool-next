"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    platform: process.platform,
    mcp: {
        connect: (tabId, command) => electron_1.ipcRenderer.invoke('mcp:connect', { tabId, command }),
        callTool: (tabId, toolName, input) => electron_1.ipcRenderer.invoke('mcp:callTool', { tabId, toolName, input }),
        callResource: (tabId, uri) => electron_1.ipcRenderer.invoke('mcp:callResource', { tabId, uri }),
        disconnect: (tabId) => electron_1.ipcRenderer.invoke('mcp:disconnect', { tabId }),
    },
});
