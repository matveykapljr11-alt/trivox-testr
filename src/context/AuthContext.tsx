import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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

  useEffect(() => {
    let mounted = true

    // Listen for auth changes FIRST (before getSession)
    // This ensures we catch the SIGNED_IN event on mobile OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      console.log('Auth event:', event)

      if (event === 'INITIAL_SESSION') {
        if (session) {
          await handleSession(session)
        }
        setLoading(false)
      } else if (event === 'SIGNED_IN' && session) {
        await handleSession(session)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        if (!user) await handleSession(session)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setNeedsProfile(false)
        setLoading(false)
      }
    })

    // Fallback: also try getSession in case onAuthStateChange doesn't fire
    setTimeout(() => {
      if (!mounted) return
      supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        if (!mounted) return
        if (error) {
          console.error('Session error:', error)
          setLoading(false)
          return
        }
        if (session && !user) {
          await handleSession(session)
        }
        setLoading(false)
      })
    }, 500)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSession(session: any) {
    const oauthUser = session?.user
    if (!oauthUser) return

    const meta = oauthUser.user_metadata || {}
    const name = meta.full_name || meta.name || meta.user_name || oauthUser.email?.split('@')[0] || 'Player'
    const avatarText = name.slice(0, 2).toUpperCase()
    const avatarUrl = meta.avatar_url || meta.picture || null

    try {
      // Retry up to 3 times in case of network issues on mobile
      let existingUser = null
      let fetchError = null

      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('provider_id', oauthUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          fetchError = error
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
          continue
        }

        existingUser = data
        fetchError = null
        break
      }

      if (fetchError) {
        console.error('Error fetching user after retries:', fetchError)
        return
      }

      if (existingUser) {
        if (avatarUrl && avatarUrl !== existingUser.avatar_url) {
          await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', existingUser.id)
        }
        setUser({ ...existingUser, avatarUrl })
        setNeedsProfile(false)
      } else {
        // New user — create profile
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
          // Maybe duplicate — try to fetch again
          if (insertError.code === '23505') {
            const { data: retryUser } = await supabase
              .from('users')
              .select('*')
              .eq('provider_id', oauthUser.id)
              .single()
            if (retryUser) {
              setUser({ ...retryUser, avatarUrl })
              setNeedsProfile(false)
              return
            }
          }
          console.error('Error creating user:', insertError)
          return
        }

        if (newUser) {
          setUser({ ...newUser, avatarUrl })
          setNeedsProfile(true)
        }
      }
    } catch (e) {
      console.error('Error handling session:', e)
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
