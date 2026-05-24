import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, Bell, Check, XCircle, Moon, Sun, Swords, Trophy, Clock } from 'lucide-react'
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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч назад`
  return `${Math.floor(hours / 24)} д назад`
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [bellTab, setBellTab] = useState<'all' | 'scrims' | 'tournaments'>('all')
  const [challenges, setChallenges] = useState<any[]>([])
  const [tourNotifs, setTourNotifs] = useState<any[]>([])
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const { user, isLoggedIn, signOut } = useAuth()
  const { pathname } = useLocation()
  const { isDark, toggle } = useTheme()

  async function loadNotifications() {
    if (!user) return
    try {
      // Load scrim challenges
      const { data: scrims } = await supabase
        .from('scrims')
        .select('id, team_name')
        .eq('user_id', user.id)

      if (scrims && scrims.length > 0) {
        const scrimIds = scrims.map((s: any) => s.id)
        const { data: ch } = await supabase
          .from('scrim_challenges')
          .select('*')
          .in('scrim_id', scrimIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (ch) {
          setChallenges(ch.map((c: any) => ({
            ...c,
            scrim_team_name: scrims.find((s: any) => s.id === c.scrim_id)?.team_name || '—'
          })))
        }
      }

      // Load tournament notifications (upcoming tournaments user is registered in)
      const { data: myTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (myTeam) {
        // Load join requests for this team
        const { data: jr } = await supabase
          .from('join_requests')
          .select('*')
          .eq('team_id', myTeam.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10)
        setJoinRequests(jr || [])

        const { data: tt } = await supabase
          .from('tournament_teams')
          .select('tournament_id')
          .eq('team_id', myTeam.id)

        if (tt && tt.length > 0) {
          const ids = tt.map((x: any) => x.tournament_id)
          const { data: tours } = await supabase
            .from('tournaments')
            .select('id, title, status, date_text, format')
            .in('id', ids)
            .in('status', ['upcoming', 'live'])
            .limit(5)
          setTourNotifs(tours || [])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (isLoggedIn) loadNotifications()
  }, [isLoggedIn, user])

  useEffect(() => {
    if (!isLoggedIn) return
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn, user])

  async function handleAccept(challenge: any) {
    try {
      await supabase.from('scrim_challenges').update({ status: 'accepted' }).eq('id', challenge.id)
      await supabase.from('scrims').update({ status: 'confirmed' }).eq('id', challenge.scrim_id)
      setChallenges(prev => prev.filter(c => c.id !== challenge.id))
      toast.success(`Заявка от ${challenge.challenger_name} принята!`)
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

  async function handleAcceptJoin(req: any) {
    try {
      await supabase.from('join_requests').update({ status: 'accepted' }).eq('id', req.id)
      // Add to team_members
      await supabase.from('team_members').insert({
        team_id: req.team_id,
        user_id: req.user_id,
        role: req.rank || 'Player',
        rank: req.rank || null,
      })
      setJoinRequests(prev => prev.filter(r => r.id !== req.id))
      toast.success(`${req.name} принят в команду!`)
    } catch {
      toast.error('Ошибка при принятии заявки')
    }
  }

  async function handleDeclineJoin(req: any) {
    try {
      await supabase.from('join_requests').update({ status: 'declined' }).eq('id', req.id)
      setJoinRequests(prev => prev.filter(r => r.id !== req.id))
      toast.success('Заявка отклонена')
    } catch {
      toast.error('Ошибка при отклонении')
    }
  }

  async function handleSignOut() {
    await signOut()
    setUserMenuOpen(false)
    toast.success('До встречи!')
  }

  const totalNotifs = challenges.length + tourNotifs.filter(t => t.status === 'live').length + joinRequests.length

  const scrimItems = challenges
  const tourItems = tourNotifs
  const allItems = [
    ...challenges.map(c => ({ ...c, _type: 'scrim' })),
    ...tourNotifs.map(t => ({ ...t, _type: 'tournament' })),
    ...joinRequests.map(r => ({ ...r, _type: 'join' })),
  ]
  const displayItems = bellTab === 'all' ? allItems : bellTab === 'scrims' ? scrimItems.map(c => ({ ...c, _type: 'scrim' })) : bellTab === 'tournaments' ? tourItems.map(t => ({ ...t, _type: 'tournament' })) : joinRequests.map(r => ({ ...r, _type: 'join' }))

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
              <Link key={n.to} to={n.to}
                className={`story-link py-2 text-sm font-medium transition-colors ${pathname === n.to ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                data-active={pathname === n.to}>
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Dark mode toggle */}
            <button onClick={toggle}
              className="press grid h-9 w-9 place-items-center rounded-lg border border-border bg-card transition hover:border-primary/40 hover:bg-muted"
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}>
              {isDark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Bell notifications */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => { setBellOpen(v => !v); setUserMenuOpen(false) }}
                  className="press relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card transition hover:border-primary/40 hover:bg-muted"
                >
                  <Bell className="h-4 w-4" />
                  {totalNotifs > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse-ring">
                      {totalNotifs}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-border bg-card shadow-glow animate-slide-in-top z-50 overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="font-display text-sm uppercase">Уведомления</span>
                        {totalNotifs > 0 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {totalNotifs}
                          </span>
                        )}
                      </div>
                      <button onClick={() => setBellOpen(false)} className="press rounded-md p-1 hover:bg-muted">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border">
                      {[
                        { id: 'all', label: 'Все', count: allItems.length },
                        { id: 'scrims', label: '⚔️ Праки', count: challenges.length },
                        { id: 'tournaments', label: '🏆 Турниры', count: tourNotifs.length },
                        { id: 'joins', label: '👥 Заявки', count: joinRequests.length },
                      ].map(t => (
                        <button key={t.id} onClick={() => setBellTab(t.id as any)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition border-b-2 ${
                            bellTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}>
                          {t.label}
                          {t.count > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${bellTab === t.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{t.count}</span>}
                        </button>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {displayItems.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">Нет уведомлений</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {displayItems.map((item: any, i) => {
                            if (item._type === 'scrim') {
                              return (
                                <div key={item.id} className="p-4 hover:bg-muted/30 transition">
                                  <div className="flex items-start gap-3">
                                    <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-primary/10">
                                      <Swords className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wide">Заявка на прак</span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-2.5 w-2.5" />{timeAgo(item.created_at)}
                                        </span>
                                      </div>
                                      <div className="text-sm font-semibold">{item.challenger_name}</div>
                                      <div className="text-xs text-muted-foreground">хочет сыграть против <span className="font-semibold text-foreground">{item.scrim_team_name}</span></div>
                                      {(item.challenger_discord || item.challenger_telegram) && (
                                        <div className="mt-1.5 flex gap-2 text-xs text-muted-foreground">
                                          {item.challenger_discord && <span>💬 {item.challenger_discord}</span>}
                                          {item.challenger_telegram && <span>✈️ {item.challenger_telegram}</span>}
                                        </div>
                                      )}
                                      <div className="mt-3 flex gap-2">
                                        <button onClick={() => handleAccept(item)}
                                          className="press flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 py-2 text-xs font-semibold text-green-600 hover:bg-green-500/20 transition">
                                          <Check className="h-3.5 w-3.5" /> Принять
                                        </button>
                                        <button onClick={() => handleDecline(item)}
                                          className="press flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition">
                                          <XCircle className="h-3.5 w-3.5" /> Отклонить
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            } else if (item._type === 'join') {
                              return (
                                <div key={item.id} className="p-4 hover:bg-muted/30 transition">
                                  <div className="flex items-start gap-3">
                                    <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-blue-500/10">
                                      <User className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">Заявка в команду</span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-2.5 w-2.5" />{timeAgo(item.created_at)}
                                        </span>
                                      </div>
                                      <div className="text-sm font-semibold">{item.name}</div>
                                      <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                                        {item.rank && <span>🏅 {item.rank}</span>}
                                        {item.region && <span>📍 {item.region}</span>}
                                        {item.game_id && <span>🎮 {item.game_id}</span>}
                                      </div>
                                      {item.about && <div className="mt-1 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2 py-1 line-clamp-2">{item.about}</div>}
                                      <div className="mt-3 flex gap-2">
                                        <button onClick={() => handleAcceptJoin(item)}
                                          className="press flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 py-2 text-xs font-semibold text-green-600 hover:bg-green-500/20 transition">
                                          <Check className="h-3.5 w-3.5" /> Принять
                                        </button>
                                        <button onClick={() => handleDeclineJoin(item)}
                                          className="press flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition">
                                          <XCircle className="h-3.5 w-3.5" /> Отклонить
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            } else {
                              return (
                                <Link key={item.id} to={`/tournaments/${item.id}`} onClick={() => setBellOpen(false)}
                                  className="flex items-start gap-3 p-4 hover:bg-muted/30 transition">
                                  <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${item.status === 'live' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                                    <Trophy className={`h-4 w-4 ${item.status === 'live' ? 'text-green-600' : 'text-yellow-600'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                      <span className={`text-xs font-bold uppercase tracking-wide ${item.status === 'live' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {item.status === 'live' ? '🔴 Идёт сейчас' : '🔵 Скоро'}
                                      </span>
                                    </div>
                                    <div className="text-sm font-semibold truncate">{item.title}</div>
                                    <div className="text-xs text-muted-foreground">{item.format}{item.date_text ? ` · ${item.date_text}` : ''}</div>
                                  </div>
                                </Link>
                              )
                            }
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border p-2">
                      <Link to="/my-team" onClick={() => setBellOpen(false)}
                        className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition">
                        Перейти в мою команду →
                      </Link>
                    </div>
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
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" /> Мой профиль
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary hover:bg-muted">
                          🛡️ Админ панель
                        </Link>
                      )}
                      <button onClick={toggle} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                        {isDark ? <><Sun className="h-4 w-4 text-yellow-400" /> Светлая тема</> : <><Moon className="h-4 w-4 text-muted-foreground" /> Тёмная тема</>}
                      </button>
                      <button onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-muted">
                        <LogOut className="h-4 w-4" /> Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setAuthOpen(true)}
                  className="hidden h-9 rounded-md px-3 text-sm font-medium text-foreground transition hover:bg-muted md:inline-flex md:items-center">
                  Войти
                </button>
                <button onClick={() => setAuthOpen(true)}
                  className="press hidden h-9 items-center rounded-md bg-gradient-to-r from-primary to-electric px-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 md:inline-flex">
                  Регистрация
                </button>
              </>
            )}

            {/* Mobile burger */}
            <button className="rounded-md p-2 md:hidden" onClick={() => setMobileOpen(v => !v)} aria-label="Меню">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden animate-slide-in-top">
            <div className="flex flex-col gap-1 p-3">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${pathname === n.to ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  {n.label}
                </Link>
              ))}
              <button onClick={toggle}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition">
                {isDark ? <><Sun className="h-4 w-4 text-yellow-400" /> Светлая тема</> : <><Moon className="h-4 w-4" /> Тёмная тема</>}
              </button>
              {!isLoggedIn && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button onClick={() => { setMobileOpen(false); setAuthOpen(true) }}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium">Войти</button>
                  <button onClick={() => { setMobileOpen(false); setAuthOpen(true) }}
                    className="press rounded-md bg-gradient-to-r from-primary to-electric px-3 py-2 text-sm font-semibold text-primary-foreground">Регистрация</button>
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
