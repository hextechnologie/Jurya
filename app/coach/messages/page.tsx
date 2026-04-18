'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase, getFirstName } from '@/lib/supabase'
import CoachNavbar from '@/components/CoachNavbar'
import { Button, LoadingSpinner } from '@/components/ui'
import { Send, Paperclip } from 'lucide-react'
import { format } from 'date-fns'

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

type Conversation = {
  user_id: string
  full_name: string | null
  email: string
  last_message: string
  last_at: string
  unread: number
}

function MessagesContent() {
  const { user, profile } = useAuth()
  const searchParams = useSearchParams()
  const initialCandidate = searchParams.get('candidate')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(initialCandidate)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvos, setLoadingConvos] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* fetch conversations list */
  useEffect(() => {
    if (!user) return
    fetchConversations()
  }, [user])

  /* fetch messages when conversation selected */
  useEffect(() => {
    if (!selectedId || !user) return
    fetchMessages(selectedId)
    markRead(selectedId)
    // Realtime
    const channel = supabase.channel(`chat-${user.id}-${selectedId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message
        if ((msg.sender_id === selectedId && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === selectedId)) {
          setMessages((prev) => [...prev, msg])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedId, user])

  /* scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (!data) return

      // Derive unique conversation partners
      const partnerIds = [...new Set(data.map((m: any) =>
        m.sender_id === user.id ? m.receiver_id : m.sender_id
      ))]

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', partnerIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      const convos: Conversation[] = partnerIds.map((pid) => {
        const msgs = data.filter((m: any) => m.sender_id === pid || m.receiver_id === pid)
        const last = msgs[0]
        const p = profileMap.get(pid) || { full_name: null, email: pid }
        const unread = msgs.filter((m: any) => m.sender_id === pid && !m.read).length
        return { user_id: pid, full_name: p.full_name, email: p.email, last_message: last?.content || '', last_at: last?.created_at || '', unread }
      })

      setConversations(convos)
    } finally {
      setLoadingConvos(false)
    }
  }

  const fetchMessages = async (partnerId: string) => {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages((data || []) as Message[])
  }

  const markRead = async (partnerId: string) => {
    if (!user) return
    await supabase.from('messages').update({ read: true }).eq('sender_id', partnerId).eq('receiver_id', user.id)
    setConversations((prev) => prev.map((c) => c.user_id === partnerId ? { ...c, unread: 0 } : c))
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedId || !user) return
    setSending(true)
    const { data } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedId,
      content: newMsg.trim(),
      read: false,
    }).select().single()
    if (data) setMessages((prev) => [...prev, data as Message])
    setNewMsg('')
    setSending(false)
    fetchConversations()
  }

  const selectedConvo = conversations.find((c) => c.user_id === selectedId)

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/10 flex flex-col shrink-0" style={{ background: '#111827' }}>
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-lg">Messages</h2>
        </div>
        {loadingConvos ? (
          <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="sm" /></div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500 text-sm">
            No conversations yet.<br />Conversations appear when you or a candidate sends a message.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.user_id}
                onClick={() => setSelectedId(c.user_id)}
                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${selectedId === c.user_id ? 'bg-purple-600/10 border-l-2 border-l-purple-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                    {(c.full_name || c.email).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate">{c.full_name || c.email}</p>
                      {c.unread > 0 && <span className="bg-purple-600 text-xs rounded-full px-1.5 py-0.5 ml-1 shrink-0">{c.unread}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.last_message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      {selectedId ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3" style={{ background: '#111827' }}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold uppercase">
              {(selectedConvo?.full_name || selectedConvo?.email || 'C').charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm">{selectedConvo?.full_name || selectedConvo?.email}</p>
              <p className="text-xs text-gray-400">Candidate</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: '#0a0f1e' }}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-12">No messages yet. Say hello! 👋</div>
            )}
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white/10 text-gray-100 rounded-bl-sm'}`}>
                    <p className="leading-relaxed">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-purple-200' : 'text-gray-500'}`}>
                      {format(new Date(m.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10" style={{ background: '#111827' }}>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={() => { /* handle file upload */ }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:border-purple-500/40 hover:text-purple-400 transition-colors shrink-0"
                title="Attach file (CV, cover letter)"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/40 transition-colors"
              />
              <Button variant="primary" onClick={sendMessage} loading={sending} className="px-3 py-2.5 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm" style={{ background: '#0a0f1e' }}>
          Select a conversation to start messaging
        </div>
      )}
    </div>
  )
}

export default function CoachMessagesPage() {
  const { user, loading: authLoading } = useAuth()
  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}><LoadingSpinner size="lg" /></div>
  if (!user) return null
  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0f1e' }}>
      <CoachNavbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
        <MessagesContent />
      </Suspense>
    </div>
  )
}
