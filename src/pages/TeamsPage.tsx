import { useEffect, useMemo, useState } from 'react'
import { Trophy, Users, MapPin, ArrowUpDown, Plus, X, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase, type Team } from '../lib/supabase'
import { toast } from 'sonner'

const REGIONS = ['RU', 'EU', 'CIS', 'AS', 'NA']

function CreateTeamModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [region, setRegion] = useState('RU')
  const [discord, setDiscord] = useState('')
  const [telegram, setTelegram] = useState(user?.telegram || '')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) { toast.error('Укажи название команды'); return }
    if (!tag.trim()) { toast.error('Укажи тег команды'); return }
    if (!user) return
    setLoading(true)
    try {
      const { data: team, error } = await supabase.from('teams').insert({
        name: name.trim(),
        tag: tag.trim().toUpperCase(),
        region,
        game: 's2',
        status: 'Открыт набор',
        owner_id: user.id,
        discord: discord.trim() || null,
        telegram: telegram.trim() || null,
      }).select().single()

      if (error) throw error

      if (team) {
        await supabase.from('team_members').insert({
          team_id: team.id,
          user_id: user.id,
          role: 'IGL',
          rank: user.rank_mm || 'Legendary',
        })
      }

      toast.success('Команда создана!', { description: name })
      onCreated()
      onClose()
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase">Создать команду</h2>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Название *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="TRIVOX Academy"
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Тег *</label>
              <input value={tag} onChange={e => setTag(e.target.value.slice(0, 5))} placeholder="TVX" maxLength={5}
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm uppercase outline-none transition focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Регион</label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discord</label>
              <input value={discord} onChange={e => setDiscord(e.target.value)} placeholder="discord.gg/..."
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telegram</label>
              <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={loading}
            className="press mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-electric text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60">
            {loading ? 'Создаём...' : 'Создать команду'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TeamCard({ team, memberCount, onJoin, canJoin }: {
  team: Team
  memberCount: number
  onJoin: (t: Team) => void
  canJoin: boolean
}) {
  const initials = team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isOpen = team.status?.toLowerCase().includes('набор') || team.status?.toLowerCase().includes('ищут')

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow animate-fade-in-up">
      {/* Clickable header */}
      <Link to={`/teams/${team.id}`} className="block">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-electric font-display text-primary-foreground shadow-soft text-sm">
            {initials}
          </div>
          <div>
            <h3 className="font-display text-base uppercase hover:text-primary transition">{team.name}</h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {team.region} · <span className="font-mono text-[10px]">[{team.tag}]</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/60 p-2">
            <div className="font-display text-sm">{team.rating || 1000}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rating</div>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <div className="font-display text-sm">{memberCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Players</div>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <div className="font-display text-sm">{team.wins || 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Wins</div>
          </div>
        </div>
        <div className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          isOpen ? 'border border-primary/30 bg-primary/10 text-primary' : 'border border-border bg-muted text-muted-foreground'
        }`}>
          <Users className="h-3 w-3" /> {team.status}
        </div>
      </Link>

      {/* Join button — separate from link */}
      {canJoin && isOpen ? (
        <button onClick={() => onJoin(team)}
          className="press mt-4 w-full rounded-lg bg-foreground py-2 text-sm font-semibold text-background transition hover:opacity-90">
          Подать заявку
        </button>
      ) : (
        <button disabled
          className="press mt-4 w-full rounded-lg border border-border py-2 text-sm font-semibold opacity-50 cursor-not-allowed">
          {!canJoin ? 'Войди для заявки' : 'Полный состав'}
        </button>
      )}
    </div>
  )
}

const tabs = [
  { id: 'all', label: 'Все' },
  { id: 'open', label: 'Открыт набор' },
  { id: 'ru', label: 'Регион RU' },
]

export default function TeamsPage() {
  const { user, isLoggedIn } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('open')
  const [sort, setSort] = useState<'rating' | 'wins'>('rating')
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  async function loadTeams() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('game', 's2')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setTeams(data)

        const { data: members } = await supabase
          .from('team_members')
          .select('team_id')

        if (members) {
          const counts: Record<string, number> = {}
          members.forEach((m: any) => {
            counts[m.team_id] = (counts[m.team_id] || 0) + 1
          })
          setMemberCounts(counts)
        }
      } else {
        setTeams([])
      }
    } catch {
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeams() }, [])

  const filtered = useMemo(() => {
    let list = teams.filter(t => {
      if (tab === 'open') return t.status?.toLowerCase().includes('набор') || t.status?.toLowerCase().includes('ищут')
      if (tab === 'ru') return t.region === 'RU'
      return true
    }).filter(t => !q || t.name.toLowerCase().includes(q.toLowerCase()))
    return [...list].sort((a, b) => (b[sort] || 0) - (a[sort] || 0))
  }, [teams, tab, sort, q])

  async function handleJoin(team: Team) {
    if (!isLoggedIn) { setAuthOpen(true); return }
    if (!user) return
    try {
      await supabase.from('join_requests').insert({
        team_id: team.id,
        user_id: user.id,
        user_name: user.name,
        status: 'pending',
      })
      toast.success('Заявка в команду отправлена!', { description: team.name })
    } catch {
      toast.error('Ошибка отправки заявки')
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Команды"
        title={<>Собери <span className="text-gradient">сильный ростер</span></>}
        description="Просматривай открытые команды, фильтруй по региону и рейтингу, отправляй заявки или создавай свою команду."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск команды..."
                className="h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary w-48" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`press rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    tab === t.id ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSort(s => s === 'rating' ? 'wins' : 'rating')}
              className="press inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">
              <ArrowUpDown className="h-3.5 w-3.5" /> {sort === 'rating' ? 'Рейтинг' : 'Победы'}
            </button>
            <button onClick={() => isLoggedIn ? setCreateOpen(true) : setAuthOpen(true)}
              className="press inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-electric px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Создать
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-56 rounded-2xl skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <h3 className="font-display text-xl uppercase">Команд пока нет</h3>
            <p className="mt-2 text-sm text-muted-foreground">Создай первую команду!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((t, i) => (
              <div key={t.id} style={{ animationDelay: `${i * 40}ms` }}>
                <TeamCard
                  team={t}
                  memberCount={memberCounts[t.id] || 0}
                  onJoin={handleJoin}
                  canJoin={isLoggedIn && user?.id !== t.owner_id}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Trophy className="mx-auto h-7 w-7 text-primary" />
          <h3 className="mt-3 font-display text-2xl uppercase">Нет подходящей команды?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Создай свою команду и собери ростер мечты — без ограничений по уровню.</p>
          <button onClick={() => isLoggedIn ? setCreateOpen(true) : setAuthOpen(true)}
            className="press mt-4 rounded-lg bg-gradient-to-r from-primary to-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90">
            Создать команду
          </button>
        </div>
      </section>

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadTeams} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
