import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Swords, Plus, ChevronRight } from 'lucide-react'

type Props = {
  tournamentId: string
  isOrganizer: boolean
  registeredTeams: any[]
}

export function MatchesSection({ tournamentId, isOrganizer, registeredTeams }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
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
      const { data: m } = await supabase.from('matches').insert({
        tournament_id: tournamentId,
        team_a_id: teamA,
        team_b_id: teamB,
        team_a_name: tA?.teams?.name || 'Команда A',
        team_b_name: tB?.teams?.name || 'Команда B',
        status: 'pending',
      }).select().single()
      toast.success('Матч создан!')
      setShowForm(false)
      setTeamA(''); setTeamB('')
      loadMatches()
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setCreating(false)
    }
  }

  const statusLabel = (s: string) => ({
    pending: 'Ожидает',
    maps_selected: 'Карты выбраны',
    live: 'Идёт',
    finished: 'Завершён',
  }[s] || s)

  const statusColor = (s: string) => ({
    pending: 'bg-yellow-500/10 text-yellow-600',
    maps_selected: 'bg-blue-500/10 text-blue-600',
    live: 'bg-green-500/10 text-green-600',
    finished: 'bg-muted text-muted-foreground',
  }[s] || 'bg-muted text-muted-foreground')

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg uppercase flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" /> Матчи ({matches.length})
        </h2>
        {isOrganizer && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="press flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Создать матч
          </button>
        )}
      </div>

      {/* Create match form */}
      {showForm && isOrganizer && (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Команда A</label>
              <select value={teamA} onChange={e => setTeamA(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary">
                <option value="">Выбери команду</option>
                {registeredTeams.map(t => (
                  <option key={t.team_id} value={t.team_id}>{t.teams?.name || t.team_id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Команда B</label>
              <select value={teamB} onChange={e => setTeamB(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary">
                <option value="">Выбери команду</option>
                {registeredTeams.map(t => (
                  <option key={t.team_id} value={t.team_id}>{t.teams?.name || t.team_id}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={createMatch} disabled={creating}
            className="press w-full rounded-xl bg-gradient-to-r from-primary to-electric py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {creating ? 'Создаём...' : 'Создать матч'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-16 rounded-xl skeleton" />)}
        </div>
      ) : matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Матчи ещё не созданы</p>
      ) : (
        <div className="space-y-2">
          {matches.map(m => {
            const hasBanPick = m.status !== 'pending'
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-primary truncate">{m.team_a_name}</span>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <span className="text-orange-500 truncate">{m.team_b_name}</span>
                  </div>
                  {m.status === 'maps_selected' && (
                    <div className="text-xs text-muted-foreground mt-0.5">Карты выбраны</div>
                  )}
                </div>
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${statusColor(m.status)}`}>
                  {statusLabel(m.status)}
                </span>
                <button
                  onClick={() => navigate(`/tournaments/${tournamentId}/match/${m.id}/banpick`)}
                  className="press flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
                >
                  {m.status === 'pending' ? 'Бан-пик' : 'Смотреть'} <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
