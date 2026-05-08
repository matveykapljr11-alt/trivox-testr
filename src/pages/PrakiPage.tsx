import { useEffect, useMemo, useState } from 'react'
import { Search, Filter, Clock, Users, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase, type Scrim } from '../lib/supabase'
import { toast } from 'sonner'

// Rank options
const RANKS = ['Любой', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legendary', 'Mythic I', 'Mythic II', 'Champion']
const MAPS = ['Sandstone', 'Province', 'Rust', 'Sakura', 'Zone 9', 'Siege']
const FORMATS = ['5x5 / MR12', '5x5 / MR9', '2x2', '1x1']

const chips = [
  { id: 'all', label: 'Все' },
  { id: 'today', label: 'Сегодня' },
  { id: 'mr12', label: 'MR12' },
  { id: 'mr9', label: 'MR9' },
]

// Create Scrim Modal
function CreateScrimModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth()
  const [teamName, setTeamName] = useState('')
  const [rank, setRank] = useState('Mythic I')
  const [format, setFormat] = useState('5x5 / MR12')
  const [selectedMaps, setSelectedMaps] = useState<string[]>([])
  const [timeText, setTimeText] = useState('')
  const [discord, setDiscord] = useState('')
  const [telegram, setTelegram] = useState(user?.telegram || '')
  const [loading, setLoading] = useState(false)

  // Preview
  const preview = {
    team_name: teamName || 'Название команды',
    rank,
    format,
    maps: selectedMaps.length ? selectedMaps : ['—'],
    time_text: timeText || 'Время не указано',
  }

  function toggleMap(map: string) {
    setSelectedMaps(prev => prev.includes(map) ? prev.filter(m => m !== map) : [...prev, map])
  }

  async function handleCreate() {
    if (!teamName.trim()) { toast.error('Укажи название команды'); return }
    if (!timeText.trim()) { toast.error('Укажи время прака'); return }
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase.from('scrims').insert({
        team_name: teamName.trim(),
        rank,
        format,
        maps: selectedMaps,
        time_text: timeText.trim(),
        time_raw: new Date().toISOString(),
        status: 'open',
        user_id: user.id,
        discord: discord.trim() || null,
        telegram: telegram.trim() || null,
      })
      if (error) throw error
      toast.success('Прак создан!', { description: 'Лобби открыто, ждём соперников' })
      onCreated()
      onClose()
    } catch (e: any) {
      toast.error('Ошибка создания прака: ' + (e.message || ''))
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
      <div className="w-full max-w-lg rounded-t-3xl border border-border bg-card sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase">Создать прак</h2>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {/* Preview */}
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Превью карточки</div>
          <div className="rounded-xl border border-primary/20 bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-base uppercase">{preview.team_name}</div>
                <div className="mt-1 inline-flex rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs">{preview.rank}</div>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-electric/15 font-display text-sm text-primary">
                {(preview.team_name[0] || 'T').toUpperCase()}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{preview.format}</div>
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{preview.time_text}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {preview.maps.map(m => (
                <span key={m} className="rounded-md bg-accent/60 px-2 py-0.5 text-xs">{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Название команды *</label>
            <input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Твоя команда"
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Формат</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`press rounded-xl border py-2.5 text-sm font-medium transition ${
                    format === f ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ранг</label>
            <select
              value={rank}
              onChange={e => setRank(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
            >
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Карты</label>
            <div className="flex flex-wrap gap-2">
              {MAPS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMap(m)}
                  className={`press rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selectedMaps.includes(m)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Время прака *</label>
            <input
              value={timeText}
              onChange={e => setTimeText(e.target.value)}
              placeholder="Сегодня, 21:00 / Завтра, 19:30"
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discord</label>
              <input
                value={discord}
                onChange={e => setDiscord(e.target.value)}
                placeholder="ник#0000"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
              />
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
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="press mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-electric text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Создаём...' : 'Опубликовать прак'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Scrim Card
function ScrimCard({ scrim, onChallenge, onCancel, isOwner }: {
  scrim: Scrim
  onChallenge: (s: Scrim) => void
  onCancel: (s: Scrim) => void
  isOwner: boolean
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg uppercase tracking-tight">{scrim.team_name}</h3>
          <div className="mt-1 inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs">
            {scrim.rank}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {scrim.status === 'pending' && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-600">
              <AlertTriangle className="h-3 w-3" /> Ждём
            </span>
          )}
          {scrim.status === 'confirmed' && (
            <span className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-600">
              <CheckCircle className="h-3 w-3" /> Подтверждён
            </span>
          )}
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-electric/15 font-display text-primary transition-transform group-hover:scale-110">
            {scrim.team_name[0]?.toUpperCase()}
          </div>
        </div>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> {scrim.format}</div>
        <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {scrim.time_text}</div>
      </dl>
      {scrim.maps?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {scrim.maps.map(map => (
            <span key={map} className="rounded-md bg-accent/60 px-2 py-1 text-xs font-medium text-accent-foreground">{map}</span>
          ))}
        </div>
      )}
      {isOwner ? (
        <button
          onClick={() => onCancel(scrim)}
          className="press mt-5 w-full rounded-lg border border-danger/30 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
        >
          Отменить прак
        </button>
      ) : (
        <button
          onClick={() => onChallenge(scrim)}
          disabled={scrim.status !== 'open'}
          className="press mt-5 w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-40"
        >
          {scrim.status === 'open' ? 'Подать заявку' : 'Недоступно'}
        </button>
      )}
    </div>
  )
}

// Challenge Modal (preview before confirm)
function ChallengeModal({ scrim, open, onClose, onConfirm }: {
  scrim: Scrim | null; open: boolean; onClose: () => void; onConfirm: () => void
}) {
  if (!open || !scrim) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-glow animate-scale-in">
        <h3 className="font-display text-xl uppercase">Подтвердить заявку</h3>
        <p className="mt-1 text-sm text-muted-foreground">Ты подаёшь заявку на матч:</p>
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Команда</span><span className="font-semibold">{scrim.team_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Ранг</span><span>{scrim.rank}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Формат</span><span>{scrim.format}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Время</span><span>{scrim.time_text}</span></div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">После подтверждения команда получит уведомление и свяжется с тобой в Discord/Telegram.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="press flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">Отмена</button>
          <button onClick={onConfirm} className="press flex-1 rounded-xl bg-gradient-to-r from-primary to-electric py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
            Подать заявку
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PrakiPage() {
  const { user, isLoggedIn } = useAuth()
  const [scrims, setScrims] = useState<Scrim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [challengeScrim, setChallengeScrim] = useState<Scrim | null>(null)

  async function loadScrims() {
    setLoading(true)
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('scrims')
        .select('*')
        .neq('status', 'cancelled')
        .gt('created_at', cutoff)
        .order('created_at', { ascending: false })
      if (!error && data) setScrims(data)
    } catch (e) {
      // Fallback demo data
      setScrims([
        { id: '1', team_name: 'VOID Esports', rank: 'Mythic II', format: '5x5 / MR12', maps: ['Sandstone', 'Province'], time_text: 'Сегодня, 21:00', status: 'open', user_id: 'demo', created_at: new Date().toISOString() },
        { id: '2', team_name: 'NorthFrame', rank: 'Legendary', format: '5x5 / MR12', maps: ['Rust', 'Sakura'], time_text: 'Сегодня, 22:30', status: 'open', user_id: 'demo', created_at: new Date().toISOString() },
        { id: '3', team_name: 'Polar Wolves', rank: 'Mythic I', format: '5x5 / MR9', maps: ['Zone 9'], time_text: 'Завтра, 19:00', status: 'open', user_id: 'demo', created_at: new Date().toISOString() },
        { id: '4', team_name: 'Echo.GG', rank: 'Champion', format: '5x5 / MR12', maps: ['Sandstone', 'Rust'], time_text: 'Завтра, 20:00', status: 'open', user_id: 'demo', created_at: new Date().toISOString() },
        { id: '5', team_name: 'Blue Phoenix', rank: 'Mythic II', format: '5x5 / MR12', maps: ['Province'], time_text: 'Пт, 21:30', status: 'open', user_id: 'demo', created_at: new Date().toISOString() },
        { id: '6', team_name: 'Static Wave', rank: 'Legendary', format: '5x5 / MR9', maps: ['Sakura', 'Rust'], time_text: 'Сб, 18:00', status: 'open', user_id: 'demo', created_at: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadScrims() }, [])

  const filtered = useMemo(() => {
    return scrims.filter(m => {
      if (filter === 'mr12') return m.format.includes('MR12')
      if (filter === 'mr9') return m.format.includes('MR9')
      if (filter === 'today') {
        const created = new Date(m.created_at)
        return Date.now() - created.getTime() < 8 * 60 * 60 * 1000
      }
      return true
    }).filter(m =>
      !q || m.team_name.toLowerCase().includes(q.toLowerCase()) ||
      m.maps?.some(x => x.toLowerCase().includes(q.toLowerCase()))
    )
  }, [scrims, filter, q])

  async function handleChallenge(scrim: Scrim) {
    if (!isLoggedIn) { setAuthOpen(true); return }
    setChallengeScrim(scrim)
  }

  async function confirmChallenge() {
    if (!challengeScrim || !user) return
    try {
      await supabase.from('scrim_challenges').insert({
        scrim_id: challengeScrim.id,
        challenger_id: user.id,
        challenger_name: user.name,
        status: 'pending',
      })
      await supabase.from('scrims').update({ status: 'pending' }).eq('id', challengeScrim.id)
      setScrims(prev => prev.map(s => s.id === challengeScrim.id ? { ...s, status: 'pending' } : s))
      toast.success(`Заявка на матч с ${challengeScrim.team_name} отправлена!`)
    } catch {
      toast.error('Ошибка отправки заявки')
    } finally {
      setChallengeScrim(null)
    }
  }

  async function handleCancel(scrim: Scrim) {
    try {
      await supabase.from('scrims').delete().eq('id', scrim.id)
      setScrims(prev => prev.filter(s => s.id !== scrim.id))
      toast.success('Прак отменён')
    } catch {
      toast.error('Ошибка отмены прака')
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Праки"
        title={<>Найди матч <span className="text-gradient">за минуту</span></>}
        description="Открытые лобби по Standoff 2. Фильтруй по рангу, формату, картам и времени — присоединяйся в один клик."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Поиск по команде, карте..."
              className="h-12 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button className="press inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-muted">
            <Filter className="h-4 w-4" /> Фильтры
          </button>
          <button
            onClick={() => isLoggedIn ? setCreateOpen(true) : setAuthOpen(true)}
            className="press inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-electric px-5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Создать прак
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`press rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === c.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <h3 className="font-display text-xl uppercase">Праков нет</h3>
            <p className="mt-2 text-sm text-muted-foreground">Попробуй другие фильтры или создай свой прак.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((scrim, i) => (
              <div key={scrim.id} style={{ animationDelay: `${i * 50}ms` }}>
                <ScrimCard
                  scrim={scrim}
                  onChallenge={handleChallenge}
                  onCancel={handleCancel}
                  isOwner={user?.id === scrim.user_id}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <CreateScrimModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadScrims} />
      <ChallengeModal scrim={challengeScrim} open={!!challengeScrim} onClose={() => setChallengeScrim(null)} onConfirm={confirmChallenge} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
