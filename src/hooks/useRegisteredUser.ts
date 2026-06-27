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

  // Silently refresh plan from DB so a plan change by an admin takes effect
  // without requiring the user to re-login.
  useEffect(() => {
    if (!userReady || !user?.email) return
    fetch(`/api/auth/me?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.plan !== user.plan) {
          saveUser({ ...user, plan: data.plan, name: data.name ?? user.name })
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userReady, user?.email])

  return { user, ready: userReady, saveUser, clearUser }
}
