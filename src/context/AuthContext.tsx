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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleSession(session)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setNeedsProfile(false)
      }
      setLoading(false)
    })

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await handleSession(session)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(session: any) {
    const oauthUser = session.user
    const meta = oauthUser.user_metadata || {}
    const name = meta.full_namemeta.user_name'Player'
    const avatarText = name.slice(0, 2).toUpperCase()
    const avatarUrl = meta.avatar_urlnull

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('provider_id', oauthUser.id)
        .single()

      if (existingUser) {
        if (avatarUrl && avatarUrl !== existingUser.avatar_url) {
          await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', existingUser.id)
        }
        setUser({ ...existingUser, avatarUrl })
        setNeedsProfile(false)
      } else {
        const { data: newUser } = await supabase.from('users').insert({
          provider_id: oauthUser.id,
          provider: oauthUser.app_metadata?.provider || 'discord',
          name,
          avatar: avatarText,
          avatar_url: avatarUrl,
          role: 'player',
          lang: 'ru',
        }).select().single()

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
    const redirectTo = window.location.origin​​​​​​​​​​​​​​​​
с
