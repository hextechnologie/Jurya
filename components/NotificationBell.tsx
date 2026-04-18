'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'
import { format } from 'date-fns'

type NotifItem = {
  id: string
  title: string
  message: string
  read: boolean
  time: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotifItem[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) loadNotifications()
  }, [user])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifications = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('bookings')
        .select('id, scheduled_at, status, coach:profiles!bookings_coach_id_fkey(full_name, email)')
        .eq('candidate_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .order('scheduled_at', { ascending: true })
        .limit(5)

      const notifs: NotifItem[] = ((data || []) as any[]).map((b) => {
        const coachName = b.coach?.full_name || b.coach?.email || 'Your coach'
        const when = b.scheduled_at ? format(new Date(b.scheduled_at), "MMM d 'at' HH:mm") : 'soon'
        return {
          id: b.id,
          title: `Session with ${coachName}`,
          message: `Scheduled ${when}`,
          read: false,
          time: b.scheduled_at ? format(new Date(b.scheduled_at), 'MMM d') : '',
        }
      })
      setItems(notifs)
    } catch {
      setItems([])
    }
  }

  const unreadCount = items.filter((i) => !i.read).length

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-white/10 bg-white/5 p-2 text-gray-200 hover:border-purple-500/40 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-purple-600 px-1.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: '#111827' }}
        >
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, read: true })))}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              No new notifications 🎉
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, read: true } : i))}
                  className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${!item.read ? 'border-l-2 border-purple-500 bg-purple-500/5' : ''}`}
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.message}</p>
                  {item.time && <p className="text-[11px] text-gray-500 mt-1">{item.time}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}