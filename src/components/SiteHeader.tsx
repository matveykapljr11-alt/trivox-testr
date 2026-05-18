import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, Bell, Check, XCircle, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const nav = [
  { to: '/praki', label: 'Праки' },
  { to: '/teams', label: 'Команды' },
  { to: '/players', label: 'Игроки' },
  { to: '/tournaments', label: 'Турниры' },
  { to: '/my-team', label: 'Моя команда' },
]

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return { isDark, toggle: () => setIsDark(v => !v) }
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [challenges, setChallenges] = useState<any[]>([])
  const { user, isLoggedIn, signOut } = useAuth()
  const { pathname } = useLocation()
  const { isDark, toggle } = useTheme()

  async function loadChallenges() {
    if (!user) return
    try {
      const { data: scrims } = await supabase
        .from('scrims')
        .select('id, team_name')
        .eq('user_id', user.id)

      if (!scrims || scrims.length === 0) return

      const scrimIds = scrims.map((s: any) => s.id)

      const { data: ch } = await supabase
        .from('scrim_challenges')
        .select('*')
        .in('scrim_id', scrimIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (ch) {
        const withNames = ch.map((c: any) => ({
          ...c,
          scrim_team_name: scrims.find((s: any) => s.id === c.scrim_id)?.team_name || '—'
        }))
        setChallenges(withNames)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (isLoggedIn) loadChallenges()
  }, [isLoggedIn, user])

  useEffect(() => {
    if (!isLoggedIn) return
    const interval = setInterval(loadChallenges, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn, user])

  async function handleAccept(challenge: any) {
    try {
      await supabase.from('scrim_challenges').update({ status: 'accepted' }).eq('id', challenge.id)
      await supabase.from('scrims').update({ status: 'confirmed' }).eq('id', challenge.scrim_id)
      setChallenges(prev => prev.filter(c => c.id !== challenge.id))
      toast.success(`Заявка от ${challenge.challenger_name} принята!`, {
        description: 'Свяжитесь через Discord/Telegram для уточнения деталей'
      })
    } catch {
      toast.error('Ошибка при принятии заявки')
    }
  }

  async function handleDecline(challenge: any) {
    try {
      await supabase.from('scrim_challenges').update({ status: 'declined' }).eq('id', challenge.id)
      await supabase.from('scrims').update({ status: 'open' }).eq('id', challenge.scrim_id)
      setChallenges(prev => prev.filter(c => c.id !== challenge.id))
      toast.success('Заявка отклонена')
    } catch {
      toast.error('Ошибка при отклонении заявки')
    }
  }

  async function handleSignOut() {
    await signOut()
    setUserMenuOpen(false)
    toast.success('До встречи!')
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">

          {/* Logo */}
          <Link to="/" className="press flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-electric shadow-glow">
              <span className="font-display text-sm text-primary-foreground">T</span>
            </div>
            <span className="font-display text-lg tracking-tight">TRIVOX</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`story-link py-2 text-sm font-medium transition-colors ${
                  pathname === n.to
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-active={pathname === n.to}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="press grid h-9 w-9 place-items-center rounded-lg border border-border bg-card transition hover:border-primary/40 hover:bg-muted"
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            >
              {isDark
                ? <Sun className="h-4 w-4 text-yellow-400" />
                : <Moon className="h-4 w-4" />
              }
            </button>

            {/* Bell notifications */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => { setBellOpen(v => !v); setUserMenuOpen(false) }}
                  className="press relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card transition hover:border-primary/40 hover:bg-muted"
                >
                  <Bell className="h-4 w-4" />
                  {challenges.length > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {challenges.length}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-glow animate-slide-in-top z-50">
                    <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                      <span className="font-display text-sm uppercase">Заявки на праки</span>
                      {challenges.length > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {challenges.length} новых
                        </span>
                      )}
                    </div>
                    {challenges.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Нет входящих заявок
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {challenges.map(ch => (
                          <div key={ch.id} className="p-4">
                            <div className="text-xs text-muted-foreground mb-1">
                              Заявка на прак <span className="font-semibold text-foreground">{ch.scrim_team_name}</span>
                            </div>
                            <div className="font-semibold text-sm">{ch.challenger_name}</div>
                            {ch.challenger_discord && (
                              <div className="text-xs text-muted-foreground mt-0.5">Discord: {ch.challenger_discord}</div>
                            )}
                            {ch.challenger_telegram && (
                              <div className="text-xs text-muted-foreground">TG: {ch.challenger_telegram}</div>
                            )}
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleAccept(ch)}
                                className="press flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 py-2 text-xs font-semibold text-green-600 hover:bg-green-500/20 transition"
                              >
                                <Check className="h-3.5 w-3.5" /> Принять
                              </button>
                              <button
                                onClick={() => handleDecline(ch)}
                                className="press flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Отклонить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => { setUserMenuOpen(v => !v); setBellOpen(false) }}
                  className="press flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-muted"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-electric text-xs font-bold text-primary-foreground">
                    {user.avatar || user.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden md:block max-w-[100px] truncate">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-glow animate-slide-in-top">
                    <div className="border-b border-border px-4 py-3">
                      <div className="text-sm font-semibold">{user.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      >
                        <User className="h-4 w-4 text-muted-foreground" /> Мой профиль
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary hover:bg-muted"
                        >
                          🛡️ Админ панель
                        </Link>
                      )}
                      <button
                        onClick={toggle}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      >
                        {isDark
                          ? <><Sun className="h-4 w-4 text-yellow-400" /> Светлая тема</>
                          : <><Moon className="h-4 w-4 text-muted-foreground" /> Тёмная тема</>
                        }
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-muted"
                      >
                        <LogOut className="h-4 w-4" /> Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="hidden h-9 rounded-md px-3 text-sm font-medium text-foreground transition hover:bg-muted md:inline-flex md:items-center"
                >
                  Войти
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="press hidden h-9 items-center rounded-md bg-gradient-to-r from-primary to-electric px-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 md:inline-flex"
                >
                  Регистрация
                </button>
              </>
            )}

            {/* Mobile burger */}
            <button
              className="rounded-md p-2 md:hidden"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Меню"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden animate-slide-in-top">
            <div className="flex flex-col gap-1 p-3">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    pathname === n.to
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {n.label}
                </Link>
              ))}
              <button
                onClick={toggle}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                {isDark
                  ? <><Sun className="h-4 w-4 text-yellow-400" /> Светлая тема</>
                  : <><Moon className="h-4 w-4" /> Тёмная тема</>
                }
              </button>
              {!isLoggedIn && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMobileOpen(false); setAuthOpen(true) }}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); setAuthOpen(true) }}
                    className="press rounded-md bg-gradient-to-r from-primary to-electric px-3 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Регистрация
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {(userMenuOpen || bellOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setUserMenuOpen(false); setBellOpen(false) }} />
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
