'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'flashman_user'

export interface RegisteredUser {
  email: string
  name?: string
}

export function useRegisteredUser() {
  const [user, setUser] = useState<RegisteredUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
    setReady(true)
  }, [])

  function saveUser(u: RegisteredUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return { user, ready, saveUser, clearUser }
}
