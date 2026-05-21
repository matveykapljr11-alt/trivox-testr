import { useEffect, useState } from 'react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Navigate, Link } from 'react-router-dom'
import { Users, Calendar, Plus, Trophy, Swords, X, Clock, Map, MessageCircle, Send } from 'lucide-react'

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

function ScrimDetailModal({ scrim, open, onClose }: { scrim: any; open: boolean; onClose: () => void }) {
  if (!open || !scrim) return null
  const time = scrim.time_raw
    ? new Date(scrim.time_raw).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    : scrim.time_text
  const date = scrim.time_raw
    ? new Date(scrim.time_raw).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl uppercase">Детали прака</h2>
          </div>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="font-display text-2xl uppercase">{scrim.team_name}</div>
            <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              scrim.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
              scrim.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' :
              'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {scrim.status === 'confirmed' ? '✓ Подтверждён' : scrim.status === 'pending' ? '⏳ Ожидает' : '🟢 Открыт'}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Время</div>
                <div className="font-semibold text-sm">{date} в {time}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Формат</div>
                <div className="font-semibold text-sm">{scrim.format}</div>
              </div>
            </div>

            {scrim.maps?.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-border p-3">
                <Map className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Карты</div>
                  <div className="flex flex-wrap gap-1">
                    {scrim.maps.map((map: string) => (
                      <span key={map} className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-medium">{map}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {scrim.discord && (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <MessageCircle className="h-5 w-5 text-[#5865F2] flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Discord</div>
                  <div className="font-semibold text-sm">{scrim.discord}</div>
                </div>
              </div>
            )}

            {scrim.telegram && (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Send className="h-5 w-5 text-[#29B6F6] flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Telegram</div>
                  <div className="font-semibold text-sm">{scrim.telegram}</div>
                </div>
              </div>
            )}
          </div>

          <button onClick={onClose} className="press w-full rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

function TournamentDetailModal({ tour, open, onClose }: { tour: any; open: boolean; onClose: () => void }) {
  if (!open || !tour) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="font-display text-xl uppercase">Детали турнира</h2>
          </div>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="font-display text-2xl uppercase">{tour.name || tour.title}</div>
            {tour.description && <div className="mt-1 text-sm text-muted-foreground">{tour.description}</div>}
          </div>

          <div className="space-y-3">
            {tour.start_date && (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Дата</div>
                  <div className="font-semibold text-sm">{tour.start_date} {tour.start_time ? `· ${tour.start_time}` : ''}</div>
                </div>
              </div>
            )}
            {tour.format && (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Формат</div>
                  <div className="font-semibold text-sm">{tour.format}</div>
                </div>
              </div>
            )}
            {tour.prize && tour.prize !== 'No prize' && (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Призовой фонд</div>
                  <div className="font-semibold text-sm text-gradient">{tour.prize}</div>
                </div>
              </div>
            )}
            {tour.organizer && (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Организатор</div>
                  <div className="font-semibold text-sm">{tour.organizer}</div>
                </div>
              </div>
            )}
          </div>

          <button onClick={onClose} className="press w-full rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyTeamPage() {
  const { user, isLoggedIn } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [scrims, setScrims] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedScrim, setSelectedScrim] = useState<any>(null)
  const [selectedTour, setSelectedTour] = useState<any>(null)

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

          // Свои праки
          const { data: ownScrims } = await supabase
            .from('scrims')
            .select('*')
            .eq('user_id', user!.id)
            .neq('status', 'cancelled')

          // Праки где ты challenger и они подтверждены
          const { data: challenges } = await supabase
            .from('scrim_challenges')
            .select('scrim_id')
            .eq('challenger_id', user!.id)
            .eq('status', 'accepted')

          let challengedScrims: any[] = []
          if (challenges && challenges.length > 0) {
            const ids = challenges.map((c: any) => c.scrim_id)
            const { data: cs } = await supabase
              .from('scrims')
              .select('*')
              .in('id', ids)
            challengedScrims = cs || []
          }

          // Merge and deduplicate
          const allScrims = [...(ownScrims || []), ...challengedScrims]
          const unique = allScrims.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
          setScrims(unique)

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
            <Link to="/teams" className="press mt-4 inline-block rounded-lg bg-gradient-to-r from-primary to-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Создать команду
            </Link>
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
                    <Link to="/praki" className="press mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-electric px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                      <Plus className="h-3.5 w-3.5" /> Запланировать прак
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayScrimEvents.map(scrim => {
                      const time = scrim.time_raw
                        ? new Date(scrim.time_raw).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
                        : scrim.time_text
                      return (
                        <button
                          key={scrim.id}
                          onClick={() => setSelectedScrim(scrim)}
                          className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 hover:border-primary/40 hover:bg-muted/50 transition text-left"
                        >
                          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-primary/10">
                            <Swords className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5">Прак</span>
                              <span className="text-xs text-muted-foreground">{time}</span>
                            </div>
                            <div className="mt-0.5 font-semibold text-sm truncate">{scrim.team_name}</div>
                            <div className="text-xs text-muted-foreground">{scrim.format}</div>
                          </div>
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                            scrim.status === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                            scrim.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {scrim.status === 'confirmed' ? 'Подтверждён' : scrim.status === 'pending' ? 'Ждём' : 'Открыт'}
                          </div>
                        </button>
                      )
                    })}

                    {dayTournamentEvents.map(tour => (
                      <button
                        key={tour.id}
                        onClick={() => setSelectedTour(tour)}
                        className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 hover:border-yellow-500/40 hover:bg-muted/50 transition text-left"
                      >
                        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-yellow-500/10">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-500/10 rounded-full px-2 py-0.5">Турнир</span>
                            {tour.start_time && <span className="text-xs text-muted-foreground">{tour.start_time}</span>}
                          </div>
                          <div className="mt-0.5 font-semibold text-sm truncate">{tour.name || tour.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {tour.format}{tour.prize && tour.prize !== 'No prize' ? ` · 🏆 ${tour.prize}` : ''}
                          </div>
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                          tour.status === 'open' ? 'bg-green-500/10 text-green-600' :
                          tour.status === 'upcoming' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {tour.status === 'open' ? 'Открыт' : tour.status === 'upcoming' ? 'Скоро' : tour.status}
                        </div>
                      </button>
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

      <ScrimDetailModal scrim={selectedScrim} open={!!selectedScrim} onClose={() => setSelectedScrim(null)} />
      <TournamentDetailModal tour={selectedTour} open={!!selectedTour} onClose={() => setSelectedTour(null)} />
    </PageShell>
  )
}
