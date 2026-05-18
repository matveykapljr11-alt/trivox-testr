import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Users, Trophy, MessageCircle, Send, ArrowLeft, Swords, Star, Flame, Crown } from 'lucide-react'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type MatchResult = {
  id: string
  team_a_id: string
  team_b_id: string
  team_a_name: string
  team_b_name: string
  score_a: number
  score_b: number
  status: string
  scheduled_at: string | null
  map: string | null
  round: string | null
  result: 'W' | 'L' | 'D'
}

function getAchievements(wins: number, matches: number, members: number, tourWins: number) {
  const list = []
  if (tourWins >= 1) list.push({ icon: '🏆', label: 'Чемпион', desc: `${tourWins} турнирных побед`, color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600' })
  if (tourWins >= 3) list.push({ icon: '👑', label: 'Династия', desc: '3+ турнирных победы', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600' })
  if (wins >= 10) list.push({ icon: '🔥', label: 'Боевая машина', desc: '10+ побед', color: 'border-orange-500/30 bg-orange-500/10 text-orange-600' })
  if (wins >= 25) list.push({ icon: '⚡', label: 'Доминация', desc: '25+ побед', color: 'border-primary/30 bg-primary/10 text-primary' })
  if (matches >= 20) list.push({ icon: '🎯', label: 'Ветеран', desc: '20+ матчей', color: 'border-border bg-muted/60 text-muted-foreground' })
  if (members >= 5) list.push({ icon: '🛡️', label: 'Полный состав', desc: '5+ игроков', color: 'border-green-500/30 bg-green-500/10 text-green-600' })
  if (matches > 0 && wins / matches >= 0.7) list.push({ icon: '💫', label: 'Элита', desc: '70%+ винрейт', color: 'border-primary/30 bg-primary/10 text-primary' })
  return list
}

export default function TeamProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [scrims, setScrims] = useState<any[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [tourWins, setTourWins] = useState(0)
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const { data: teamData } = await supabase.from('teams').select('*').eq('id', id).single()
        if (teamData) {
          setTeam(teamData)
          const { data: membersData } = await supabase.from('team_members').select('*').eq('team_id', id)
          setMembers(membersData || [])
          const { data: scrimsData } = await supabase.from('scrims').select('*').eq('user_id', teamData.owner_id).eq('status', 'open').order('created_at', { ascending: false }).limit(3)
          setScrims(scrimsData || [])
          const { data: matchesA } = await supabase.from('matches').select('*').eq('team_a_id', id).eq('status', 'finished').order('scheduled_at', { ascending: false }).limit(10)
          const { data: matchesB } = await supabase.from('matches').select('*').eq('team_b_id', id).eq('status', 'finished').order('scheduled_at', { ascending: false }).limit(10)
          const allMatches = [
            ...(matchesA || []).map((m: any) => ({ ...m, result: m.score_a > m.score_b ? 'W' : m.score_a < m.score_b ? 'L' : 'D' })),
            ...(matchesB || []).map((m: any) => ({ ...m, result: m.score_b > m.score_a ? 'W' : m.score_b < m.score_a ? 'L' : 'D' })),
          ].sort((a, b) => {
            const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : new Date(a.created_at).getTime()
            const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : new Date(b.created_at).getTime()
            return db - da
          }).slice(0, 10) as MatchResult[]
          setMatches(allMatches)
          setTourWins(allMatches.filter(m => m.result === 'W' && (m.round === 'Финал' || m.round === 'Гранд-финал')).length)
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleJoin() {
    if (!isLoggedIn) { setAuthOpen(true); return }
    if (!team || !user) return
    setJoining(true)
    try {
      await supabase.from('join_requests').insert({ team_id: team.id, user_id: user.id, user_name: user.name, status: 'pending' })
      toast.success('Заявка отправлена!', { description: `Капитан ${team.name} рассмотрит твою заявку` })
    } catch { toast.error('Ошибка отправки заявки') }
    finally { setJoining(false) }
  }

  if (loading) return <PageShell><div className="mx-auto max-w-3xl px-4 py-10 space-y-4"><div className="h-48 rounded-2xl skeleton" /><div className="h-32 rounded-2xl skeleton" /></div></PageShell>
  if (!team) return (
    <PageShell><div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h2 className="font-display text-2xl uppercase">Команда не найдена</h2>
      <button onClick={() => navigate('/teams')} className="press mt-4 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">← Все команды</button>
    </div></PageShell>
  )

  const initials = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const isOwner = user?.id === team.owner_id
  const isOpen = team.status?.toLowerCase().includes('набор') || team.status?.toLowerCase().includes('ищут')
  const wins = matches.filter(m => m.result === 'W').length
  const losses = matches.filter(m => m.result === 'L').length
  const draws = matches.filter(m => m.result === 'D').length
  const last5 = matches.slice(0, 5)
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0
  const achievements = getAchievements(wins, matches.length, members.length, tourWins)

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 space-y-5">
        <button onClick={() => navigate(-1)} className="press inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {/* Hero */}
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-electric/5 pointer-events-none" />
          <div className="relative p-6">
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-primary to-electric font-display text-3xl text-primary-foreground shadow-glow">
                  {initials}
                </div>
                {tourWins > 0 && (
                  <div className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-yellow-500 shadow-soft">
                    <Trophy className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl uppercase">{team.name}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{team.region}</span>
                  <span className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded-md">[{team.tag}]</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isOpen ? 'border border-primary/30 bg-primary/10 text-primary' : 'border border-border bg-muted text-muted-foreground'}`}>
                    <Users className="h-3 w-3" />{team.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-yellow-500" /><span className="font-semibold">{team.rating || 1000}</span><span className="text-muted-foreground text-xs">рейтинг</span></div>
                  <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /><span className="font-semibold">{members.length}</span><span className="text-muted-foreground text-xs">игроков</span></div>
                  {matches.length > 0 && <div className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-orange-500" /><span className="font-semibold">{winRate}%</span><span className="text-muted-foreground text-xs">винрейт</span></div>}
                  {tourWins > 0 && <div className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-yellow-500" /><span className="font-semibold">{tourWins}</span><span className="text-muted-foreground text-xs">турнирных побед</span></div>}
                </div>
              </div>
            </div>
            {!isOwner && (
              <div className="mt-5 flex flex-wrap gap-2">
                {isOpen && <button onClick={handleJoin} disabled={joining} className="press flex-1 min-w-[120px] rounded-xl bg-gradient-to-r from-primary to-electric py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">{joining ? 'Отправляем...' : 'Подать заявку'}</button>}
                {team.discord && <a href={team.discord.startsWith('http') ? team.discord : `https://discord.gg/${team.discord}`} target="_blank" rel="noreferrer" className="press flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"><MessageCircle className="h-4 w-4 text-[#5865F2]" /> Discord</a>}
                {team.telegram && <a href={team.telegram.startsWith('http') ? team.telegram : `https://t.me/${team.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="press flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"><Send className="h-4 w-4 text-[#29B6F6]" /> Telegram</a>}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Достижения</h2>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${a.color}`}>
                  <span className="text-base">{a.icon}</span>
                  <div><div className="font-bold text-xs uppercase tracking-wide">{a.label}</div><div className="text-[10px] opacity-70">{a.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match stats */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Статистика матчей</h2>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Матчи в турнирах ещё не сыграны</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center"><div className="font-display text-2xl text-green-600">{wins}</div><div className="text-[10px] uppercase tracking-wider text-green-600/70">Победы</div></div>
                <div className="rounded-xl bg-muted/60 p-3 text-center"><div className="font-display text-2xl text-muted-foreground">{draws}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ничьи</div></div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center"><div className="font-display text-2xl text-red-500">{losses}</div><div className="text-[10px] uppercase tracking-wider text-red-500/70">Поражения</div></div>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center"><div className="font-display text-2xl text-primary">{winRate}%</div><div className="text-[10px] uppercase tracking-wider text-primary/70">Винрейт</div></div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Победы {winRate}%</span><span>Поражения {100-winRate}%</span></div>
                <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden"><div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${winRate}%` }} /></div>
              </div>
              {last5.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Форма</div>
                  <div className="flex items-center gap-2">
                    {last5.map((m, i) => (
                      <div key={i} className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold border-2 ${m.result === 'W' ? 'bg-green-500/15 border-green-500/40 text-green-600' : m.result === 'L' ? 'bg-red-500/15 border-red-500/40 text-red-500' : 'bg-muted border-border text-muted-foreground'}`}>{m.result}</div>
                    ))}
                    {Array.from({ length: Math.max(0, 5-last5.length) }).map((_, i) => (
                      <div key={`e${i}`} className="grid h-9 w-9 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground/30 text-xs">?</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {matches.map((m, i) => {
                  const isTeamA = m.team_a_id === id
                  const opponent = isTeamA ? m.team_b_name : m.team_a_name
                  const ourScore = isTeamA ? m.score_a : m.score_b
                  const theirScore = isTeamA ? m.score_b : m.score_a
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 hover:bg-muted/50 transition">
                      <div className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-xs font-bold border ${m.result === 'W' ? 'bg-green-500/15 border-green-500/30 text-green-600' : m.result === 'L' ? 'bg-red-500/15 border-red-500/30 text-red-500' : 'bg-muted border-border text-muted-foreground'}`}>{m.result}</div>
                      <div className="flex-1 min-w-0">
                        {m.round && <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{m.round}</div>}
                        <div className="text-sm font-semibold truncate">vs {opponent}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">{m.map && <span>🗺 {m.map}</span>}{m.scheduled_at && <span>{new Date(m.scheduled_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>}</div>
                      </div>
                      <div className={`font-display text-lg flex-shrink-0 font-bold ${m.result === 'W' ? 'text-green-600' : m.result === 'L' ? 'text-red-500' : 'text-muted-foreground'}`}>{ourScore}:{theirScore}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Members */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Состав ({members.length})</h2>
          {members.length === 0 ? <p className="text-sm text-muted-foreground">Состав пока пуст</p> : (
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3 hover:bg-muted/50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-full font-display text-sm ${m.user_id === team.owner_id ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600' : 'bg-gradient-to-br from-primary/20 to-electric/20 text-primary'}`}>
                      {m.user_id === team.owner_id ? <Crown className="h-4 w-4" /> : (m.role?.[0] || 'P')}
                    </div>
                    <div><div className="text-sm font-semibold">{m.user_id}</div><div className="text-xs text-muted-foreground">{m.role}{m.rank ? ` · ${m.rank}` : ''}</div></div>
                  </div>
                  {m.user_id === team.owner_id && <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-600">Капитан</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {scrims.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><Swords className="h-5 w-5 text-primary" /> Открытые праки</h2>
            <div className="space-y-2">
              {scrims.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                  <div><div className="text-sm font-semibold">{s.format}</div><div className="text-xs text-muted-foreground">{s.time_text}</div></div>
                  <div className="flex flex-wrap gap-1">{s.maps?.slice(0,2).map((map: string) => <span key={map} className="rounded-md bg-accent/60 px-2 py-0.5 text-xs">{map}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
