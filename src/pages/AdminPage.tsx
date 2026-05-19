import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Search, Shield, Trash2, Crown, Flag, Trophy, Swords, Ban, CheckCircle, AlertTriangle, User } from 'lucide-react'

const TABS = [
  { id: 'stats', label: '📊 Статистика' },
  { id: 'users', label: '👥 Пользователи' },
  { id: 'reports', label: '🚨 Жалобы' },
  { id: 'tournaments', label: '🏆 Турниры' },
  { id: 'scrims', label: '⚔️ Праки' },
]

function QuickAssign({ onAssigned }: { onAssigned: () => void }) {
  const [trivoxId, setTrivoxId] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)

  async function handleAssign() {
    if (!trivoxId.trim()) { toast.error('Введи Trivox ID'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.from('users').update({ role }).eq('trivox_id', trivoxId.trim()).select()
      if (error) throw error
      if (!data || data.length === 0) toast.error('Пользователь не найден')
      else { toast.success(`Роль ${role} назначена!`, { description: data[0].name }); setTrivoxId(''); onAssigned() }
    } catch (e: any) { toast.error('Ошибка: ' + (e.message || '')) }
    finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display text-sm uppercase mb-3 flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> Быстрое назначение по Trivox ID</h3>
      <div className="flex gap-2">
        <input value={trivoxId} onChange={e => setTrivoxId(e.target.value)} placeholder="Trivox ID пользователя"
          className="flex-1 h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none focus:border-primary"
          onKeyDown={e => e.key === 'Enter' && handleAssign()} />
        <select value={role} onChange={e => setRole(e.target.value)} className="h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none focus:border-primary">
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>
        <button onClick={handleAssign} disabled={loading}
          className="press h-10 rounded-xl bg-gradient-to-r from-primary to-electric px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {loading ? '...' : 'Назначить'}
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user, isLoggedIn } = useAuth()
  const [tab, setTab] = useState('stats')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [scrims, setScrims] = useState<any[]>([])
  const [stats, setStats] = useState({ users: 0, teams: 0, tournaments: 0, scrims: 0, matches: 0, reports: 0 })
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      setIsAdmin(data?.role === 'admin')
      setCheckingAdmin(false)
    })
  }, [user])

  useEffect(() => { if (isAdmin) loadAll() }, [isAdmin])

  async function loadAll() {
    setLoading(true)
    try {
      const [usersRes, teamsRes, tourRes, scrimsRes, matchesRes, reportsRes] = await Promise.all([
        supabase.from('users').select('id, name, role, trivox_id, avatar, created_at, telegram, is_banned, warnings').order('created_at', { ascending: false }).limit(200),
        supabase.from('teams').select('id', { count: 'exact' }),
        supabase.from('tournaments').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('scrims').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('matches').select('id', { count: 'exact' }),
        supabase.from('reports').select('*, reporter:reporter_id(name), reported:reported_id(name)').order('created_at', { ascending: false }).limit(100),
      ])
      setUsers(usersRes.data || [])
      setTournaments(tourRes.data || [])
      setScrims(scrimsRes.data || [])
      setReports(reportsRes.data || [])
      setStats({
        users: usersRes.data?.length || 0,
        teams: teamsRes.count || 0,
        tournaments: tourRes.data?.length || 0,
        scrims: scrimsRes.data?.length || 0,
        matches: matchesRes.count || 0,
        reports: reportsRes.data?.length || 0,
      })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function setRole(userId: string, role: string) {
    await supabase.from('users').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    toast.success(`Роль → ${role}`)
  }

  async function toggleBan(userId: string, isBanned: boolean) {
    await supabase.from('users').update({ is_banned: !isBanned }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !isBanned } : u))
    toast.success(isBanned ? 'Бан снят' : 'Пользователь забанен')
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Удалить ${name}?`)) return
    await supabase.from('users').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    toast.success('Удалён')
  }

  async function deleteTournament(id: string) {
    if (!confirm('Удалить турнир?')) return
    await supabase.from('matches').delete().eq('tournament_id', id)
    await supabase.from('tournament_teams').delete().eq('tournament_id', id)
    await supabase.from('tournaments').delete().eq('id', id)
    setTournaments(prev => prev.filter(t => t.id !== id))
    toast.success('Турнир удалён')
  }

  async function deleteScrim(id: string) {
    if (!confirm('Удалить прак?')) return
    await supabase.from('scrims').delete().eq('id', id)
    setScrims(prev => prev.filter(s => s.id !== id))
    toast.success('Прак удалён')
  }

  async function resolveReport(reportId: string) {
    await supabase.from('reports').delete().eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
    toast.success('Жалоба закрыта')
  }

  if (!isLoggedIn) return <Navigate to="/" replace />
  if (checkingAdmin) return <PageShell><div className="mx-auto max-w-5xl px-4 py-10"><div className="h-48 rounded-2xl skeleton" /></div></PageShell>
  if (!isAdmin) return <Navigate to="/" replace />

  const filteredUsers = users.filter(u => !q ||
    u.name?.toLowerCase().includes(q.toLowerCase()) ||
    u.trivox_id?.toLowerCase().includes(q.toLowerCase()) ||
    u.telegram?.toLowerCase().includes(q.toLowerCase()))
  const adminCount = users.filter(u => u.role === 'admin').length
  const bannedCount = users.filter(u => u.is_banned).length

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 space-y-6">

        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-electric">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl uppercase">Панель администратора</h1>
              <div className="text-sm text-muted-foreground">TRIVOX — управление платформой</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`press rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* STATS */}
        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Юзеров', value: stats.users, icon: '👥', color: 'text-primary' },
                { label: 'Команд', value: stats.teams, icon: '🛡️', color: 'text-blue-500' },
                { label: 'Турниров', value: stats.tournaments, icon: '🏆', color: 'text-yellow-500' },
                { label: 'Праков', value: stats.scrims, icon: '⚔️', color: 'text-orange-500' },
                { label: 'Матчей', value: stats.matches, icon: '🎮', color: 'text-green-500' },
                { label: 'Жалоб', value: stats.reports, icon: '🚨', color: 'text-red-500' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className={`font-display text-3xl ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className="font-display text-3xl text-primary">{adminCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">👑 Админов</div>
              </div>
              <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-center">
                <div className="font-display text-3xl text-danger">{bannedCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">🚫 Забанено</div>
              </div>
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center">
                <div className="font-display text-3xl text-yellow-600">{stats.reports}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">⚠️ Жалоб</div>
              </div>
            </div>

            <QuickAssign onAssigned={loadAll} />

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg uppercase mb-4">Последние регистрации</h2>
              <div className="space-y-2">
                {users.slice(0, 8).map(u => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-electric/20 font-display text-xs text-primary flex-shrink-0">
                      {u.avatar || u.name?.slice(0,2).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.trivox_id && `#${u.trivox_id} · `}{new Date(u.created_at).toLocaleDateString('ru')}</div>
                    </div>
                    <div className="flex gap-1">
                      {u.role === 'admin' && <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">ADMIN</span>}
                      {u.is_banned && <span className="text-[10px] font-bold text-danger bg-danger/10 rounded-full px-2 py-0.5">БАН</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по имени, trivox_id, telegram..."
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary" />
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                <span className="font-display text-sm uppercase">Пользователи ({filteredUsers.length})</span>
                <button onClick={loadAll} className="text-xs text-muted-foreground hover:text-foreground transition">Обновить</button>
              </div>
              {loading ? (
                <div className="p-6 space-y-3">{Array.from({length:5}).map((_,i) => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
              ) : (
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {filteredUsers.map(u => (
                    <div key={u.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition ${u.is_banned ? 'opacity-60' : ''}`}>
                      <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-electric/20 font-display text-xs text-primary">
                        {u.avatar || u.name?.slice(0,2).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm">{u.name || 'Без имени'}</span>
                          {u.role === 'admin' && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">ADMIN</span>}
                          {u.role === 'moderator' && <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">MOD</span>}
                          {u.is_banned && <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">БАН</span>}
                          {(u.warnings || 0) > 0 && <span className="flex items-center gap-0.5 rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-600"><AlertTriangle className="h-2.5 w-2.5" />{u.warnings}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                          {u.trivox_id && <span>#{u.trivox_id}</span>}
                          {u.telegram && <span>TG: {u.telegram}</span>}
                          <span>{new Date(u.created_at).toLocaleDateString('ru')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <select value={u.role || 'user'} onChange={e => setRole(u.id, e.target.value)} disabled={u.id === user?.id}
                          className="h-8 rounded-lg border border-border bg-card px-2 text-xs outline-none disabled:opacity-40">
                          <option value="user">User</option>
                          <option value="moderator">Mod</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => toggleBan(u.id, u.is_banned)} disabled={u.id === user?.id} title={u.is_banned ? 'Снять бан' : 'Забанить'}
                          className={`press grid h-8 w-8 place-items-center rounded-lg border transition disabled:opacity-40 ${u.is_banned ? 'border-green-500/20 text-green-600 hover:bg-green-500/10' : 'border-orange-500/20 text-orange-500 hover:bg-orange-500/10'}`}>
                          {u.is_banned ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => deleteUser(u.id, u.name)} disabled={u.id === user?.id}
                          className="press grid h-8 w-8 place-items-center rounded-lg border border-danger/20 text-danger hover:bg-danger/10 transition disabled:opacity-40">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <QuickAssign onAssigned={loadAll} />
          </div>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <span className="font-display text-sm uppercase flex items-center gap-2"><Flag className="h-4 w-4 text-danger" /> Жалобы ({reports.length})</span>
            </div>
            {reports.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-sm text-muted-foreground">Жалоб нет — всё спокойно!</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {reports.map(r => (
                  <div key={r.id} className="px-5 py-4 hover:bg-muted/30 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-sm mb-1">
                          <span className="font-semibold text-danger">{r.reporter?.name || 'Неизвестный'}</span>
                          <span className="text-muted-foreground text-xs">пожаловался на</span>
                          <span className="font-semibold">{r.reported?.name || 'Неизвестный'}</span>
                        </div>
                        {r.reason && <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-2 py-1 mb-1">{r.reason}</div>}
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => {
                          const reported = users.find(u => u.id === r.reported_id)
                          if (reported) toggleBan(r.reported_id, reported.is_banned || false)
                        }} className="press flex items-center gap-1 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2 py-1.5 text-xs font-semibold text-orange-500 hover:bg-orange-500/20 transition">
                          <Ban className="h-3 w-3" /> Бан
                        </button>
                        <button onClick={() => resolveReport(r.id)} className="press flex items-center gap-1 rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-500/20 transition">
                          <CheckCircle className="h-3 w-3" /> Закрыть
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TOURNAMENTS */}
        {tab === 'tournaments' && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <span className="font-display text-sm uppercase flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Турниры ({tournaments.length})</span>
            </div>
            {tournaments.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Турниров нет</div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {tournaments.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex-shrink-0">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>{t.format}</span>
                        {t.prize && <span>· {t.prize}</span>}
                        <span className={`font-semibold ${t.status === 'live' ? 'text-green-600' : t.status === 'upcoming' ? 'text-blue-500' : 'text-muted-foreground'}`}>· {t.status}</span>
                        {t.is_private && <span className="text-muted-foreground">· 🔒</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteTournament(t.id)} className="press grid h-8 w-8 place-items-center rounded-lg border border-danger/20 text-danger hover:bg-danger/10 transition flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCRIMS */}
        {tab === 'scrims' && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <span className="font-display text-sm uppercase flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Праки ({scrims.length})</span>
            </div>
            {scrims.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Праков нет</div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {scrims.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-electric/20 font-display text-sm text-primary flex-shrink-0">
                      {s.team_name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{s.team_name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>{s.format}</span>
                        {s.time_text && <span>· {s.time_text}</span>}
                        <span className={`font-semibold ${s.status === 'open' ? 'text-green-600' : s.status === 'confirmed' ? 'text-primary' : 'text-yellow-600'}`}>· {s.status}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteScrim(s.id)} className="press grid h-8 w-8 place-items-center rounded-lg border border-danger/20 text-danger hover:bg-danger/10 transition flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </PageShell>
  )
}
