import { useEffect, useMemo, useState } from 'react'
import { Trophy, Users, MapPin, ArrowUpDown, Plus, X, Search } from 'lucide-react'
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
        rating: 1000,
        wins: 0,
      }).select().single()

      if (error) throw error

      // Add owner as first member
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

function TeamCard({ team, onJoin, canJoin }: { team: Team; onJoin: (t: Team) => void; canJoin: boolean }) {
  const initials = team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isOpen = team.status?.toLowerCase().includes('набор') || team.status?.toLowerCase().includes('ищут')
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-electric font-display text-primary-foreground shadow-soft text-sm">
          {initials}
        </div>
        <div>
          <h3 className="font-display text-base uppercase">{team.name}</h3>
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
          <div className="font-display text-sm">5</div>
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
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
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
      if (!error && data) setTeams(data)
    } catch {
      setTeams([
        { id: '1', name: 'VOID Esports', tag: 'VOID', region: 'RU', rating: 1842, wins: 124, status: 'Открыт набор', game: 's2', owner_id: 'demo', created_at: '' },
        { id: '2', name: 'NorthFrame', tag: 'NF', region: 'EU', rating: 1798, wins: 98, status: 'Полный состав', game: 's2', owner_id: 'demo', created_at: '' },
        { id: '3', name: 'Polar Wolves', tag: 'PW', region: 'RU', rating: 1721, wins: 76, status: 'Ищут IGL', game: 's2', owner_id: 'demo', created_at: '' },
        { id: '4', name: 'Echo.GG', tag: 'EGG', region: 'CIS', rating: 1689, wins: 65, status: 'Открыт набор', game: 's2', owner_id: 'demo', created_at: '' },
        { id: '5', name: 'Blue Phoenix', tag: 'BPX', region: 'RU', rating: 1610, wins: 53, status: 'Полный состав', game: 's2', owner_id: 'demo', created_at: '' },
        { id: '6', name: 'Static Wave', tag: 'SW', region: 'EU', rating: 1574, wins: 41, status: 'Ищут AWP', game: 's2', owner_id: 'demo', created_at: '' },
        { id: '7', name: 'Crimson Pact', tag: 'CP', region: 'AS', rating: 1523, wins: 38, status: 'Ищут саппорта', game: 's2', owner_id: 'demo', created_at: '' },
        { id: '8', name: 'Halo Squad', tag: 'HS', region: 'RU', rating: 1488, wins: 32, status: 'Открыт набор', game: 's2', owner_id: 'demo', created_at: '' },
      ])
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
        {/* Controls */}
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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((t, i) => (
              <div key={t.id} style={{ animationDelay: `${i * 40}ms` }}>
                <TeamCard team={t} onJoin={handleJoin} canJoin={isLoggedIn && user?.id !== t.owner_id} />
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
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
