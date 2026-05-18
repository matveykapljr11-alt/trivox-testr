import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Users, Calendar, Coins, ArrowLeft, MapPin, Shield, BookOpen, X, Crown, Plus, Trash2 } from 'lucide-react'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { MatchesSection } from '../components/MatchesSection'
import { BracketSection } from '../components/BracketSection'

function RulesModal({ rules, open, onClose, title = 'Регламент турнира' }: {
  rules: string; open: boolean; onClose: () => void; title?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-glow animate-scale-in">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><h2 className="font-display text-xl uppercase">{title}</h2></div>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto"><div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{rules}</div></div>
        <div className="border-t border-border p-4"><button onClick={onClose} className="press w-full rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">Закрыть</button></div>
      </div>
    </div>
  )
}

function TournamentAdminsSection({ tournamentId, isOrganizer }: { tournamentId: string; isOrganizer: boolean }) {
  const [admins, setAdmins] = useState<any[]>([])
  const [trivoxId, setTrivoxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadAdmins() }, [tournamentId])

  async function loadAdmins() {
    setLoading(true)
    const { data } = await supabase
      .from('tournament_admins')
      .select('*, users(name, trivox_id, avatar)')
      .eq('tournament_id', tournamentId)
    setAdmins(data || [])
    setLoading(false)
  }

  async function addAdmin() {
    if (!trivoxId.trim()) { toast.error('Введи Trivox ID'); return }
    setAdding(true)
    try {
      const { data: foundUser } = await supabase
        .from('users')
        .select('id, name')
        .eq('trivox_id', trivoxId.trim())
        .single()

      if (!foundUser) { toast.error('Пользователь не найден'); setAdding(false); return }

      const already = admins.some(a => a.user_id === foundUser.id)
      if (already) { toast.error('Уже является администратором'); setAdding(false); return }

      await supabase.from('tournament_admins').insert({ tournament_id: tournamentId, user_id: foundUser.id })
      toast.success(`${foundUser.name} назначен администратором турнира!`)
      setTrivoxId('')
      loadAdmins()
    } catch (e: any) { toast.error('Ошибка: ' + (e.message || '')) }
    finally { setAdding(false) }
  }

  async function removeAdmin(adminId: string, name: string) {
    if (!confirm(`Снять ${name} с роли администратора?`)) return
    await supabase.from('tournament_admins').delete().eq('id', adminId)
    setAdmins(prev => prev.filter(a => a.id !== adminId))
    toast.success('Администратор снят')
  }

  if (!isOrganizer) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
        <Crown className="h-5 w-5 text-yellow-500" /> Администраторы турнира
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Администраторы могут создавать матчи, вводить счёт и управлять сеткой турнира.</p>

      {/* Add admin */}
      <div className="flex gap-2 mb-4">
        <input
          value={trivoxId}
          onChange={e => setTrivoxId(e.target.value)}
          placeholder="Trivox ID пользователя"
          className="flex-1 h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none focus:border-primary"
          onKeyDown={e => e.key === 'Enter' && addAdmin()}
        />
        <button onClick={addAdmin} disabled={adding}
          className="press flex items-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-primary to-electric px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          <Plus className="h-3.5 w-3.5" /> {adding ? '...' : 'Добавить'}
        </button>
      </div>

      {/* Admins list */}
      {loading ? (
        <div className="h-16 rounded-xl skeleton" />
      ) : admins.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет назначенных администраторов</p>
      ) : (
        <div className="space-y-2">
          {admins.map(a => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 font-display text-sm text-yellow-600 flex-shrink-0">
                {a.users?.avatar || a.users?.name?.slice(0,2).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{a.users?.name || 'Пользователь'}</div>
                {a.users?.trivox_id && <div className="text-xs text-muted-foreground">#{a.users.trivox_id}</div>}
              </div>
              <span className="text-[10px] font-bold text-yellow-600 bg-yellow-500/10 rounded-full px-2 py-0.5 mr-1">Админ турнира</span>
              <button onClick={() => removeAdmin(a.id, a.users?.name || '')}
                className="press grid h-7 w-7 place-items-center rounded-lg border border-danger/20 text-danger hover:bg-danger/10 transition">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TournamentProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [tournament, setTournament] = useState<any>(null)
  const [registeredTeams, setRegisteredTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isTournamentAdmin, setIsTournamentAdmin] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [descOpen, setDescOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const { data: tour } = await supabase.from('tournaments').select('*').eq('id', id).single()
        if (tour) {
          setTournament(tour)
          const { data: tt } = await supabase.from('tournament_teams').select('*, teams(name, tag, region)').eq('tournament_id', id)
          setRegisteredTeams(tt || [])
          if (user) {
            const { data: myTeam } = await supabase.from('teams').select('id').eq('owner_id', user.id).single()
            if (myTeam) setIsRegistered((tt || []).some((t: any) => t.team_id === myTeam.id))
            // Check if user is tournament admin
            const { data: adminCheck } = await supabase.from('tournament_admins').select('id').eq('tournament_id', id).eq('user_id', user.id).single()
            setIsTournamentAdmin(!!adminCheck)
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [id, user])

  async function handleRegister() {
    if (!isLoggedIn) { setAuthOpen(true); return }
    if (!user) return
    setRegistering(true)
    try {
      const { data: team } = await supabase.from('teams').select('id, name').eq('owner_id', user.id).single()
      if (!team) { toast.error('У тебя нет команды'); setRegistering(false); return }
      const { data: members } = await supabase.from('team_members').select('id').eq('team_id', team.id)
      if ((members?.length || 0) < 4) { toast.error('Недостаточно игроков', { description: `В команде ${members?.length || 0} из минимум 4` }); setRegistering(false); return }
      if (isRegistered) { toast.error('Команда уже зарегистрирована'); setRegistering(false); return }
      await supabase.from('tournament_teams').insert({ tournament_id: id, team_id: team.id, user_id: user.id, status: 'registered' })
      setIsRegistered(true)
      setRegisteredTeams(prev => [...prev, { team_id: team.id, teams: { name: team.name } }])
      toast.success('Команда зарегистрирована!', { description: tournament?.title })
    } catch (e: any) { toast.error('Ошибка: ' + (e.message || '')) }
    finally { setRegistering(false) }
  }

  if (loading) return (
    <PageShell><div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <div className="h-8 w-32 rounded-lg skeleton" /><div className="h-64 rounded-2xl skeleton" /><div className="h-48 rounded-2xl skeleton" />
    </div></PageShell>
  )

  if (!tournament) return (
    <PageShell><div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h2 className="font-display text-2xl uppercase">Турнир не найден</h2>
      <button onClick={() => navigate('/tournaments')} className="press mt-4 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">← Все турниры</button>
    </div></PageShell>
  )

  const statusColor = tournament.status === 'live' ? 'bg-green-500/10 text-green-600 border-green-500/20' : tournament.status === 'upcoming' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-muted text-muted-foreground border-border'
  const statusLabel = tournament.status === 'live' ? '🔴 Идёт' : tournament.status === 'upcoming' ? '🔵 Скоро' : '✓ Завершён'
  const hasRules = tournament.rules && tournament.rules.trim().length > 0
  const hasFaq = tournament.faq && tournament.faq.trim().length > 0
  const isOrganizer = user?.id === tournament.organizer_id
  const canManage = isOrganizer || isTournamentAdmin

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 space-y-6">
        <button onClick={() => navigate(-1)} className="press inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-electric shadow-soft">
                <Trophy className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl uppercase">{tournament.title || tournament.name}</h1>
                {tournament.description && (
                  <button onClick={() => setDescOpen(true)} className="mt-1 text-sm text-primary hover:underline text-left transition">
                    Читать описание →
                  </button>
                )}
                {isTournamentAdmin && !isOrganizer && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-600">
                    <Crown className="h-2.5 w-2.5" /> Вы администратор турнира
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
              {tournament.is_private && <span className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">🔒 Только по ссылке</span>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tournament.prize && tournament.prize !== 'No prize' && (
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <Coins className="mx-auto h-4 w-4 text-yellow-500 mb-1" />
                <div className="font-display text-sm text-gradient">{tournament.prize}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Призовой</div>
              </div>
            )}
            <div className="rounded-xl bg-muted/60 p-3 text-center">
              <Users className="mx-auto h-4 w-4 text-primary mb-1" />
              <div className="font-display text-sm">{registeredTeams.length}/{tournament.max_teams || '∞'}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Команд</div>
            </div>
            {tournament.format && (
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <Shield className="mx-auto h-4 w-4 text-primary mb-1" />
                <div className="font-display text-sm">{tournament.format}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Формат</div>
              </div>
            )}
            {tournament.level && (
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <Trophy className="mx-auto h-4 w-4 text-primary mb-1" />
                <div className="font-display text-sm">{tournament.level}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Уровень</div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {(tournament.start_date || tournament.date_text) && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Дата</div>
                <div className="text-sm font-semibold">{tournament.start_date || tournament.date_text}{tournament.start_time ? ` · ${tournament.start_time}` : ''}</div></div>
              </div>
            )}
            {tournament.region && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Регион</div><div className="text-sm font-semibold">{tournament.region}</div></div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {tournament.status !== 'finished' && (
              <button onClick={handleRegister} disabled={registering || isRegistered}
                className={`press w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition ${isRegistered ? 'bg-green-500/10 border border-green-500/20 text-green-600 cursor-default' : 'bg-gradient-to-r from-primary to-electric text-primary-foreground hover:opacity-90 disabled:opacity-60'}`}>
                {isRegistered ? '✓ Команда зарегистрирована' : registering ? 'Регистрируем...' : 'Зарегистрировать команду'}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => hasRules ? setRulesOpen(true) : undefined} disabled={!hasRules}
                className={`press flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${hasRules ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10' : 'border-border bg-muted/30 text-muted-foreground opacity-50 cursor-default'}`}>
                <BookOpen className="h-4 w-4" /> Регламент
              </button>
              <button onClick={() => hasFaq ? setFaqOpen(true) : undefined} disabled={!hasFaq}
                className={`press flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${hasFaq ? 'border-border bg-muted/40 hover:bg-muted' : 'border-border bg-muted/30 text-muted-foreground opacity-50 cursor-default'}`}>
                ❓ FAQ
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Ссылка скопирована!') }}
                className="press col-span-2 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">
                📋 Скопировать ссылку
              </button>
            </div>
          </div>
        </div>

        {/* Tournament Admins — only organizer sees this */}
        <TournamentAdminsSection tournamentId={id!} isOrganizer={isOrganizer} />

        {/* Bracket */}
        <BracketSection tournamentId={id!} isOrganizer={canManage} registeredTeams={registeredTeams} />

        {/* Matches */}
        <MatchesSection tournamentId={id!} isOrganizer={canManage} registeredTeams={registeredTeams} />

        {/* Registered teams */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Зарегистрированные команды ({registeredTeams.length})</h2>
          {registeredTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет зарегистрированных команд. Будь первым!</p>
          ) : (
            <div className="space-y-2">
              {registeredTeams.map((tt, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-electric/20 font-display text-sm text-primary">{(tt.teams?.name?.[0] || 'T').toUpperCase()}</div>
                  <div><div className="text-sm font-semibold">{tt.teams?.name || 'Команда'}</div>{tt.teams?.tag && <div className="text-xs text-muted-foreground">[{tt.teams.tag}] · {tt.teams.region}</div>}</div>
                  <div className="ml-auto text-xs text-green-600 font-semibold bg-green-500/10 rounded-full px-2 py-0.5">Зарегистрирована</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RulesModal rules={tournament.description || ''} open={descOpen} onClose={() => setDescOpen(false)} title="Описание турнира" />
      <RulesModal rules={tournament.rules || ''} open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <RulesModal rules={tournament.faq || ''} open={faqOpen} onClose={() => setFaqOpen(false)} title="Частые вопросы (FAQ)" />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
