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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        // Clear bad session
        await supabase.auth.signOut()
        setUser(null)
        setLoading(false)
        return
      }
      if (session) {
        await handleSession(session)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      if (event === 'SIGNED_IN' && session) {
        await handleSession(session)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refreshed successfully — update user if needed
        if (!user) await handleSession(session)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setNeedsProfile(false)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(session: any) {
    const oauthUser = session.user
    if (!oauthUser) return

    const meta = oauthUser.user_metadata || {}
    const name = meta.full_name || meta.name || meta.user_name || oauthUser.email?.split('@')[0] || 'Player'
    const avatarText = name.slice(0, 2).toUpperCase()
    const avatarUrl = meta.avatar_url || meta.picture || null

    try {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('provider_id', oauthUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, that's ok
        console.error('Error fetching user:', error)
        return
      }

      if (existingUser) {
        if (avatarUrl && avatarUrl !== existingUser.avatar_url) {
          await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', existingUser.id)
        }
        setUser({ ...existingUser, avatarUrl })
        setNeedsProfile(false)
      } else {
        const { data: newUser, error: insertError } = await supabase.from('users').insert({
          provider_id: oauthUser.id,
          provider: oauthUser.app_metadata?.provider || 'discord',
          name,
          avatar: avatarText,
          avatar_url: avatarUrl,
          role: 'player',
          lang: 'ru',
        }).select().single()

        if (insertError) {
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

  async function signInWithDiscord() {
    const redirectTo = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo, scopes: 'identify email' },
    })
  }

  async function signInWithGoogle() {
    const redirectTo = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
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
