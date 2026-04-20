'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      setProfile(data)
    } else if (error) {
      console.error('❌ Profile fetch error:', error)
    } else {
      // No profile row exists — create a minimal one (new user, trigger may not have fired)
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          subscription_tier: 'free',
          interviews_limit: 30,
          interviews_used_this_month: 0,
        })
        .select('*')
        .single()
      if (created) {
        setProfile(created)
      } else {
        console.warn('Could not create profile:', createErr?.message)
      }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    const userId = data.user?.id

    if (userId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single()

      router.push(userProfile?.user_type === 'coach' ? '/coach/dashboard' : '/dashboard')
      return
    }

    router.push('/dashboard')
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', data.user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // Force full page reload to clear all state
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
