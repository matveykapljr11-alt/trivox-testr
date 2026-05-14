import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Users, Trophy, MessageCircle, Send, ArrowLeft, Swords } from 'lucide-react'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function TeamProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [scrims, setScrims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', id)
          .single()

        if (teamData) {
          setTeam(teamData)

          const { data: membersData } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', id)

          setMembers(membersData || [])

          // Load team's open scrims
          const { data: scrimsData } = await supabase
            .from('scrims')
            .select('*')
            .eq('user_id', teamData.owner_id)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(3)

          setScrims(scrimsData || [])
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleJoin() {
    if (!isLoggedIn) { setAuthOpen(true); return }
    if (!team || !user) return
    setJoining(true)
    try {
      await supabase.from('join_requests').insert({
        team_id: team.id,
        user_id: user.id,
        user_name: user.name,
        status: 'pending',
      })
      toast.success('Заявка отправлена!', { description: `Капитан ${team.name} рассмотрит твою заявку` })
    } catch {
      toast.error('Ошибка отправки заявки')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="h-48 rounded-2xl skeleton" />
        </div>
      </PageShell>
    )
  }

  if (!team) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="font-display text-2xl uppercase">Команда не найдена</h2>
          <button onClick={() => navigate('/teams')} className="press mt-4 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
            ← Все команды
          </button>
        </div>
      </PageShell>
    )
  }

  const initials = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const isOwner = user?.id === team.owner_id
  const isOpen = team.status?.toLowerCase().includes('набор') || team.status?.toLowerCase().includes('ищут')

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="press inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-electric font-display text-2xl text-primary-foreground shadow-soft">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl uppercase">{team.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {team.region}</span>
                <span className="font-mono text-xs">[{team.tag}]</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isOpen ? 'border border-primary/30 bg-primary/10 text-primary' : 'border border-border bg-muted'
                }`}>
                  <Users className="h-3 w-3" /> {team.status}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-display text-2xl">{team.rating || 1000}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Рейтинг</div>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-display text-2xl">{members.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Игроков</div>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-display text-2xl">{team.wins || 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Побед</div>
            </div>
          </div>

          {/* Actions */}
          {!isOwner && (
            <div className="mt-5 flex gap-3">
              {isOpen && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="press flex-1 rounded-xl bg-gradient-to-r from-primary to-electric py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {joining ? 'Отправляем...' : 'Подать заявку'}
                </button>
              )}
              {team.discord && (
                <a
                  href={team.discord.startsWith('http') ? team.discord : `https://discord.gg/${team.discord}`}
                  target="_blank"
                  rel="noreferrer"
                  className="press flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
                >
                  <MessageCircle className="h-4 w-4" /> Discord
                </a>
              )}
              {team.telegram && (
                <a
                  href={team.telegram.startsWith('http') ? team.telegram : `https://t.me/${team.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="press flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
                >
                  <Send className="h-4 w-4" /> Telegram
                </a>
              )}
            </div>
          )}
        </div>

        {/* Contacts */}
        {(team.discord || team.telegram) && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4">Контакты</h2>
            <div className="space-y-3">
              {team.discord && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <MessageCircle className="h-5 w-5 text-[#5865F2]" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Discord</div>
                    <div className="text-sm font-medium">{team.discord}</div>
                  </div>
                </div>
              )}
              {team.telegram && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <Send className="h-5 w-5 text-[#29B6F6]" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Telegram</div>
                    <div className="text-sm font-medium">{team.telegram}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Состав ({members.length})
          </h2>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Состав пока пуст</p>
          ) : (
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-electric/20 font-display text-sm text-primary">
                      {m.role?.[0] || 'P'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{m.user_id}</div>
                      <div className="text-xs text-muted-foreground">{m.role}{m.rank ? ` · ${m.rank}` : ''}</div>
                    </div>
                  </div>
                  {m.user_id === team.owner_id && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Капитан</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active scrims */}
        {scrims.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" /> Открытые праки
            </h2>
            <div className="space-y-2">
              {scrims.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                  <div>
                    <div className="text-sm font-semibold">{s.format}</div>
                    <div className="text-xs text-muted-foreground">{s.time_text}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.maps?.slice(0, 2).map((map: string) => (
                      <span key={map} className="rounded-md bg-accent/60 px-2 py-0.5 text-xs">{map}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trophy placeholder */}
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Trophy className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">История турниров появится здесь</p>
        </div>

      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
