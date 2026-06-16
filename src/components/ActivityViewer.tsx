'use client'

import { useState, useEffect } from 'react'
import { useActivityStorage } from '@/hooks/useActivityStorage'
import type { UserActivity } from '@/lib/types'

export function ActivityViewer() {
  const { getActivities, deleteActivity, exportActivities } = useActivityStorage()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'tool_call' | 'resource_read' | 'connection' | 'error' | 'chat'>('all')

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    const data = await getActivities(
      filter !== 'all' ? { activityType: filter } : undefined
    )
    setActivities(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await deleteActivity(id)
    loadActivities()
  }

  const handleExport = async (format: 'json' | 'csv') => {
    const data = await exportActivities(format)
    if (data) {
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activities.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Activity Log</h2>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            >
              <option value="all">All Activities</option>
              <option value="tool_call">Tool Calls</option>
              <option value="resource_read">Resource Read</option>
              <option value="connection">Connections</option>
              <option value="error">Errors</option>
              <option value="chat">Chat</option>
            </select>
            <button
              onClick={loadActivities}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-auto">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No activities recorded yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Tool/Resource</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                      {activity.activityType}
                    </span>
                  </td>
                  <td className="px-4 py-2">{activity.toolName || '-'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        activity.status === 'success'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : activity.status === 'error'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {activity.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{activity.durationMs ? `${activity.durationMs}ms` : '-'}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-600 dark:text-gray-400">
        Total activities: {activities.length}
      </div>
    </div>
  )
}
