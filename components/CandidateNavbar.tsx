'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase, getFirstName } from '@/lib/supabase'
import CreditBalanceButton from '@/components/CreditBalanceButton'
import {
  Sparkles,
  LayoutDashboard,
  Mic,
  CalendarDays,
  Users,
  BookOpen,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
  CreditCard,
  CalendarCheck,
} from 'lucide-react'

type UnreadCounts = { messages: number; notifications: number }

export default function CandidateNavbar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [counts, setCounts] = useState<UnreadCounts>({ messages: 0, notifications: 0 })
  const [notifications, setNotifications] = useState<any[]>([])
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const displayName = getFirstName(profile?.full_name, user?.email)

  useEffect(() => {
    if (!user) return
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchCounts()
    const channel = supabase
      .channel(`candidate-notif-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchCounts())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const fetchCounts = async () => {
    if (!user) return
    try {
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      const unread = (notifData || []).filter((n: any) => !n.read).length
      setCounts({ messages: 0, notifications: unread })
      setNotifications(notifData || [])
    } catch { /* ignore */ }
  }

  const markNotifRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    fetchCounts()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/simulation/setup', label: 'Simulations', icon: Mic },
    { href: '/calendar', label: 'Calendrier', icon: CalendarDays },
    { href: '/coaches', label: 'Coachs', icon: Users },
    { href: '/content', label: 'Contenu', icon: BookOpen },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  if (!user) return null

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md" style={{ background: 'rgba(10,15,30,0.95)' }}>
      <div className="container mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-7 h-7 text-purple-400" />
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Jurya
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <span className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(href) ? 'bg-purple-600/20 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right: credits + notifications + profile */}
          <div className="hidden md:flex items-center gap-2">
            <CreditBalanceButton />

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:border-purple-500/40 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {counts.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-purple-600 text-[10px] font-bold flex items-center justify-center px-1">
                    {counts.notifications}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50" style={{ background: '#111827' }}>
                  <div className="px-4 py-3 border-b border-white/10 font-semibold text-sm">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">Aucune notification</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                      {notifications.map((n: any) => (
                        <button key={n.id} onClick={() => markNotifRead(n.id)} className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${!n.read ? 'bg-purple-500/5' : ''}`}>
                          <p className="text-sm font-semibold text-white">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-purple-500/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold uppercase">
                  {displayName.charAt(0)}
                </div>
                <span className="max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50" style={{ background: '#111827' }}>
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/profile" onClick={() => setProfileOpen(false)}>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                        <User className="w-4 h-4" /> Mon profil
                      </button>
                    </Link>
                    <Link href="/credits" onClick={() => setProfileOpen(false)}>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                        <CreditCard className="w-4 h-4" /> Mes crédits
                      </button>
                    </Link>
                    <Link href="/bookings" onClick={() => setProfileOpen(false)}>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                        <CalendarCheck className="w-4 h-4" /> Mes réservations
                      </button>
                    </Link>
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button
                        onClick={() => { setProfileOpen(false); signOut() }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg border border-white/10 bg-white/5 text-gray-300"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-2 border-t border-white/10 pt-4 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                <span className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive(href) ? 'bg-purple-600/20 text-purple-300' : 'text-gray-300 hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" />{label}
                </span>
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2 space-y-1">
              <Link href="/profile" onClick={() => setMenuOpen(false)}>
                <span className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5">
                  <User className="w-4 h-4" /> Mon profil
                </span>
              </Link>
              <Link href="/credits" onClick={() => setMenuOpen(false)}>
                <span className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5">
                  <CreditCard className="w-4 h-4" /> Mes crédits
                </span>
              </Link>
              <Link href="/bookings" onClick={() => setMenuOpen(false)}>
                <span className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5">
                  <CalendarCheck className="w-4 h-4" /> Mes réservations
                </span>
              </Link>
              <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
