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

    // Единственный источник истины - onAuthStateChange.
    // INITIAL_SESSION прилетит сразу после подписки, даже если сессии нет.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        console.log('[auth]', event, !!session)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setNeedsProfile(false)
          setLoading(false)
          return
        }

        if (session?.user && !handled) {
          handled = true
          await loadOrCreateUser(session)
        }

        // INITIAL_SESSION приходит ВСЕГДА (с сессией или без) -
        // это сигнал что инициализация закончена
        if (event === 'INITIAL_SESSION') {
          setLoading(false)
        }

        // На случай SIGNED_IN без предшествующего INITIAL_SESSION
        if (event === 'SIGNED_IN') {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadOrCreateUser(session: Session) {
    const oauthUser = session.user
    const meta = oauthUser.user_metadata || {}
    const name =
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      oauthUser.email?.split('@')[0] ||
      'Player'
    const avatarText = name.slice(0, 2).toUpperCase()
    const avatarUrl = meta.avatar_url || meta.picture || null

    // Атомарный upsert вместо select-then-insert.
    // Никаких retry, никаких race condition с duplicate key.
    // Требует UNIQUE constraint на provider_id.
    const { data, error } = await supabase
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

    if (error) {
      console.error('[auth] upsert failed:', error)
      return
    }

    // Обновим аватарку отдельно, если она изменилась (upsert мог перетереть имя)
    if (avatarUrl && avatarUrl !== data.avatar_url) {
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', data.id)
    }

    setUser({ ...data, avatar_url: avatarUrl ?? data.avatar_url })
    // needsProfile = true только если у юзера ещё нет telegram или game_id
    setNeedsProfile(!data.telegram || !data.game_id)
  }

  async function signInWithGoogle() {
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
    await supabase.auth.signOut()
    // Состояние очистится через событие SIGNED_OUT
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
