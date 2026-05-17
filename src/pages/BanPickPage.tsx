import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft, Shield, Trophy, Clock } from 'lucide-react'

const MAPS = ['Sandstone', 'Province', 'Rust', 'Sakura', 'Zone 9', 'Siege', 'Peak']

// BO1: A ban, B ban, A ban, B ban, A ban, B ban → last map plays
// BO3: A ban, B ban, A pick, B pick, A ban, B ban → last map = decider
const BO1_SEQUENCE = [
  { action: 'ban', team: 'a' },
  { action: 'ban', team: 'b' },
  { action: 'ban', team: 'a' },
  { action: 'ban', team: 'b' },
  { action: 'ban', team: 'a' },
  { action: 'ban', team: 'b' },
]

const BO3_SEQUENCE = [
  { action: 'ban',  team: 'a' },
  { action: 'ban',  team: 'b' },
  { action: 'pick', team: 'a' },
  { action: 'pick', team: 'b' },
  { action: 'ban',  team: 'a' },
  { action: 'ban',  team: 'b' },
]

type BanPickEntry = { map: string; action: 'ban' | 'pick'; team: 'a' | 'b' }

export default function BanPickPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [match, setMatch] = useState<any>(null)
  const [banpick, setBanpick] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [format, setFormat] = useState<'bo1' | 'bo3'>('bo1')
  const pollingRef = useRef<any>(null)

  async function loadData() {
    if (!matchId) return
    try {
      const { data: m } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
      if (m) setMatch(m)

      const { data: bp } = await supabase
        .from('banpick')
        .select('*')
        .eq('match_id', matchId)
        .single()

      if (bp) {
        setBanpick(bp)
        setFormat(bp.format as 'bo1' | 'bo3')
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    pollingRef.current = setInterval(loadData, 3000)
    return () => clearInterval(pollingRef.current)
  }, [matchId])

  async function startBanPick(fmt: 'bo1' | 'bo3') {
    if (!match || !matchId) return
    try {
      const { data: existing } = await supabase
        .from('banpick')
        .select('id')
        .eq('match_id', matchId)
        .single()

      if (existing) {
        toast.error('Бан-пик уже начат')
        return
      }

      const { data: bp } = await supabase
        .from('banpick')
        .insert({
          match_id: matchId,
          tournament_id: match.tournament_id,
          format: fmt,
          bans: [],
          picks: [],
          step: 0,
          current_turn: 'a',
          team_a_id: match.team_a_id,
          team_b_id: match.team_b_id,
          team_a_name: match.team_a_name,
          team_b_name: match.team_b_name,
          result_maps: [],
          status: 'in_progress',
        })
        .select()
        .single()

      if (bp) {
        setBanpick(bp)
        setFormat(fmt)
        toast.success('Бан-пик начат!')
      }
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    }
  }

  async function handleMapAction(map: string) {
    if (!banpick || acting) return
    const sequence = format === 'bo1' ? BO1_SEQUENCE : BO3_SEQUENCE
    const step = banpick.step

    if (step >= sequence.length) return

    const current = sequence[step]

    // Check whose turn
    const myTeam = user?.id === banpick.team_a_id ? 'a' : user?.id === banpick.team_b_id ? 'b' : null
    if (!myTeam) { toast.error('Ты не участник этого матча'); return }
    if (myTeam !== current.team) { toast.error('Сейчас не твой ход!'); return }

    // Check map not already used
    const usedMaps = [...(banpick.bans || []), ...(banpick.picks || [])].map((e: any) => e.map)
    if (usedMaps.includes(map)) { toast.error('Эта карта уже использована'); return }

    setActing(true)
    try {
      const entry: BanPickEntry = { map, action: current.action, team: current.team }
      const newBans = current.action === 'ban' ? [...(banpick.bans || []), entry] : banpick.bans || []
      const newPicks = current.action === 'pick' ? [...(banpick.picks || []), entry] : banpick.picks || []
      const newStep = step + 1
      const nextTurn = sequence[newStep]?.team || banpick.current_turn

      // Check if done
      const isDone = newStep >= sequence.length
      let resultMaps: any[] = newPicks.length > 0 ? newPicks.map((p: any) => p.map) : []

      if (isDone) {
        // Last remaining map is the final/decider
        const allUsed = [...newBans, ...newPicks].map((e: any) => e.map)
        const remaining = MAPS.filter(m => !allUsed.includes(m))
        if (remaining.length > 0) resultMaps = [...resultMaps, remaining[0]]
      }

      const updates: any = {
        bans: newBans,
        picks: newPicks,
        step: newStep,
        current_turn: nextTurn,
      }

      if (isDone) {
        updates.result_maps = resultMaps
        updates.status = 'completed'
        // Save to match
        await supabase.from('matches').update({ status: 'maps_selected' }).eq('id', matchId)
      }

      await supabase.from('banpick').update(updates).eq('id', banpick.id)
      await loadData()

      if (isDone) {
        toast.success('Бан-пик завершён!', { description: `Карты: ${resultMaps.join(', ')}` })
      } else {
        toast.success(current.action === 'ban' ? `Забанена карта ${map}` : `Запикана карта ${map}`)
      }
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
          <div className="h-8 w-32 rounded-lg skeleton" />
          <div className="h-64 rounded-2xl skeleton" />
        </div>
      </PageShell>
    )
  }

  if (!match) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="font-display text-2xl uppercase">Матч не найден</h2>
          <button onClick={() => navigate(-1)} className="press mt-4 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">← Назад</button>
        </div>
      </PageShell>
    )
  }

  const sequence = format === 'bo1' ? BO1_SEQUENCE : BO3_SEQUENCE
  const step = banpick?.step || 0
  const currentStep = sequence[step]
  const myTeam = user?.id === banpick?.team_a_id ? 'a' : user?.id === banpick?.team_b_id ? 'b' : null
  const isMyTurn = myTeam === currentStep?.team
  const isDone = banpick?.status === 'completed'

  const usedMaps = banpick ? [...(banpick.bans || []), ...(banpick.picks || [])] : []
  const usedMapNames = usedMaps.map((e: any) => e.map)

  const teamAColor = 'text-primary'
  const teamBColor = 'text-orange-500'

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 space-y-6">

        <button onClick={() => navigate(-1)} className="press inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {/* Match header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className={`font-display text-xl uppercase ${teamAColor}`}>{match.team_a_name || 'Команда A'}</div>
              <div className="text-xs text-muted-foreground mt-1">Команда A</div>
            </div>
            <div className="px-4">
              <div className="font-display text-2xl text-muted-foreground">VS</div>
            </div>
            <div className="text-center flex-1">
              <div className={`font-display text-xl uppercase ${teamBColor}`}>{match.team_b_name || 'Команда B'}</div>
              <div className="text-xs text-muted-foreground mt-1">Команда B</div>
            </div>
          </div>
        </div>

        {/* Format select or start */}
        {!banpick && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4">Выбери формат бан-пика</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startBanPick('bo1')}
                className="press flex flex-col items-center gap-2 rounded-xl border-2 border-primary bg-primary/5 p-6 hover:bg-primary/10 transition"
              >
                <Shield className="h-8 w-8 text-primary" />
                <div className="font-display text-xl uppercase">BO1</div>
                <div className="text-xs text-muted-foreground text-center">6 банов → 1 карта</div>
              </button>
              <button
                onClick={() => startBanPick('bo3')}
                className="press flex flex-col items-center gap-2 rounded-xl border-2 border-border p-6 hover:border-primary/40 transition"
              >
                <Trophy className="h-8 w-8 text-muted-foreground" />
                <div className="font-display text-xl uppercase">BO3</div>
                <div className="text-xs text-muted-foreground text-center">2 бана + 2 пика + 2 бана → 3 карты</div>
              </button>
            </div>
          </div>
        )}

        {banpick && (
          <>
            {/* Status bar */}
            <div className={`rounded-2xl border p-4 text-center ${
              isDone
                ? 'border-green-500/20 bg-green-500/10'
                : isMyTurn
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-muted/30'
            }`}>
              {isDone ? (
                <div className="font-display text-lg uppercase text-green-600">✓ Бан-пик завершён</div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4" />
                    {isMyTurn
                      ? `Твой ход — ${currentStep?.action === 'ban' ? 'ЗАБАНЬ' : 'ПИКНИ'} карту`
                      : `Ход ${currentStep?.team === 'a' ? match.team_a_name : match.team_b_name} — ${currentStep?.action === 'ban' ? 'бан' : 'пик'}`
                    }
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Шаг {step + 1} из {sequence.length} · Формат {format.toUpperCase()}
                  </div>
                </>
              )}
            </div>

            {/* Progress steps */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sequence.map((s, i) => {
                  const done = i < step
                  const active = i === step && !isDone
                  const entry = usedMaps[i]
                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 flex flex-col items-center rounded-xl border px-3 py-2 min-w-[80px] transition ${
                        done
                          ? s.action === 'ban'
                            ? 'border-red-500/30 bg-red-500/10'
                            : 'border-green-500/30 bg-green-500/10'
                          : active
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/30 opacity-50'
                      }`}
                    >
                      <div className={`text-[10px] font-bold uppercase ${
                        s.action === 'ban' ? 'text-red-500' : 'text-green-600'
                      }`}>
                        {s.action}
                      </div>
                      <div className={`text-[10px] ${s.team === 'a' ? teamAColor : teamBColor}`}>
                        {s.team === 'a' ? match.team_a_name?.slice(0, 6) : match.team_b_name?.slice(0, 6)}
                      </div>
                      {entry && (
                        <div className="mt-1 text-[10px] font-semibold truncate max-w-[72px] text-center">
                          {entry.map}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Maps grid */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg uppercase mb-4">Карты</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {MAPS.map(map => {
                  const entry = usedMaps.find((e: any) => e.map === map)
                  const isBanned = entry?.action === 'ban'
                  const isPicked = entry?.action === 'pick'
                  const isResult = banpick.result_maps?.includes(map)
                  const isAvailable = !entry && !isDone && isMyTurn && currentStep

                  return (
                    <button
                      key={map}
                      onClick={() => isAvailable && handleMapAction(map)}
                      disabled={!!entry || isDone || !isMyTurn || acting}
                      className={`press relative flex flex-col items-center justify-center rounded-xl border p-4 h-24 transition-all font-display uppercase text-sm ${
                        isBanned
                          ? 'border-red-500/30 bg-red-500/10 text-red-500 opacity-60 line-through'
                          : isPicked
                          ? 'border-green-500/30 bg-green-500/10 text-green-600'
                          : isResult && isDone
                          ? 'border-primary bg-primary/10 text-primary shadow-soft'
                          : isAvailable
                          ? 'border-border bg-card hover:border-primary/60 hover:bg-primary/5 cursor-pointer'
                          : 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {map}
                      {isBanned && <span className="text-[10px] mt-1 font-normal">забанена</span>}
                      {isPicked && <span className="text-[10px] mt-1 font-normal">запикана</span>}
                      {isResult && isDone && !isPicked && <span className="text-[10px] mt-1 font-normal">финальная</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Result */}
            {isDone && banpick.result_maps?.length > 0 && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                <h2 className="font-display text-lg uppercase mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Карты матча
                </h2>
                <div className="flex flex-wrap gap-2">
                  {banpick.result_maps.map((map: string, i: number) => (
                    <div key={map} className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 font-display text-primary uppercase">
                      {format === 'bo3' && <span className="text-xs text-muted-foreground mr-2">Карта {i + 1}</span>}
                      {map}
                      {format === 'bo3' && i === banpick.result_maps.length - 1 && (
                        <span className="ml-2 text-xs text-muted-foreground">(decider)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
