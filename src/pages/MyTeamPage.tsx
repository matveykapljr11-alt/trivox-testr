import { useEffect, useState } from 'react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'
import { Users, Calendar, Plus } from 'lucide-react'

const DAYS = [
  { label: 'Вс', date: new Date(Date.now() + 0 * 86400000) },
  { label: 'Пн', date: new Date(Date.now() + 1 * 86400000) },
  { label: 'Вт', date: new Date(Date.now() + 2 * 86400000) },
  { label: 'Ср', date: new Date(Date.now() + 3 * 86400000) },
  { label: 'Чт', date: new Date(Date.now() + 4 * 86400000) },
  { label: 'Пт', date: new Date(Date.now() + 5 * 86400000) },
  { label: 'Сб', date: new Date(Date.now() + 6 * 86400000) },
]

export default function MyTeamPage() {
  const { user, isLoggedIn } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      try {
        const { data: myTeam } = await supabase
          .from('teams')
          .select('*')
          .eq('owner_id', user!.id)
          .single()
        if (myTeam) {
          setTeam(myTeam)
          const { data: m } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', myTeam.id)
          setMembers(m || [])
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [user])

  if (!isLoggedIn) return <Navigate to="/" replace />

  const selectedDate = DAYS[selectedDay].date
  const dateStr = selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long' })

  return (
    <PageShell>
      <PageHero
        eyebrow="Моя команда"
        title={<>Управление <span className="text-gradient">командой</span></>}
        description="Управляй своей командой, составом и расписанием."
      />
      <section className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        {loading ? (
          <div className="h-48 rounded-2xl skeleton" />
        ) : !team ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 font-display text-2xl uppercase">У тебя нет команды</h3>
            <p className="mt-2 text-sm text-muted-foreground">Создай команду на странице Команды</p>
            <a href="/teams" className="press mt-4 inline-block rounded-lg bg-gradient-to-r from-primary to-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Создать команду
            </a>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Team info */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-xl bg-gradient-to-br from-primary to-electric font-display text-xl text-primary-foreground">
                  {team.tag}
                </div>
                <div>
                  <h2 className="font-display text-2xl uppercase">{team.name}</h2>
                  <div className="text-sm text-muted-foreground">{team.region} · {team.status}</div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Расписание
              </h3>

              {/* Day picker */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}

className={`press flex-shrink-0 flex flex-col items-center rounded-xl border px-4 py-3 transition ${
                      selectedDay === i
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted/40 hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase">{d.label}</span>
                    <span className="font-display text-lg">{d.date.getDate()}</span>
                  </button>
                ))}
              </div>

              {/* Events for selected day */}
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {dateStr}
                </div>
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">Нет праков на этот день</p>
                  <button className="press mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-electric px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                    <Plus className="h-3.5 w-3.5" /> Запланировать прак
                  </button>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Состав ({members.length})
              </h3>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока нет участников</p>
              ) : (
                <div className="space-y-3">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-electric/20 font-display text-sm text-primary">
                          {m.role?.[0] || 'P'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{m.user_id}</div>
                          <div className="text-xs text-muted-foreground">{m.role} · {m.rank}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </PageShell>
  )
}
