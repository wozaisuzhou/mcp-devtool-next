import { useCallback } from 'react'
import type { UserActivity, ActivityFilter } from '@/lib/types'

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI

export function useActivityStorage(userId: string = 'default-user') {
  const addActivity = useCallback(
    async (activity: Omit<UserActivity, 'id' | 'userId' | 'timestamp'>) => {
      if (!isElectron) {
        console.log('[Web Mode] Activity:', activity)
        return null
      }

      const fullActivity: UserActivity = {
        ...activity,
        id: crypto.randomUUID(),
        userId,
        timestamp: new Date().toISOString(),
      }

      try {
        return await (window as any).electronAPI.activity.add(fullActivity)
      } catch (err) {
        console.error('Failed to add activity:', err)
        return null
      }
    },
    [userId]
  )

  const getActivities = useCallback(
    async (filters?: ActivityFilter) => {
      if (!isElectron) {
        console.log('[Web Mode] Getting activities with filters:', filters)
        return []
      }

      try {
        return await (window as any).electronAPI.activity.getAll({
          userId,
          ...filters,
        })
      } catch (err) {
        console.error('Failed to get activities:', err)
        return []
      }
    },
    [userId]
  )

  const deleteActivity = useCallback(async (id: string) => {
    if (!isElectron) {
      console.log('[Web Mode] Deleting activity:', id)
      return false
    }

    try {
      return await (window as any).electronAPI.activity.delete(id)
    } catch (err) {
      console.error('Failed to delete activity:', err)
      return false
    }
  }, [])

  const exportActivities = useCallback(
    async (format: 'json' | 'csv' = 'json') => {
      if (!isElectron) {
        console.log('[Web Mode] Exporting activities as', format)
        return null
      }

      try {
        return await (window as any).electronAPI.activity.export(format)
      } catch (err) {
        console.error('Failed to export activities:', err)
        return null
      }
    },
    []
  )

  return {
    addActivity,
    getActivities,
    deleteActivity,
    exportActivities,
    isElectronApp: isElectron,
  }
}
