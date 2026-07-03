'use client'
import { useEffect } from 'react'

export function ElectronMacPatch() {
  useEffect(() => {
    const api = (window as any).electronAPI
    if (api?.isElectron && api?.platform === 'darwin') {
      document.body.classList.add('electron-mac')
    }
  }, [])
  return null
}
