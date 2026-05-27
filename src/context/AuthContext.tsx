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

    console.log('[auth] trying SELECT first...')
    const selectPromise = supabase
      .from('users')
      .select('*')
      .eq('provider_id', oauthUser.id)
      .limit(1)

    const selectTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SELECT TIMEOUT 5s')), 5000)
    )

    let existingUser: any = null
    try {
      const selectResult: any = await Promise.race([selectPromise, selectTimeout])
      console.log('[auth] SELECT result:', selectResult)
      if (selectResult.error) {
        console.error('[auth] SELECT error:', selectResult.error)
      }
      existingUser = selectResult.data && selectResult.data.length > 0 ? selectResult.data[0] : null
    } catch (err) {
      console.error('[auth] SELECT timed out:', err)
    }

    if (existingUser) {
      console.log('[auth] existing user found, using SELECT result')

      if (avatarUrl && avatarUrl !== existingUser.avatar_url) {
        supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', existingUser.id).then(
          (r) => console.log('[auth] avatar update result:', r),
          (e) => console.error('[auth] avatar update failed:', e)
        )
      }

      setUser({ ...existingUser, avatar_url: avatarUrl ?? existingUser.avatar_url })
      setNeedsProfile(!existingUser.telegram || !existingUser.game_id)
      console.log('[auth] loadOrCreateUser DONE (from SELECT)')
      return
    }

    console.log('[auth] no existing user, trying INSERT...')
    const insertPromise = supabase
      .from('users')
      .insert({
        provider_id: oauthUser.id,
        provider: oauthUser.app_metadata?.provider || 'google',
        name,
        avatar: avatarText,
        avatar_url: avatarUrl,
        role: 'player',
        lang: 'ru',
      })
      .select()

    const insertTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('INSERT TIMEOUT 8s')), 8000)
    )

    let insertResult: any
    try {
      insertResult = await Promise.race([insertPromise, insertTimeout])
      console.log('[auth] INSERT returned, has error:', !!insertResult.error)
    } catch (err) {
      console.error('[auth] INSERT TIMED OUT')
      console.error('[auth] timeout error:', err)
      return
    }

    if (insertResult.error) {
      console.error('[auth] INSERT failed')
      console.error('[auth] error code:', insertResult.error.code)
      console.error('[auth] error message:', insertResult.error.message)
      console.error('[auth] error details:', insertResult.error.details)
      console.error('[auth] error hint:', insertResult.error.hint)

      if (insertResult.error.code === '23505') {
        console.log('[auth] duplicate detected, retry SELECT...')
        const retry = await supabase
          .from('users')
          .select('*')
          .eq('provider_id', oauthUser.id)
          .limit(1)
        if (retry.data && retry.data.length > 0) {
          const u = retry.data[0]
          setUser({ ...u, avatar_url: avatarUrl ?? u.avatar_url })
          setNeedsProfile(!u.telegram || !u.game_id)
          console.log('[auth] loadOrCreateUser DONE (recovered from duplicate)')
        }
      }
      return
    }

    const data = insertResult.data && insertResult.data.length > 0 ? insertResult.data[0] : null
    if (!data) {
      console.error('[auth] INSERT returned no data')
      return
    }
    console.log('[auth] new user created:', data)
    setUser({ ...data, avatar_url: avatarUrl ?? data.avatar_url })
    setNeedsProfile(true)
    console.log('[auth] loadOrCreateUser DONE (from INSERT)')
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
