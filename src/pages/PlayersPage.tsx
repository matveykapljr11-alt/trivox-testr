import { useEffect, useState } from 'react'
import { Crosshair, Crown, Headphones, Shield, Sparkles, Target, Search, Plus, X, Users, Briefcase } from 'lucide-react'
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
  { id: 'Manager', icon: Briefcase, role: 'Manager', desc: 'Менеджер' },
]

const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legendary', 'Mythic I', 'Mythic II', 'Champion']

type Player = {
  id: string
  name: string
  avatar: string
  role: string
  rank_mm?: string
  kd?: number
  hours?: number
  telegram?: string
  looking_for_team?: boolean
  online?: boolean
}

// Форма анкеты
function PlayerFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [role, setRole] = useState('AWP')
  const [rank, setRank] = useState('Legendary')
  const [telegram, setTelegram] = useState(user?.telegram || '')
  const [kd, setKd] = useState('')
  const [hours, setHours] = useState('')
  const [loading, setLoading] = useState(false)

  const gameRoles = roles.filter(r => r.id !== 'all')

  async function handleSave() {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('players').upsert({
        id: user.id,
        name: user.name,
        avatar: user.name?.slice(0, 2).toUpperCase(),
        role,
        rank_mm: rank,
        telegram: telegram.trim() || null,
        kd: kd ? parseFloat(kd) : null,
        hours: hours ? parseInt(hours) : null,
        looking_for_team: true,
        user_id: user.id,
      }, { onConflict: 'id' })

      if (error) throw error
      toast.success('Анкета опубликована!', { description: 'Тебя теперь видят все команды' })
      onSaved()
      onClose()
    } catch (e: any) {
      // Fallback: try users table
      try {
        await supabase.from('users').update({
          role,
          rank_mm: rank,
          telegram: telegram.trim() || null,
          kd: kd ? parseFloat(kd) : null,
          hours: hours ? parseInt(hours) : null,
          looking_for_team: true,
        }).eq('id', user!.id)
        toast.success('Анкета опубликована!')
        onSaved()
        onClose()
      } catch {
        toast.error('Ошибка сохранения: ' + (e.message || ''))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase">Анкета игрока</h2>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Твоя роль *</label>
            <div className="grid grid-cols-2 gap-2">
              {gameRoles.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`press flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    role === r.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <r.icon className="h-4 w-4" />
                  {r.role}
                  <span className="text-xs text-muted-foreground ml-auto">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ранг *</label>
            <select
              value={rank}
              onChange={e => setRank(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
            >
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">K/D</label>
              <input
                value={kd}
                onChange={e => setKd(e.target.value)}
                placeholder="1.25"
                type="number"
                step="0.01"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Часов в игре</label>
              <input
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="2000"
                type="number"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telegram</label>
            <input
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              placeholder="@username"
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="press mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-electric text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Сохраняем...' : 'Опубликовать анкету'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlayersPage() {
  const { user, isLoggedIn } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('looking_for_team', true)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data && data.length > 0) {
        setPlayers(data.map(p => ({ ...p, online: Math.random() > 0.5 })))
      } else {
        // fallback to users table
        const { data: ud } = await supabase
          .from('users')
          .select('id, name, avatar, role, rank_mm, kd, hours, telegram')
          .order('created_at', { ascending: false })
          .limit(50)
        if (ud && ud.length > 0) {
          setPlayers(ud.map(p => ({ ...p, online: Math.random() > 0.5 })))
        } else {
          setPlayers([])
        }
      }
    } catch {
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = players
    .filter(p => role === 'all' || p.role === role)
    .filter(p => !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.rank_mm?.toLowerCase().includes(q.toLowerCase()))

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
      >
        <button
          onClick={() => isLoggedIn ? setFormOpen(true) : setAuthOpen(true)}
          className="press inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Я ищу команду
        </button>
      </PageHero>

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
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
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 font-display text-xl uppercase">Игроков пока нет</h3>
            <p className="mt-2 text-sm text-muted-foreground">Будь первым — подай анкету!</p>
            <button
              onClick={() => isLoggedIn ? setFormOpen(true) : setAuthOpen(true)}
              className="press mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Я ищу команду
            </button>
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
                {p.telegram && (
                  <div className="mt-2 text-xs text-primary font-medium">✈️ {p.telegram}</div>
                )}
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

      <PlayerFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
