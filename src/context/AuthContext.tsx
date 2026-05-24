import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type User } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

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
    let handled = false

    console.log('[auth] AuthProvider mounted, subscribing...')

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        console.log('[auth]', event, 'session:', !!session, 'handled:', handled)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setNeedsProfile(false)
          setLoading(false)
          return
        }

        if (session?.user && !handled) {
          console.log('[auth] about to call loadOrCreateUser')
          handled = true
          try {
            await loadOrCreateUser(session)
            console.log('[auth] loadOrCreateUser returned successfully')
          } catch (err) {
            console.error('[auth] loadOrCreateUser threw exception:', err)
          }
        } else if (session?.user && handled) {
          console.log('[auth] session present but handled=true, skipping')
        }

        if (event === 'INITIAL_SESSION') {
          setLoading(false)
        }

        if (event === 'SIGNED_IN') {
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('[auth] AuthProvider unmounting')
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadOrCreateUser(session: Session) {
    console.log('[auth] loadOrCreateUser START')
    const oauthUser = session.user
    console.log('[auth] oauth user:', {
      id: oauthUser.id,
      email: oauthUser.email,
      provider: oauthUser.app_metadata?.provider,
    })

    const meta = oauthUser.user_metadata || {}
    const name =
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      oauthUser.email?.split('@')[0] ||
      'Player'
    const avatarText = name.slice(0, 2).toUpperCase()
    const avatarUrl = meta.avatar_url || meta.picture || null

    console.log('[auth] computed values:', { name, avatarText, avatarUrl })

    console.log('[auth] calling upsert...')
    const upsertResult = await supabase
      .from('users')
      .upsert(
        {
          provider_id: oauthUser.id,
          provider: oauthUser.app_metadata?.provider || 'google',
          name,
          avatar: avatarText,
          avatar_url: avatarUrl,
          role: 'player',
          lang: 'ru',
        },
        {
          onConflict: 'provider_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    console.log('[auth] upsert returned, has error:', !!upsertResult.error)

    if (upsertResult.error) {
      console.error('[auth] upsert FAILED')
      console.error('[auth] error code:', upsertResult.error.code)
      console.error('[auth] error message:', upsertResult.error.message)
      console.error('[auth] error details:', upsertResult.error.details)
      console.error('[auth] error hint:', upsertResult.error.hint)
      console.error('[auth] full error object:', upsertResult.error)
      return
    }

    const data = upsertResult.data
    console.log('[auth] user data received:', data)

    if (!data) {
      console.error('[auth] upsert returned no data and no error - unexpected')
      return
    }

    if (avatarUrl && avatarUrl !== data.avatar_url) {
      console.log('[auth] updating avatar_url')
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', data.id)
    }

    console.log('[auth] calling setUser with:', data)
    setUser({ ...data, avatar_url: avatarUrl ?? data.avatar_url })
    setNeedsProfile(!data.telegram || !data.game_id)
    console.log('[auth] loadOrCreateUser DONE')
  }

  async function signInWithGoogle() {
    console.log('[auth] signInWithGoogle clicked')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    if (error) console.error('[auth] google signin error:', error)
  }

  async function signInWithDiscord() {
    console.log('[auth] signInWithDiscord clicked')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: 'identify email',
      },
    })
    if (error) console.error('[auth] discord signin error:', error)
  }

  async function signOut() {
    console.log('[auth] signOut called')
    await supabase.auth.signOut()
  }

  async function updateProfile(data: Partial<User>) {
    if (!user) return
    const { error } = await supabase.from('users').update(data).eq('id', user.id)
    if (!error) setUser(prev => (prev ? { ...prev, ...data } : prev))
  }

  async function completeRegistration(nick: string, telegram: string, gameId: string) {
    if (!user) return
    const { error } = await supabase
      .from('users')
      .update({ name: nick, telegram, game_id: gameId })
      .eq('id', user.id)
    if (error) {
      console.error('[auth] complete registration failed:', error)
      return
    }
    setUser(prev => (prev ? { ...prev, name: nick, telegram, game_id: gameId } : prev))
    setNeedsProfile(false)
  }

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
