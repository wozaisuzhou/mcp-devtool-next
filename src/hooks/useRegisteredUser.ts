'use client'
import { useEffect } from 'react'
import { useStore } from '@/store'
import type { RegisteredUser } from '@/lib/types'

export type { RegisteredUser }

export function useRegisteredUser() {
  const { user, userReady, initUser, saveUser, clearUser } = useStore()

  useEffect(() => {
    initUser()
  }, [initUser])

  return { user, ready: userReady, saveUser, clearUser }
}
