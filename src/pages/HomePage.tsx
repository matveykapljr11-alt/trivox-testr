import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, Clock, Users } from 'lucide-react'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [activeScrims, setActiveScrims] = useState(0)
  const [onlinePlayers, setOnlinePlayers] = useState(0)

  useEffect(() => {
    async function loadLiveStats() {
      try {
        const { count: scrimCount } = await supabase
          .from('scrims')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')

        const { count: userCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })

        setActiveScrims(scrimCount || 0)
        setOnlinePlayers(userCount || 0)
      } catch {
        // ignore
      }
    }
    loadLiveStats()
    const interval = setInterval(loadLiveStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate('/praki')
    } else {
      setAuthOpen(true)
    }
  }

  return (
    <PageShell>
      <div className="relative overflow-hidden bg-dark min-h-[calc(100vh-4rem)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute -top-40 left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-mesh opacity-80" />
        </div>

        <div className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 md:px-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span>Standoff 2 Live</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">{onlinePlayers} игроков</span>
              <span className="hidden sm:inline text-white/30">/</span>
              <span>{activeScrims} ищут прак</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-16 md:px-6 md:pb-24 md:pt-24">
          <div className="text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-neon backdrop-blur">
              <Zap className="h-3 w-3" />
              <span>найди прак за 2 минуты</span>
            </div>

            <h1 className="font-display uppercase text-white">
              <span className="block text-[clamp(2.8rem,10vw,8rem)] leading-[0.85]">FIND</span>
              <span className="block text-[clamp(2.8rem,10vw,8rem)] leading-[0.85] text-neon italic">your match.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-base text-white/70 md:text-lg">
              Прак-платформа для Standoff 2. Никаких 20 экранов профиля — только тиммейты, которые хотят играть прямо сейчас.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={handleCTA}
                className="press group inline-flex h-16 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary via-electric to-neon px-10 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-glow"
              >
                <span>{isLoggedIn ? 'Найти прак' : 'Начать играть'}</span>
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
            </div>

            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-3 md:gap-6">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-center gap-1.5 text-neon">
                  <Clock className="h-4 w-4" />
                  <span className="font-display text-2xl md:text-4xl">~2</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 md:text-xs">мин на поиск</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-center gap-1.5 text-neon">
                  <Users className="h-4 w-4" />
                  <span className="font-display text-2xl md:text-4xl">{onlinePlayers}</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 md:text-xs">игроков</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-center gap-1.5 text-neon">
                  <Zap className="h-4 w-4" />
                  <span className="font-display text-2xl md:text-4xl">{activeScrims}</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 md:text-xs">ищут сейчас</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 bg-black/30">
          <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="font-display text-3xl text-neon">01</div>
                <div className="mt-2 font-display text-lg uppercase tracking-wide text-white">Скажи, что ищешь</div>
                <p className="mt-1 text-sm text-white/65">Формат, время, ранг. 10 секунд.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="font-display text-3xl text-neon">02</div>
                <div className="mt-2 font-display text-lg uppercase tracking-wide text-white">Найди соперника</div>
                <p className="mt-1 text-sm text-white/65">Видишь, кто ищет прямо сейчас. Один клик.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="font-display text-3xl text-neon">03</div>
                <div className="mt-2 font-display text-lg uppercase tracking-wide text-white">Играй</div>
                <p className="mt-1 text-sm text-white/65">Контакты в Telegram, договариваетесь — и в игру.</p>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="press inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 text-sm font-bold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/10"
                >
                  Войти через Google
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 text-xs text-white/40 md:px-6">
            <div>TRIVOX Season 01</div>
            <a href="https://discord.gg/VXRyzFzcP" target="_blank" rel="noreferrer" className="hover:text-white/80 transition">Discord</a>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
