import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Swords, Plus, ChevronRight, X, Clock, Pencil } from 'lucide-react'

type Props = {
  tournamentId: string
  isOrganizer: boolean
  registeredTeams: any[]
}

type Match = {
  id: string
  tournament_id: string
  team_a_id: string
  team_b_id: string
  team_a_name: string
  team_b_name: string
  status: string
  winner_id: string | null
  score_a: number
  score_b: number
  scheduled_at: string | null
  round: string | null
  map: string | null
  created_at: string
}

const ROUNDS = ['Групповой этап', '1/8 финала', '1/4 финала', '1/2 финала', 'Финал', 'Гранд-финал']
const MAPS = ['Sandstone', 'Province', 'Rust', 'Sakura', 'Zone 9', 'Siege', 'Dart']

function ScoreModal({ match, open, onClose, onSaved }: {
  match: Match | null; open: boolean; onClose: () => void; onSaved: () => void
}) {
  const [scoreA, setScoreA] = useState('0')
  const [scoreB, setScoreB] = useState('0')
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (match) {
      setScoreA(match.score_a?.toString() || '0')
      setScoreB(match.score_b?.toString() || '0')
      setStatus(match.status)
    }
  }, [match])

  async function handleSave() {
    if (!match) return
    setLoading(true)
    try {
      await supabase.from('matches').update({
        score_a: parseInt(scoreA) || 0,
        score_b: parseInt(scoreB) || 0,
        status,
      }).eq('id', match.id)
      toast.success('Счёт обновлён!')
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  if (!open || !match) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-glow">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase">Результат</h2>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-center text-sm font-semibold">
            {match.team_a_name} vs {match.team_b_name}
          </div>
          <div className="grid grid-cols-3 items-center gap-3">
            <div>
              <div className="mb-1 text-xs text-center text-muted-foreground truncate">{match.team_a_name}</div>
              <input value={scoreA} onChange={e => setScoreA(e.target.value)} type="number" min="0"
                className="h-14 w-full rounded-xl border border-border bg-muted/60 text-center text-2xl font-display outline-none transition focus:border-primary" />
            </div>
            <div className="text-center font-display text-xl text-muted-foreground">:</div>
            <div>
              <div className="mb-1 text-xs text-center text-muted-foreground truncate">{match.team_b_name}</div>
              <input value={scoreB} onChange={e => setScoreB(e.target.value)} type="number" min="0"
                className="h-14 w-full rounded-xl border border-border bg-muted/60 text-center text-2xl font-display outline-none transition focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Статус</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'pending', label: 'Скоро' },
                { value: 'live', label: '🔴 Live' },
                { value: 'finished', label: 'Завершён' },
              ].map(s => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className={`press rounded-lg border py-2 text-xs font-semibold transition ${
                    status === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="press flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">Отмена</button>
            <button onClick={handleSave} disabled={loading}
              className="press flex-1 rounded-xl bg-gradient-to-r from-primary to-electric py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition">
              {loading ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchesSection({ tournamentId, isOrganizer, registeredTeams }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [round, setRound] = useState('Групповой этап')
  const [map, setMap] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'upcoming' | 'live' | 'finished'>('upcoming')
  const [editMatch, setEditMatch] = useState<Match | null>(null)

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('scheduled_at', { ascending: true, nullsFirst: false })
    setMatches(data || [])
    setLoading(false)
  }

  useEffect(() => { loadMatches() }, [tournamentId])

  async function createMatch() {
    if (!teamA || !teamB) { toast.error('Выбери обе команды'); return }
    if (teamA === teamB) { toast.error('Команды должны быть разными'); return }
    setCreating(true)
    try {
      const tA = registeredTeams.find(t => t.team_id === teamA)
      const tB = registeredTeams.find(t => t.team_id === teamB)
      await supabase.from('matches').insert({
        tournament_id: tournamentId,
        team_a_id: teamA,
        team_b_id: teamB,
        team_a_name: tA?.teams?.name || 'Команда A',
        team_b_name: tB?.teams?.name || 'Команда B',
        status: 'pending',
        score_a: 0,
        score_b: 0,
        round: round || null,
        map: map || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      toast.success('Матч создан!')
      setShowForm(false)
      setTeamA(''); setTeamB(''); setMap(''); setScheduledAt('')
      loadMatches()
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(matchId: string) {
    if (!confirm('Удалить матч?')) return
    await supabase.from('matches').delete().eq('id', matchId)
    setMatches(prev => prev.filter(m => m.id !== matchId))
    toast.success('Матч удалён')
  }

  function formatDate(dt: string | null) {
    if (!dt) return null
    const d = new Date(dt)
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }) + ' · ' +
      d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
  }

  const statusColor = (s: string) => ({
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    maps_selected: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    live: 'bg-green-500/10 text-green-600 border-green-500/20',
    finished: 'bg-muted text-muted-foreground border-border',
  }[s] || 'bg-muted text-muted-foreground border-border')

  const statusLabel = (s: string) => ({
    pending: 'Скоро',
    maps_selected: 'Карты выбраны',
    live: '🔴 Live',
    finished: 'Завершён',
  }[s] || s)

  // Filter by tab
  const upcoming = matches.filter(m => m.status === 'pending' || m.status === 'maps_selected')
  const live = matches.filter(m => m.status === 'live')
  const finished = matches.filter(m => m.status === 'finished')
  const tabData = tab === 'upcoming' ? upcoming : tab === 'live' ? live : finished

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg uppercase flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" /> Расписание матчей
        </h2>
        {isOrganizer && (
          <button onClick={() => setShowForm(v => !v)}
            className="press flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Создать матч
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1 mb-4">
        {[
          { id: 'upcoming', label: 'Скоро', count: upcoming.length },
          { id: 'live', label: '🔴 Live', count: live.length },
          { id: 'finished', label: 'Завершены', count: finished.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`press flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${
                tab === t.id ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/20 text-muted-foreground'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && isOrganizer && (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Команда A *</label>
              <select value={teamA} onChange={e => setTeamA(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary">
                <option value="">Выбери...</option>
                {registeredTeams.map(t => (
                  <option key={t.team_id} value={t.team_id}>{t.teams?.name || t.team_id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Команда B *</label>
              <select value={teamB} onChange={e => setTeamB(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary">
                <option value="">Выбери...</option>
                {registeredTeams.map(t => (
                  <option key={t.team_id} value={t.team_id}>{t.teams?.name || t.team_id}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Раунд</label>
              <select value={round} onChange={e => setRound(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary">
                {ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Карта</label>
              <select value={map} onChange={e => setMap(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary">
                <option value="">Не выбрана</option>
                {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Дата и время</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary [color-scheme:dark]" />
          </div>

          <button onClick={createMatch} disabled={creating}
            className="press w-full rounded-xl bg-gradient-to-r from-primary to-electric py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {creating ? 'Создаём...' : 'Создать матч'}
          </button>
        </div>
      )}

      {/* Matches */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl skeleton" />)}
        </div>
      ) : tabData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === 'upcoming' ? 'Нет запланированных матчей' : tab === 'live' ? 'Нет матчей в прямом эфире' : 'Нет завершённых матчей'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tabData.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 hover:border-primary/30 transition">
              <div className="flex-1 min-w-0">
                {m.round && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{m.round}</div>
                )}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className={`truncate max-w-[110px] ${m.status === 'finished' && m.score_a > m.score_b ? 'text-primary' : ''}`}>
                    {m.team_a_name}
                  </span>
                  <div className={`flex-shrink-0 rounded-lg px-2.5 py-0.5 text-sm font-display ${
                    m.status === 'finished' ? 'bg-muted/60' :
                    m.status === 'live' ? 'bg-green-500/10 border border-green-500/20 text-green-600' :
                    'bg-muted/40 text-muted-foreground'
                  }`}>
                    {m.status === 'pending' || m.status === 'maps_selected'
                      ? 'vs'
                      : `${m.score_a} : ${m.score_b}`
                    }
                  </div>
                  <span className={`truncate max-w-[110px] ${m.status === 'finished' && m.score_b > m.score_a ? 'text-primary' : ''}`}>
                    {m.team_b_name}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {m.scheduled_at && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(m.scheduled_at)}</span>
                  )}
                  {m.map && <span>🗺 {m.map}</span>}
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(m.status)}`}>
                    {statusLabel(m.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {isOrganizer && (
                  <>
                    <button onClick={() => setEditMatch(m)}
                      className="press grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted transition">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(m.id)}
                      className="press grid h-8 w-8 place-items-center rounded-lg border border-danger/20 text-danger hover:bg-danger/10 transition">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate(`/tournaments/${tournamentId}/match/${m.id}/banpick`)}
                  className="press flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
                >
                  {m.status === 'pending' ? 'Бан-пик' : 'Смотреть'} <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScoreModal match={editMatch} open={!!editMatch} onClose={() => setEditMatch(null)} onSaved={loadMatches} />
    </div>
  )
}
