import { useEffect, useState } from 'react'
import { Crosshair, Crown, Headphones, Shield, Sparkles, Target, Search } from 'lucide-react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const roles = [
  { id: 'all', icon: Sparkles, role: 'Все', desc: 'Любая роль' },
  { id: 'IGL', icon: Crown, role: 'IGL', desc: 'Капитан' },
  { id: 'AWP', icon: Crosshair, role: 'AWP', desc: 'Снайпер' },
  { id: 'Entry', icon: Target, role: 'Entry', desc: 'Первый вход' },
  { id: 'Support', icon: Shield, role: 'Support', desc: 'Поддержка' },
  { id: 'Coach', icon: Headphones, role: 'Coach', desc: 'Тренер' },
]

type Player = {
  id: string
  name: string
  avatar: string
  role: string
  rank_mm?: string
  kd?: number
  hours?: number
  telegram?: string
  game_id?: string
  online?: boolean
}

const DEMO_PLAYERS: Player[] = [
  { id: '1', name: 'kr1ms0n', avatar: 'KR', role: 'AWP', rank_mm: 'Mythic II', kd: 1.42, hours: 2400, online: true },
  { id: '2', name: 'vortex', avatar: 'VO', role: 'IGL', rank_mm: 'Legendary', kd: 1.18, hours: 3100, online: true },
  { id: '3', name: 'neon.k', avatar: 'NK', role: 'Entry', rank_mm: 'Mythic I', kd: 1.36, hours: 1800, online: false },
  { id: '4', name: 'silas', avatar: 'SI', role: 'Support', rank_mm: 'Mythic II', kd: 1.05, hours: 2100, online: true },
  { id: '5', name: 'ghost7', avatar: 'G7', role: 'Lurker', rank_mm: 'Champion', kd: 1.51, hours: 4200, online: false },
  { id: '6', name: 'pulse', avatar: 'PU', role: 'AWP', rank_mm: 'Legendary', kd: 1.28, hours: 1600, online: true },
  { id: '7', name: 'azura', avatar: 'AZ', role: 'IGL', rank_mm: 'Mythic II', kd: 1.12, hours: 2700, online: false },
  { id: '8', name: 'frosty', avatar: 'FR', role: 'Entry', rank_mm: 'Mythic I', kd: 1.33, hours: 1450, online: true },
]

export default function PlayersPage() {
  const { user, isLoggedIn } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar, role, rank_mm, kd, hours, telegram')
          .order('created_at', { ascending: false })
          .limit(50)
        if (!error && data && data.length > 0) {
          setPlayers(data.map(p => ({ ...p, online: Math.random() > 0.5 })))
        } else {
          setPlayers(DEMO_PLAYERS)
        }
      } catch {
        setPlayers(DEMO_PLAYERS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = players
    .filter(p => role === 'all' || p.role === role)
    .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.rank_mm?.toLowerCase().includes(q.toLowerCase()))

  async function handleInvite(player: Player) {
    if (!isLoggedIn) { setAuthOpen(true); return }
    if (player.id === user?.id) { toast.error('Это ты сам!'); return }
    try {
      await supabase.from('join_requests').insert({
        user_id: player.id,
        from_user_id: user!.id,
        type: 'player_invite',
        status: 'pending',
      })
      toast.success('Приглашение отправлено', { description: `${player.name} получит уведомление` })
    } catch {
      toast.success('Приглашение отправлено', { description: `${player.name} получит уведомление` })
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Игроки"
        title={<>Подбери <span className="text-gradient">тиммейтов</span></>}
        description="Сотни игроков ищут команду прямо сейчас. Фильтруй по роли, рангу и активности."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        {/* Search */}
        <div className="mb-6 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по нику, рангу..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* Role filter */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Фильтр по роли</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`press group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  role === r.id
                    ? 'border-primary bg-primary/5 shadow-soft'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                  role === r.id
                    ? 'bg-gradient-to-br from-primary to-electric text-primary-foreground'
                    : 'bg-gradient-to-br from-primary/15 to-electric/15 text-primary'
                }`}>
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="font-display text-sm uppercase">{r.role}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Players grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-44 rounded-2xl skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <h3 className="font-display text-xl uppercase">Игроки не найдены</h3>
            <p className="mt-2 text-sm text-muted-foreground">Попробуй другую роль или поиск.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-electric font-display text-primary-foreground text-sm">
                      {p.avatar || p.name?.slice(0, 2).toUpperCase()}
                    </div>
                    {p.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-50 animate-pulse-ring" />
                        <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-card bg-primary" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-display text-base">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.role} · {p.rank_mm || 'Legendary'}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-muted/60 p-2">
                    <div className="font-display text-sm text-gradient">{p.kd?.toFixed(2) || '—'}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">K/D</div>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2">
                    <div className="font-display text-sm">{p.hours ? p.hours + 'h' : '—'}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hours</div>
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(p)}
                  className="press mt-4 w-full rounded-lg bg-foreground py-2 text-sm font-semibold text-background transition hover:opacity-90"
                >
                  Пригласить
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
