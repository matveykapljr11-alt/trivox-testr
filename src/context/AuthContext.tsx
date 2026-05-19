import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { supabase, type User } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  isLoggedIn: boolean
  loading: boolean
  signInWithDiscord: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  completeRegistration: (nick: string, telegram: string, gameId: string) => Promise<void>
  needsProfile: boolean
  setNeedsProfile: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfile, setNeedsProfile] = useState(false)
  const sessionHandled = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    sessionHandled.current = false

    // 1. Subscribe to auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return
      console.log('Auth event:', event)

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session) {
          sessionHandled.current = true
          await handleSession(session)
        }
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        if (!user) {
          sessionHandled.current = true
          await handleSession(session)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setNeedsProfile(false)
        setLoading(false)
      }
    })

    // 2. Fallback #1 — 500ms
    const t1 = setTimeout(async () => {
      if (!mounted.current || sessionHandled.current) return
      console.log('Fallback #1 — checking session')
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !sessionHandled.current) {
        sessionHandled.current = true
        await handleSession(session)
      }
      setLoading(false)
    }, 500)

    // 3. Fallback #2 — 2000ms (for very slow mobile)
    const t2 = setTimeout(async () => {
      if (!mounted.current || sessionHandled.current) return
      console.log('Fallback #2 — checking session again')
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !sessionHandled.current) {
        sessionHandled.current = true
        await handleSession(session)
      }
      setLoading(false)
    }, 2000)

    // 4. Fallback #3 — 4000ms (last resort)
    const t3 = setTimeout(async () => {
      if (!mounted.current || sessionHandled.current) return
      console.log('Fallback #3 — final attempt')
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !sessionHandled.current) {
        sessionHandled.current = true
        await handleSession(session)
      }
      // Force stop loading
      setLoading(false)
    }, 4000)

    return () => {
      mounted.current = false
      subscription.unsubscribe()
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  async function handleSession(session: any) {
    const oauthUser = session?.user
    if (!oauthUser || !mounted.current) return

    const meta = oauthUser.user_metadata || {}
    const name = meta.full_name || meta.name || meta.user_name || oauthUser.email?.split('@')[0] || 'Player'
    const avatarText = name.slice(0, 2).toUpperCase()
    const avatarUrl = meta.avatar_url || meta.picture || null

    // Retry fetching user up to 5 times
    let existingUser = null
    let fetchError = null

    for (let attempt = 0; attempt < 5; attempt++) {
      if (!mounted.current) return
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('provider_id', oauthUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          fetchError = error
          await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
          continue
        }

        existingUser = data
        fetchError = null
        break
      } catch (e) {
        fetchError = e
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
      }
    }

    if (!mounted.current) return

    if (fetchError && !existingUser) {
      console.error('Error fetching user after retries:', fetchError)
      return
    }

    if (existingUser) {
      if (avatarUrl && avatarUrl !== existingUser.avatar_url) {
        await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', existingUser.id)
      }
      if (mounted.current) {
        setUser({ ...existingUser, avatarUrl })
        setNeedsProfile(false)
      }
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase.from('users').insert({
        provider_id: oauthUser.id,
        provider: oauthUser.app_metadata?.provider || 'google',
        name,
        avatar: avatarText,
        avatar_url: avatarUrl,
        role: 'player',
        lang: 'ru',
      }).select().single()

      if (insertError) {
        // Duplicate key — fetch existing
        if (insertError.code === '23505') {
          const { data: retryUser } = await supabase
            .from('users')
            .select('*')
            .eq('provider_id', oauthUser.id)
            .single()
          if (retryUser && mounted.current) {
            setUser({ ...retryUser, avatarUrl })
            setNeedsProfile(false)
          }
          return
        }
        console.error('Error creating user:', insertError)
        return
      }

      if (newUser && mounted.current) {
        setUser({ ...newUser, avatarUrl })
        setNeedsProfile(true)
      }
    }
  }

  async function signInWithGoogle() {
    const redirectTo = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
  }

  async function signInWithDiscord() {
    const redirectTo = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo, scopes: 'identify email' },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setNeedsProfile(false)
  }

  async function updateProfile(data: Partial<User>) {
    if (!user) return
    const { error } = await supabase.from('users').update(data).eq('id', user.id)
    if (!error) setUser(prev => prev ? { ...prev, ...data } : prev)
  }

  async function completeRegistration(nick: string, telegram: string, gameId: string) {
    if (!user) return
    await supabase.from('users').update({
      name: nick,
      telegram,
      game_id: gameId,
    }).eq('id', user.id)
    setUser(prev => prev ? { ...prev, name: nick, telegram, game_id: gameId } : prev)
    setNeedsProfile(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      loading,
      signInWithDiscord,
      signInWithGoogle,
      signOut,
      updateProfile,
      completeRegistration,
      needsProfile,
      setNeedsProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
