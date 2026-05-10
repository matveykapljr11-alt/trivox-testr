import { useEffect, useState } from 'react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'
import { Users, Calendar, Plus, Trophy, Swords } from 'lucide-react'

function getDays() {
  const days = []
  const dayLabels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + i)
    days.push({ label: dayLabels[date.getDay()], date })
  }
  return days
}

const DAYS = getDays()

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function MyTeamPage() {
  const { user, isLoggedIn } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [scrims, setScrims] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
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

          const { data: s } = await supabase
            .from('scrims')
            .select('*')
            .eq('user_id', user!.id)
            .neq('status', 'cancelled')
          setScrims(s || [])

          const { data: tt } = await supabase
            .from('tournament_teams')
            .select('tournament_id')
            .eq('team_id', myTeam.id)

          if (tt && tt.length > 0) {
            const ids = tt.map((x: any) => x.tournament_id)
            const { data: tours } = await supabase
              .from('tournaments')
              .select('*')
              .in('id', ids)
            setTournaments(tours || [])
          }
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (!isLoggedIn) return <Navigate to="/" replace />

  const selectedDate = DAYS[selectedDay].date
  const dateStr = selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long' })

  const dayScrimEvents = scrims.filter(s => {
    if (!s.time_raw) return false
    return isSameDay(new Date(s.time_raw), selectedDate)
  })

  const dayTournamentEvents = tournaments.filter(t => {
    if (!t.start_date) return false
    return isSameDay(new Date(t.start_date + 'T00:00:00'), selectedDate)
  })

  const totalEvents = dayScrimEvents.length + dayTournamentEvents.length

  function dayHasEvents(date: Date) {
    const hasScrim = scrims.some(s => s.time_raw && isSameDay(new Date(s.time_raw), date))
    const hasTour = tournaments.some(t => t.start_date && isSameDay(new Date(t.start_date + 'T00:00:00'), date))
    return hasScrim || hasTour
  }

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

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Расписание
              </h3>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`press flex-shrink-0 flex flex-col items-center rounded-xl border px-4 py-3 transition relative ${
                      selectedDay === i
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted/40 hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase">{d.label}</span>
                    <span className="font-display text-lg">{d.date.getDate()}</span>
                    {dayHasEvents(d.date) && (
                      <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                        selectedDay === i ? 'bg-primary-foreground' : 'bg-primary'
                      }`} />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {dateStr} · {totalEvents > 0 ? `${totalEvents} событий` : 'нет событий'}
                </div>

                {totalEvents === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <p className="text-sm text-muted-foreground">Нет праков и турниров на этот день</p>
                    
                      href="/praki"
                      className="press mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-electric px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Запланировать прак
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayScrimEvents.map(scrim => {
                      const time = scrim.time_raw
                        ? new Date(scrim.time_raw).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
                        : scrim.time_text
                      return (
                        <div key={scrim.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-primary/10">
                            <Swords className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                Прак
                              </span>
                              <span className="text-xs text-muted-foreground">{time}</span>
                            </div>
                            <div className="mt-0.5 font-semibold text-sm truncate">{scrim.team_name}</div>
                            <div className="text-xs text-muted-foreground">{scrim.format} · {scrim.rank}</div>
                          </div>
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            scrim.status === 'open' ? 'bg-green-500/10 text-green-600' :
                            scrim.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {scrim.status === 'open' ? 'Открыт' : scrim.status === 'pending' ? 'Ждём' : scrim.status}
                          </div>
                        </div>
                      )
                    })}

                    {dayTournamentEvents.map(tour => (
                      <div key={tour.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-yellow-500/10">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-500/10 rounded-full px-2 py-0.5">
                              Турнир
                            </span>
                            {tour.start_time && (
                              <span className="text-xs text-muted-foreground">{tour.start_time}</span>
                            )}
                          </div>
                          <div className="mt-0.5 font-semibold text-sm truncate">{tour.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {tour.format}{tour.prize && tour.prize !== 'No prize' ? ` · 🏆 ${tour.prize}` : ''}
                          </div>
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          tour.status === 'open' ? 'bg-green-500/10 text-green-600' :
                          tour.status === 'upcoming' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {tour.status === 'open' ? 'Открыт' : tour.status === 'upcoming' ? 'Скоро' : tour.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
