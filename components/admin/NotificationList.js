'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const typeIcons = {
  order_paid: '💰',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationList({ notifications: initial }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initial)
  const [busy, setBusy] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markRead = async (ids) => {
    const prev = notifications
    setNotifications(list => list.map(n => (!ids || ids.includes(n.id)) ? { ...n, is_read: true } : n))
    setBusy(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { ids } : {}),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setNotifications(prev)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}</p>
        {unreadCount > 0 && (
          <button
            onClick={() => markRead(null)}
            disabled={busy}
            className="text-xs font-semibold text-[#0ea5a0] hover:text-[#0d7a8a] disabled:opacity-50"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Belum ada notifikasi</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead([n.id])}
                className={`w-full text-left px-5 py-4 flex items-start gap-3 transition-colors hover:bg-gray-50/50 ${!n.is_read ? 'bg-emerald-50/40' : ''}`}
              >
                <span className="text-lg shrink-0">{typeIcons[n.type] || '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#0ea5a0] shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
