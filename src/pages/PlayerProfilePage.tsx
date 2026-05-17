import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flag, Send, MessageCircle, Clock, Users } from 'lucide-react'
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-glow animate-scale-in">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-xl uppercase flex items-center gap-2">
            <Flag className="h-5 w-5 text-danger" /> Подать жалобу
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-700">
            ⚠️ Жалоба будет проверена. После 5 жалоб от разных игроков аккаунт может быть заблокирован.
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Причина жалобы
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Опиши причину жалобы (токсичность, читы, нарушение правил...)"
              rows={3}
              className="w-full rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="press flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition"
            >
              Отмена
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading || !reason.trim()}
              className="press flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading ? 'Отправляем...' : 'Подтвердить жалобу'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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
        // Try players table first
        const { data: p } = await supabase
          .from('players')
          .select('*')
          .eq('id', id)
          .single()

        if (p) {
          setPlayer(p)
        } else {
          // Fallback to users table
          const { data: u } = await supabase
            .from('users')
            .select('id, name, avatar, role, rank_mm, kd, hours, telegram, discord, trivox_id, is_banned')
            .eq('id', id)
            .single()
          setPlayer(u)
        }

        // Check if already reported
        if (user) {
          const { data: r } = await supabase
            .from('reports')
            .select('id')
            .eq('reporter_id', user.id)
            .eq('reported_id', id)
            .single()
          setAlreadyReported(!!r)
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [id, user])

  async function handleReport(reason: string) {
    if (!user || !id) return
    setReporting(true)
    try {
      // Submit report
      await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: id,
        reason: reason.trim(),
      })

      // Count reports for this user
      const { data: reports } = await supabase
        .from('reports')
        .select('id')
        .eq('reported_id', id)

      const reportCount = reports?.length || 0

      // Add warning to reported user
      await supabase.rpc('increment_warnings', { user_id: id }).catch(() => {
        // fallback if rpc not exists
        supabase.from('users').select('warnings').eq('id', id).single().then(({ data }) => {
          const current = data?.warnings || 0
          supabase.from('users').update({ warnings: current + 1 }).eq('id', id)
        })
      })

      // Ban if 5+ reports
      if (reportCount >= 5) {
        await supabase.from('users').update({ is_banned: true }).eq('id', id)
        toast.success('Жалоба подана. Аккаунт заблокирован после 5 жалоб.')
      } else {
        toast.success('Жалоба отправлена!', {
          description: `Предупреждение ${reportCount}/5. После 5 жалоб аккаунт будет заблокирован.`
        })
      }

      setAlreadyReported(true)
      setReportOpen(false)
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
          <div className="h-8 w-32 rounded-lg skeleton" />
          <div className="h-48 rounded-2xl skeleton" />
        </div>
      </PageShell>
    )
  }

  if (!player) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h2 className="font-display text-2xl uppercase">Игрок не найден</h2>
          <button onClick={() => navigate('/players')} className="press mt-4 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
            ← Все игроки
          </button>
        </div>
      </PageShell>
    )
  }

  const isOwnProfile = user?.id === player.id || user?.id === player.user_id

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 space-y-6">

        <button
          onClick={() => navigate(-1)}
          className="press inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          {player.is_banned && (
            <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger font-semibold">
              🚫 Этот аккаунт заблокирован
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-electric font-display text-2xl text-primary-foreground shadow-soft">
                {player.avatar || player.name?.slice(0, 2).toUpperCase() || 'P'}
              </div>
              <div>
                <h1 className="font-display text-2xl uppercase">{player.name}</h1>
                <div className="mt-1 text-sm text-muted-foreground">
                  {player.role}{player.rank_mm ? ` · ${player.rank_mm}` : ''}
                  {player.type === 'staff' && ' · Staff'}
                </div>
                {player.trivox_id && (
                  <div className="mt-1 text-xs font-mono text-muted-foreground">ID: {player.trivox_id}</div>
                )}
              </div>
            </div>

            {/* Report button */}
            {!isOwnProfile && (
              <button
                onClick={() => isLoggedIn ? setReportOpen(true) : setAuthOpen(true)}
                disabled={alreadyReported || player.is_banned}
                className={`press flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  alreadyReported
                    ? 'border-border text-muted-foreground cursor-default opacity-50'
                    : 'border-danger/30 text-danger hover:bg-danger/10'
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                {alreadyReported ? 'Жалоба подана' : 'Жалоба'}
              </button>
            )}
          </div>

          {/* Stats */}
          {player.type !== 'staff' && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <div className="font-display text-2xl text-gradient">{player.kd?.toFixed(2) || '—'}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">K/D</div>
              </div>
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <div className="font-display text-2xl">{player.hours ? player.hours + 'h' : '—'}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Часов</div>
              </div>
            </div>
          )}

          {/* Staff info */}
          {player.type === 'staff' && (player.experience || player.about) && (
            <div className="mt-4 space-y-2">
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
          )}

          {/* Contacts */}
          {(player.telegram || player.discord) && (
            <div className="mt-4 space-y-2">
              {player.telegram && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <Send className="h-4 w-4 text-[#29B6F6]" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Telegram</div>
                    <div className="text-sm font-semibold">{player.telegram}</div>
                  </div>
                </div>
              )}
              {player.discord && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <MessageCircle className="h-4 w-4 text-[#5865F2]" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Discord</div>
                    <div className="text-sm font-semibold">{player.discord}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Looking for team badge */}
          {player.looking_for_team && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Users className="h-3 w-3" /> Ищет команду
            </div>
          )}
        </div>

      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onConfirm={handleReport}
        loading={reporting}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
