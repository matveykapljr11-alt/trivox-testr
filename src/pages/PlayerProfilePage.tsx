import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flag, Send, MessageCircle, Users, Star, Target, Shield, Zap, Award } from 'lucide-react'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

function ReportModal({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean
}) {
  const [reason, setReason] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-glow animate-scale-in">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase flex items-center gap-2"><Flag className="h-5 w-5 text-danger" /> Подать жалобу</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-700">⚠️ После 5 жалоб аккаунт будет заблокирован.</div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Причина</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Токсичность, читы, нарушение правил..." rows={3} className="w-full rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="press flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">Отмена</button>
            <button onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()} className="press flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition">{loading ? 'Отправляем...' : 'Подтвердить'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPlayerAchievements(kd: number, hours: number, rankMm: string) {
  const list = []
  if (hours >= 1000) list.push({ icon: '⏰', label: 'Опытный', desc: '1000+ часов в игре', color: 'border-border bg-muted/60 text-muted-foreground' })
  if (hours >= 3000) list.push({ icon: '🕹️', label: 'Ветеран', desc: '3000+ часов', color: 'border-primary/30 bg-primary/10 text-primary' })
  if (kd >= 1.5) list.push({ icon: '🎯', label: 'Снайпер', desc: 'K/D 1.5+', color: 'border-green-500/30 bg-green-500/10 text-green-600' })
  if (kd >= 2.0) list.push({ icon: '⚡', label: 'Фраггер', desc: 'K/D 2.0+', color: 'border-orange-500/30 bg-orange-500/10 text-orange-600' })
  if (kd >= 3.0) list.push({ icon: '💀', label: 'Машина смерти', desc: 'K/D 3.0+', color: 'border-red-500/30 bg-red-500/10 text-red-500' })
  if (['Elite', 'Legend', 'Champion', 'Master', 'Mythic I', 'Mythic II'].includes(rankMm)) list.push({ icon: '👑', label: 'Топ игрок', desc: rankMm, color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600' })
  return list
}

const RANK_COLORS: Record<string, string> = {
  'Bronze': 'text-amber-700',
  'Silver': 'text-gray-400',
  'Gold': 'text-yellow-500',
  'Platinum': 'text-cyan-400',
  'Diamond': 'text-blue-400',
  'Legendary': 'text-purple-500',
  'Mythic I': 'text-red-500',
  'Mythic II': 'text-red-600',
  'Champion': 'text-orange-500',
  'Master': 'text-pink-500',
  'Elite': 'text-indigo-500',
  'Legend': 'text-yellow-400',
}

export default function PlayerProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [player, setPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [alreadyReported, setAlreadyReported] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const { data: p } = await supabase.from('players').select('*').eq('id', id).single()
        if (p) { setPlayer(p) }
        else {
          const { data: u } = await supabase.from('users').select('id, name, avatar, role, rank_mm, kd, hours, telegram, discord, trivox_id, is_banned').eq('id', id).single()
          setPlayer(u)
        }
        if (user) {
          const { data: r } = await supabase.from('reports').select('id').eq('reporter_id', user.id).eq('reported_id', id).single()
          setAlreadyReported(!!r)
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [id, user])

  async function handleReport(reason: string) {
    if (!user || !id) return
    setReporting(true)
    try {
      await supabase.from('reports').insert({ reporter_id: user.id, reported_id: id, reason: reason.trim() })
      const { data: reports } = await supabase.from('reports').select('id').eq('reported_id', id)
      const reportCount = reports?.length || 0
      await supabase.rpc('increment_warnings', { user_id: id }).catch(() => {
        supabase.from('users').select('warnings').eq('id', id).single().then(({ data }) => {
          supabase.from('users').update({ warnings: (data?.warnings || 0) + 1 }).eq('id', id)
        })
      })
      if (reportCount >= 5) {
        await supabase.from('users').update({ is_banned: true }).eq('id', id)
        toast.success('Жалоба подана. Аккаунт заблокирован.')
      } else {
        toast.success('Жалоба отправлена!', { description: `Предупреждение ${reportCount}/5` })
      }
      setAlreadyReported(true)
      setReportOpen(false)
    } catch (e: any) { toast.error('Ошибка: ' + (e.message || '')) }
    finally { setReporting(false) }
  }

  if (loading) return <PageShell><div className="mx-auto max-w-2xl px-4 py-10 space-y-4"><div className="h-8 w-32 rounded-lg skeleton" /><div className="h-48 rounded-2xl skeleton" /></div></PageShell>

  if (!player) return (
    <PageShell><div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h2 className="font-display text-2xl uppercase">Игрок не найден</h2>
      <button onClick={() => navigate('/players')} className="press mt-4 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">← Все игроки</button>
    </div></PageShell>
  )

  const isOwnProfile = user?.id === player.id || user?.id === player.user_id
  const achievements = getPlayerAchievements(player.kd || 0, player.hours || 0, player.rank_mm || '')
  const rankColor = RANK_COLORS[player.rank_mm] || 'text-foreground'

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 space-y-5">
        <button onClick={() => navigate(-1)} className="press inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {/* Hero */}
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-electric/5 pointer-events-none" />
          <div className="relative p-6">
            {player.is_banned && (
              <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger font-semibold">🚫 Этот аккаунт заблокирован</div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-electric font-display text-2xl text-primary-foreground shadow-glow">
                    {player.avatar || player.name?.slice(0, 2).toUpperCase() || 'P'}
                  </div>
                  {player.looking_for_team && (
                    <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-green-500 border-2 border-card">
                      <Users className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="font-display text-2xl uppercase">{player.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {player.role && (
                      <span className="text-sm font-semibold text-muted-foreground">{player.role}</span>
                    )}
                    {player.rank_mm && (
                      <span className={`text-sm font-bold ${rankColor}`}>· {player.rank_mm}</span>
                    )}
                    {player.type === 'staff' && (
                      <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">Staff</span>
                    )}
                  </div>
                  {player.trivox_id && (
                    <div className="mt-1 text-xs font-mono text-muted-foreground bg-muted/40 rounded-md px-2 py-0.5 inline-block">ID: {player.trivox_id}</div>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={() => isLoggedIn ? setReportOpen(true) : setAuthOpen(true)}
                  disabled={alreadyReported || player.is_banned}
                  className={`press flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition flex-shrink-0 ${alreadyReported ? 'border-border text-muted-foreground opacity-50 cursor-default' : 'border-danger/30 text-danger hover:bg-danger/10'}`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {alreadyReported ? 'Жалоба подана' : 'Жалоба'}
                </button>
              )}
            </div>

            {/* Stats */}
            {player.type !== 'staff' && (player.kd || player.hours || player.rank_mm) && (
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/60 p-3 text-center">
                  <div className={`font-display text-2xl text-gradient`}>{player.kd?.toFixed(2) || '—'}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">K/D</div>
                </div>
                <div className="rounded-xl bg-muted/60 p-3 text-center">
                  <div className="font-display text-2xl">{player.hours ? player.hours + 'h' : '—'}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Часов</div>
                </div>
                <div className="rounded-xl bg-muted/60 p-3 text-center">
                  <div className={`font-display text-lg font-bold ${rankColor}`}>{player.rank_mm || '—'}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ранг</div>
                </div>
              </div>
            )}

            {/* Looking for team */}
            {player.looking_for_team && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                <Users className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide">Ищет команду</div>
                  <div className="text-xs text-muted-foreground">Открыт для предложений</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" /> Достижения</h2>
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

        {/* Staff info */}
        {player.type === 'staff' && (player.experience || player.about) && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> О себе</h2>
            <div className="space-y-3">
              {player.experience && (
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Опыт</div>
                  <div className="text-sm">{player.experience}</div>
                </div>
              )}
              {player.about && (
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">О себе</div>
                  <div className="text-sm">{player.about}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacts */}
        {(player.telegram || player.discord) && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4">Контакты</h2>
            <div className="space-y-2">
              {player.telegram && (
                <a href={`https://t.me/${player.telegram.replace('@','')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 hover:bg-muted transition">
                  <Send className="h-5 w-5 text-[#29B6F6]" />
                  <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Telegram</div><div className="text-sm font-semibold">{player.telegram}</div></div>
                </a>
              )}
              {player.discord && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <MessageCircle className="h-5 w-5 text-[#5865F2]" />
                  <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Discord</div><div className="text-sm font-semibold">{player.discord}</div></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} onConfirm={handleReport} loading={reporting} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
