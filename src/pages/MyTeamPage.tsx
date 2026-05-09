import { useEffect, useState } from 'react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'
import { Users, Trophy, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function MyTeamPage() {
  const { user, isLoggedIn } = useAuth()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <PageShell>
      <PageHero
        eyebrow="Моя команда"
        title={<>Управление <span className="text-gradient">командой</span></>}
        description="Управляй своей командой, составом и настройками."
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
