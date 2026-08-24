import { createContext, useContext, useEffect, useState } from 'react'

import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {

    if (!supabase) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function loadSession() {

      const { data: { session: currentSession } } =
        await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    }

    loadSession()

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        (_event, currentSession) => {

          if (!isMounted) {
            return
          }

          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          setLoading(false)
        }
      )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])


  async function signIn({ email, password }) {

    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    setSession(data.session)
    setUser(data.user)

    return data
  }


  async function signOut() {

    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    setSession(null)
    setUser(null)
  }


  const value = {
    session,
    user,
    loading,
    authError,
    setAuthError,
    signIn,
    signOut,
    isConfigured: isSupabaseConfigured,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
