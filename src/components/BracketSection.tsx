import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Trophy, Zap, X } from 'lucide-react'

type Match = {
  id: string
  tournament_id: string
  team_a_id: string | null
  team_b_id: string | null
  team_a_name: string
  team_b_name: string
  score_a: number
  score_b: number
  status: string
  winner_id: string | null
  bracket_round: number
  bracket_position: number
  next_match_id: string | null
}

type Props = {
  tournamentId: string
  isOrganizer: boolean
  registeredTeams: any[]
}

const ROUND_NAMES: Record<number, string> = {
  1: 'Финал',
  2: 'Полуфинал',
  4: 'Четвертьфинал',
  8: '1/8 финала',
  16: '1/16 финала',
}

function getRoundName(totalRounds: number, roundIndex: number) {
  const matchesInRound = Math.pow(2, roundIndex)
  return ROUND_NAMES[matchesInRound] || `Раунд ${roundIndex + 1}`
}

function ScoreModal({ match, open, onClose, onSaved }: {
  match: Match | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [scoreA, setScoreA] = useState('0')
  const [scoreB, setScoreB] = useState('0')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (match) {
      setScoreA(match.score_a?.toString() || '0')
      setScoreB(match.score_b?.toString() || '0')
    }
  }, [match])

  async function handleSave() {
    if (!match) return
    const sa = parseInt(scoreA) || 0
    const sb = parseInt(scoreB) || 0
    if (sa === sb) { toast.error('Ничья недопустима в плей-офф!'); return }

    setLoading(true)
    try {
      const winnerId = sa > sb ? match.team_a_id : match.team_b_id
      const winnerName = sa > sb ? match.team_a_name : match.team_b_name

      // Update current match
      await supabase.from('matches').update({
        score_a: sa,
        score_b: sb,
        status: 'finished',
        winner_id: winnerId,
      }).eq('id', match.id)

      // Advance winner to next match
      if (match.next_match_id && winnerId) {
        const { data: nextMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('id', match.next_match_id)
          .single()

        if (nextMatch) {
          // Determine if winner goes to slot A or B based on position
          const isSlotA = match.bracket_position % 2 === 1
          await supabase.from('matches').update(
            isSlotA
              ? { team_a_id: winnerId, team_a_name: winnerName }
              : { team_b_id: winnerId, team_b_name: winnerName }
          ).eq('id', match.next_match_id)
        }
      }

      toast.success('Счёт сохранён! Победитель продвинут в следующий раунд.')
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  if (!open || !match) return null
  const canPlay = match.team_a_name && match.team_b_name && match.team_a_name !== 'TBD' && match.team_b_name !== 'TBD'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-glow animate-scale-in">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase">Результат матча</h2>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!canPlay ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Ожидаем победителей предыдущих матчей
            </div>
          ) : (
            <>
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
              <p className="text-xs text-center text-muted-foreground">Победитель автоматически перейдёт в следующий раунд</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="press flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">Отмена</button>
                <button onClick={handleSave} disabled={loading}
                  className="press flex-1 rounded-xl bg-gradient-to-r from-primary to-electric py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition">
                  {loading ? '...' : 'Сохранить'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, isOrganizer, onClick }: {
  match: Match
  isOrganizer: boolean
  onClick: () => void
}) {
  const isFinished = match.status === 'finished'
  const canPlay = match.team_a_name && match.team_b_name &&
    match.team_a_name !== 'TBD' && match.team_b_name !== 'TBD'
  const aWon = isFinished && match.score_a > match.score_b
  const bWon = isFinished && match.score_b > match.score_a

  return (
    <div
      onClick={isOrganizer && canPlay ? onClick : undefined}
      className={`w-36 rounded-xl border bg-card overflow-hidden transition ${
        isOrganizer && canPlay && !isFinished
          ? 'border-primary/30 cursor-pointer hover:border-primary hover:shadow-glow'
          : isFinished
          ? 'border-border opacity-90'
          : 'border-border/50 opacity-60'
      }`}
    >
      {/* Team A */}
      <div className={`flex items-center justify-between px-2.5 py-2 border-b border-border ${aWon ? 'bg-primary/10' : ''}`}>
        <span className={`text-xs font-semibold truncate max-w-[80px] ${aWon ? 'text-primary' : 'text-foreground'}`}>
          {match.team_a_name || 'TBD'}
        </span>
        {isFinished && (
          <span className={`text-xs font-display font-bold ml-1 ${aWon ? 'text-primary' : 'text-muted-foreground'}`}>
            {match.score_a}
          </span>
        )}
      </div>
      {/* Team B */}
      <div className={`flex items-center justify-between px-2.5 py-2 ${bWon ? 'bg-primary/10' : ''}`}>
        <span className={`text-xs font-semibold truncate max-w-[80px] ${bWon ? 'text-primary' : 'text-foreground'}`}>
          {match.team_b_name || 'TBD'}
        </span>
        {isFinished && (
          <span className={`text-xs font-display font-bold ml-1 ${bWon ? 'text-primary' : 'text-muted-foreground'}`}>
            {match.score_b}
          </span>
        )}
      </div>
    </div>
  )
}

export function BracketSection({ tournamentId, isOrganizer, registeredTeams }: Props) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editMatch, setEditMatch] = useState<Match | null>(null)

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .not('bracket_round', 'is', null)
      .order('bracket_round', { ascending: false })
      .order('bracket_position', { ascending: true })
    setMatches(data || [])
    setLoading(false)
  }

  useEffect(() => { loadMatches() }, [tournamentId])

  async function generateBracket() {
    const count = registeredTeams.length
    if (count < 4) { toast.error('Нужно минимум 4 команды'); return }
    if (![4, 8, 16, 32].includes(count)) {
      toast.error(`Поддерживается 4, 8, 16 или 32 команды. Сейчас: ${count}`)
      return
    }

    if (!confirm(`Сгенерировать сетку для ${count} команд? Существующие матчи сетки будут удалены.`)) return

    setGenerating(true)
    try {
      // Delete existing bracket matches
      await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId)
        .not('bracket_round', 'is', null)

      // Shuffle teams
      const teams = [...registeredTeams].sort(() => Math.random() - 0.5)
      const totalRounds = Math.log2(count)

      // Create all matches round by round
      // Round totalRounds = first round (most matches)
      // Round 1 = final

      type MatchInsert = {
        tournament_id: string
        team_a_id: string | null
        team_b_id: string | null
        team_a_name: string
        team_b_name: string
        score_a: number
        score_b: number
        status: string
        bracket_round: number
        bracket_position: number
        next_match_id: string | null
        round: string
      }

      // Create matches from final backwards
      const allMatches: MatchInsert[] = []

      // Create empty matches for all rounds
      for (let r = 1; r <= totalRounds; r++) {
        const matchesInRound = Math.pow(2, r - 1)
        const roundName = ROUND_NAMES[matchesInRound] || `Раунд ${r}`
        for (let p = 1; p <= matchesInRound; p++) {
          allMatches.push({
            tournament_id: tournamentId,
            team_a_id: null,
            team_b_id: null,
            team_a_name: 'TBD',
            team_b_name: 'TBD',
            score_a: 0,
            score_b: 0,
            status: 'pending',
            bracket_round: r,
            bracket_position: p,
            next_match_id: null,
            round: roundName,
          })
        }
      }

      // Insert all matches
      const { data: inserted } = await supabase
        .from('matches')
        .insert(allMatches)
        .select()

      if (!inserted) throw new Error('Failed to insert matches')

      // Set next_match_id links
      for (const match of inserted) {
        if (match.bracket_round > 1) {
          const nextPos = Math.ceil(match.bracket_position / 2)
          const nextMatch = inserted.find(
            m => m.bracket_round === match.bracket_round - 1 && m.bracket_position === nextPos
          )
          if (nextMatch) {
            await supabase
              .from('matches')
              .update({ next_match_id: nextMatch.id })
              .eq('id', match.id)
          }
        }
      }

      // Fill first round with teams
      const firstRoundMatches = inserted
        .filter(m => m.bracket_round === totalRounds)
        .sort((a, b) => a.bracket_position - b.bracket_position)

      for (let i = 0; i < firstRoundMatches.length; i++) {
        const m = firstRoundMatches[i]
        const teamA = teams[i * 2]
        const teamB = teams[i * 2 + 1]
        await supabase.from('matches').update({
          team_a_id: teamA?.team_id || null,
          team_a_name: teamA?.teams?.name || 'TBD',
          team_b_id: teamB?.team_id || null,
          team_b_name: teamB?.teams?.name || 'TBD',
          status: 'pending',
        }).eq('id', m.id)
      }

      toast.success(`Сетка сгенерирована для ${count} команд!`)
      loadMatches()
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setGenerating(false)
    }
  }

  // Group matches by round
  const rounds = matches.reduce((acc, m) => {
    if (!acc[m.bracket_round]) acc[m.bracket_round] = []
    acc[m.bracket_round].push(m)
    return acc
  }, {} as Record<number, Match[]>)

  const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => b - a)
  const totalRounds = roundKeys.length

  const hasBracket = matches.length > 0

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg uppercase flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Турнирная сетка
        </h2>
        {isOrganizer && (
          <button
            onClick={generateBracket}
            disabled={generating || registeredTeams.length < 4}
            className="press flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {generating ? 'Генерируем...' : hasBracket ? 'Пересгенерировать' : 'Сгенерировать сетку'}
          </button>
        )}
      </div>

      {!hasBracket && !loading ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {registeredTeams.length < 4
              ? `Нужно минимум 4 команды (сейчас ${registeredTeams.length})`
              : isOrganizer
              ? 'Нажми "Сгенерировать сетку" чтобы создать плей-офф'
              : 'Сетка ещё не создана'
            }
          </p>
        </div>
      ) : loading ? (
        <div className="h-32 rounded-xl skeleton" />
      ) : (
        <>
          {isOrganizer && (
            <p className="text-xs text-muted-foreground mb-4">
              Нажми на матч чтобы ввести счёт — победитель автоматически перейдёт дальше
            </p>
          )}

          {/* Bracket visual */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {roundKeys.map((roundKey, roundIdx) => {
                const roundMatches = rounds[roundKey].sort((a, b) => a.bracket_position - b.bracket_position)
                const roundName = getRoundName(totalRounds, roundIdx)

                return (
                  <div key={roundKey} className="flex flex-col">
                    {/* Round header */}
                    <div className="mb-3 text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1">
                        {roundName}
                      </span>
                    </div>

                    {/* Matches */}
                    <div
                      className="flex flex-col justify-around flex-1"
                      style={{ gap: `${Math.pow(2, roundIdx) * 12}px` }}
                    >
                      {roundMatches.map(match => (
                        <div key={match.id} className="flex items-center">
                          <MatchCard
                            match={match}
                            isOrganizer={isOrganizer}
                            onClick={() => setEditMatch(match)}
                          />
                          {/* Connector line */}
                          {roundIdx < roundKeys.length - 1 && (
                            <div className="w-8 h-px bg-border ml-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Champion */}
              {roundKeys.length > 0 && (() => {
                const finalMatch = rounds[1]?.[0]
                const champion = finalMatch?.status === 'finished'
                  ? (finalMatch.score_a > finalMatch.score_b ? finalMatch.team_a_name : finalMatch.team_b_name)
                  : null
                return champion ? (
                  <div className="flex flex-col items-center justify-center pl-4">
                    <div className="mb-3 text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 rounded-full px-3 py-1">
                        Победитель
                      </span>
                    </div>
                    <div className="w-36 rounded-xl border-2 border-yellow-500/40 bg-yellow-500/10 p-3 text-center">
                      <Trophy className="mx-auto h-5 w-5 text-yellow-500 mb-1" />
                      <div className="text-sm font-bold text-yellow-600">{champion}</div>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        </>
      )}

      <ScoreModal
        match={editMatch}
        open={!!editMatch}
        onClose={() => setEditMatch(null)}
        onSaved={loadMatches}
      />
    </div>
  )
}
