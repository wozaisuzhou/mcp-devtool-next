import { contextBridge, ipcRenderer } from 'electron'
import type { UserActivity, ActivityFilter } from '../src/lib/types'

contextBridge.exposeInMainWorld('electronAPI', {
  activity: {
    add: (activity: UserActivity) => ipcRenderer.invoke('activity:add', activity),
    getAll: (filters?: ActivityFilter) => ipcRenderer.invoke('activity:getAll', filters),
    delete: (id: string) => ipcRenderer.invoke('activity:delete', id),
    export: (format: 'json' | 'csv') => ipcRenderer.invoke('activity:export', format),
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
  },
  once: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (_, ...args) => callback(...args))
  },
})

declare global {
  interface Window {
    electronAPI: {
      activity: {
        add: (activity: UserActivity) => Promise<UserActivity>
        getAll: (filters?: ActivityFilter) => Promise<UserActivity[]>
        delete: (id: string) => Promise<boolean>
        export: (format: 'json' | 'csv') => Promise<string | null>
      }
      on: (channel: string, callback: (...args: any[]) => void) => void
      once: (channel: string, callback: (...args: any[]) => void) => void
    }
  }
}
