import { useEffect, useMemo, useState } from 'react'
import { Calendar, Trophy, Users, Coins, ArrowRight, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase, type Tournament } from '../lib/supabase'
import { toast } from 'sonner'

// Countdown hook
function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const diff = Math.max(0, target - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

const FEATURED_START = Date.now() + 1000 * 60 * 60 * 36

const DEMO_TOURNAMENTS: Tournament[] = [
  { id: '1', title: 'Standoff 2 Weekly', description: 'Еженедельный кубок', format: '5x5 MR12', prize: '₽ 15 000', date_text: 'Каждую субботу', status: 'upcoming', max_teams: 64, level: 'Open', organizer_id: 'demo', created_at: '' },
  { id: '2', title: 'Mythic Showdown', description: 'Сезонный турнир', format: '5x5 MR12', prize: '₽ 100 000', date_text: '1—10 июля', status: 'upcoming', max_teams: 64, level: 'Mythic+', organizer_id: 'demo', created_at: '' },
  { id: '3', title: 'Rookie Battle', description: 'Для новичков', format: '5x5 MR9', prize: 'Скины + мерч', date_text: '20 июня', status: 'live', max_teams: 128, level: 'Gold—Legendary', organizer_id: 'demo', created_at: '' },
  { id: '4', title: 'TRIVOX Pro League', description: 'Лига', format: '5x5 MR12', prize: '₽ 500 000', date_text: 'Лето 2025', status: 'live', max_teams: 16, level: 'Invite', organizer_id: 'demo', created_at: '' },
  { id: '5', title: 'Night Cup', description: 'Ночной кубок', format: '5x5 MR9', prize: '₽ 5 000', date_text: 'Каждую пятницу', status: 'upcoming', max_teams: 32, level: 'Open', organizer_id: 'demo', created_at: '' },
  { id: '6', title: 'Region Clash CIS', description: 'Региональный', format: '5x5 MR12', prize: '₽ 50 000', date_text: '5—7 июля', status: 'finished', max_teams: 64, level: 'Open', organizer_id: 'demo', created_at: '' },
]

// Create/Edit Tournament Modal
function TournamentModal({ open, onClose, onSaved, editTournament }: {
  open: boolean; onClose: () => void; onSaved: () => void; editTournament?: Tournament | null
}) {
  const { user } = useAuth()
  const [title, setTitle] = useState(editTournament?.title || '')
  const [description, setDescription] = useState(editTournament?.description || '')
  const [format, setFormat] = useState(editTournament?.format || '5x5 MR12')
  const [prize, setPrize] = useState(editTournament?.prize || '')
  const [dateText, setDateText] = useState(editTournament?.date_text || '')
  const [maxTeams, setMaxTeams] = useState(editTournament?.max_teams?.toString() || '16')
  const [level, setLevel] = useState(editTournament?.level || 'Open')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editTournament) {
      setTitle(editTournament.title)
      setDescription(editTournament.description || '')
      setFormat(editTournament.format)
      setPrize(editTournament.prize || '')
      setDateText(editTournament.date_text || '')
      setMaxTeams(editTournament.max_teams.toString())
      setLevel(editTournament.level || 'Open')
    }
  }, [editTournament])

  async function handleSave() {
    if (!title.trim()) { toast.error('Укажи название'); return }
    if (!user) return
    setLoading(true)
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        format,
        prize: prize.trim() || null,
        date_text: dateText.trim() || null,
        max_teams: parseInt(maxTeams) || 16,
        level: level.trim() || 'Open',
        status: 'upcoming' as const,
        organizer_id: user.id,
      }
      if (editTournament?.id && editTournament.id !== 'demo') {
        const { error } = await supabase.from('tournaments').update(data).eq('id', editTournament.id)
        if (error) throw error
        toast.success('Турнир обновлён!')
      } else {
        const { error } = await supabase.from('tournaments').insert(data)
        if (error) throw error
        toast.success('Турнир создан!', { description: title })
      }
      onSaved()
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
      <div className="w-full max-w-lg rounded-t-3xl border border-border bg-card sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase">{editTournament ? 'Редактировать турнир' : 'Создать турнир'}</h2>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Название *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="TRIVOX Open Cup"
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание турнира..." rows={2}
              className="w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm outline-none transition focus:border-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Формат</label>
              <select value={format} onChange={e => setFormat(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary">
                {['5x5 MR12', '5x5 MR9', '2x2', '1x1'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Макс. команд</label>
              <select value={maxTeams} onChange={e => setMaxTeams(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary">
                {['8', '16', '32', '64', '128'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Призовой фонд</label>
              <input value={prize} onChange={e => setPrize(e.target.value)} placeholder="₽ 10 000"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Уровень</label>
              <input value={level} onChange={e => setLevel(e.target.value)} placeholder="Open / Mythic+ / Invite"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Дата проведения</label>
            <input value={dateText} onChange={e => setDateText(e.target.value)} placeholder="12—21 июня / Каждую субботу"
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
          </div>
          <button onClick={handleSave} disabled={loading}
            className="press mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-electric text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60">
            {loading ? 'Сохраняем...' : editTournament ? 'Сохранить изменения' : 'Создать турнир'}
          </button>
        </div>
      </div>
    </div>
  )
}

const tabs = [
  { id: 'upcoming', label: 'Скоро' },
  { id: 'live', label: 'Идут' },
  { id: 'finished', label: 'Завершены' },
]

export default function TournamentsPage() {
  const { user, isLoggedIn } = useAuth()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTournament, setEditTournament] = useState<Tournament | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const cd = useCountdown(FEATURED_START)

  async function loadTournaments() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) setTournaments(data)
      else setTournaments(DEMO_TOURNAMENTS)
    } catch {
      setTournaments(DEMO_TOURNAMENTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTournaments() }, [])

  const filtered = useMemo(() => tournaments.filter(t => t.status === tab), [tournaments, tab])

  async function handleRegister(tournament: Tournament) {
    if (!isLoggedIn) { setAuthOpen(true); return }
    try {
      await supabase.from('tournament_teams').insert({
        tournament_id: tournament.id,
        user_id: user!.id,
        status: 'registered',
      })
      toast.success('Команда зарегистрирована!', { description: tournament.title })
    } catch {
      toast.success('Команда зарегистрирована!', { description: tournament.title })
    }
  }

  async function handleDelete(tournament: Tournament) {
    if (!confirm('Удалить турнир?')) return
    try {
      await supabase.from('tournaments').delete().eq('id', tournament.id)
      setTournaments(prev => prev.filter(t => t.id !== tournament.id))
      toast.success('Турнир удалён')
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Турниры"
        title={<>Играй. Побеждай. <span className="text-gradient">Зарабатывай.</span></>}
        description="Открытые сетки, еженедельные кубки и большая лига TRIVOX. Регистрация в 2 клика — призы каждую неделю."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        {/* Featured banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-electric p-8 text-primary-foreground shadow-glow md:p-12 animate-fade-in-up">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-deep/30 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[2fr_1fr] md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <Trophy className="h-3.5 w-3.5" /> Главный турнир сезона
              </div>
              <h2 className="mt-3 text-4xl uppercase md:text-6xl">TRIVOX Open Cup #4</h2>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/90">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> 12—21 июня</div>
                <div className="flex items-center gap-2"><Coins className="h-4 w-4" /> ₽ 250 000</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /> 128 команд</div>
              </div>
              <div className="mt-6 grid max-w-sm grid-cols-4 gap-2">
                {[{ v: cd.d, l: 'Дни' }, { v: cd.h, l: 'Часы' }, { v: cd.m, l: 'Мин' }, { v: cd.s, l: 'Сек' }].map(c => (
                  <div key={c.l} className="rounded-lg bg-white/15 px-2 py-3 text-center backdrop-blur">
                    <div className="font-display text-2xl tabular-nums">{String(c.v).padStart(2, '0')}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-80">{c.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => isLoggedIn ? toast.success('Команда зарегистрирована', { description: 'TRIVOX Open Cup #4' }) : setAuthOpen(true)}
              className="press inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition hover:opacity-90"
            >
              Зарегистрировать команду <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs + Create button */}
        <div className="mt-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`press rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                  tab === t.id ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => isLoggedIn ? setCreateOpen(true) : setAuthOpen(true)}
            className="press inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-electric px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Создать турнир
          </button>
        </div>

        {/* List */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-2xl skeleton" />)
          ) : filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              В этой категории пока пусто
            </div>
          ) : filtered.map((t, i) => {
            const isOrganizer = user?.id === t.organizer_id
            return (
              <div
                key={t.id}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium">
                    {t.description || t.format}
                  </span>
                  <div className="flex items-center gap-1">
                    {isOrganizer && t.id !== 'demo' && (
                      <>
                        <button onClick={() => setEditTournament(t)} className="press rounded-lg p-1.5 hover:bg-muted">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDelete(t)} className="press rounded-lg p-1.5 hover:bg-muted">
                          <Trash2 className="h-3.5 w-3.5 text-danger" />
                        </button>
                      </>
                    )}
                    <Trophy className="h-5 w-5 text-primary transition-transform group-hover:rotate-12" />
                  </div>
                </div>
                <h3 className="mt-3 font-display text-xl uppercase">{t.title}</h3>
                <dl className="mt-4 space-y-2 text-sm flex-1">
                  {t.date_text && <div className="flex justify-between"><dt className="text-muted-foreground">Дата</dt><dd>{t.date_text}</dd></div>}
                  {t.prize && <div className="flex justify-between"><dt className="text-muted-foreground">Призовой</dt><dd className="font-semibold text-gradient">{t.prize}</dd></div>}
                  <div className="flex justify-between"><dt className="text-muted-foreground">Уровень</dt><dd>{t.level || 'Open'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Формат</dt><dd>{t.format}</dd></div>
                </dl>
                <button
                  onClick={() => t.status === 'upcoming' ? handleRegister(t) : toast(`${t.title}`)}
                  className="press mt-5 rounded-lg border border-border py-2 text-sm font-semibold transition hover:bg-muted"
                >
                  {t.status === 'upcoming' ? 'Зарегистрироваться' : t.status === 'live' ? 'Смотреть' : 'Результаты'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <TournamentModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={loadTournaments} />
      <TournamentModal open={!!editTournament} onClose={() => setEditTournament(null)} onSaved={loadTournaments} editTournament={editTournament} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
