import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, Clock, Users } from 'lucide-react'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { supabase } from '../lib/supabase'

// Главная фаза 1 — один CTA, всё ведёт в Праки

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [activeScrims, setActiveScrims] = useState(0)
  const [onlinePlayers, setOnlinePlayers] = useState(0)

  useEffect(() => {
    async function loadLiveStats() {
      try {
        // Активные открытые праки
        const { count: scrimCount } = await supabase
          .from('scrims')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')

        // Всего игроков (пока заменим на онлайн позже)
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
      <section className="relative overflow-hidden bg-dark min-h-[calc(100vh-4rem)]">
        {/* Фон */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute -top-40 left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-mesh animate-float opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background" />
        </div>

        {/* Live статус сверху */}
        <div className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 md:px-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-60 animate-pulse-ring" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span>Standoff 2 · Live</span>
            </div>
            <div className="flex items-center gap-4 font-mono-tabular">
              <span className="hidden sm:inline">{onlinePlayers} игроков</span>
              <span className="hidden sm:inline text-white/30">/</span>
              <span>{activeScrims} ищут прак</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-16 md:px-6 md:pb-24 md:pt-24">
          <div className="text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-neon backdrop-blur animate-fade-in-up">
              <Zap className="h-3 w-3" />
              <span>найди прак за 2 минуты</span>
            </div>

            <h1 className="font-display uppercase text-white animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <span className="block text-[clamp(2.8rem,10vw,8rem)] leading-[0.85]">FIND</span>
              <span className="block text-[clamp(2.8rem,10vw,8rem)] leading-[0.85] text-neon italic">your match.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-base text-white/70 md:text-lg animate-fade-in-up" style={{ animationDelay: '160ms' }}>
              Прак-платформа для Standoff 2. Никаких 20 экранов профиля — только тиммейты, которые хотят играть прямо сейчас.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up" style={{ animationDelay: '240ms' }}>
              <button
                onClick={handleCTA}
                className="press group relative inline-flex h-16 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-electric to-neon px-10 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-glow animate-glow-pulse"
              >
                <span className="relative z-10">
                  {isLoggedIn ? 'Найти прак' : 'Начать играть'}
                </span>
                <ArrowRight className="relative z-10 h-5 w-5 transition group-hover:translate-x-1" />
              </button>
            </div>

            {/* Соцдоказательство — три числа */}
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-3 md:gap-6 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-center gap-1.5 text-neon">
                  <Clock className="h-4 w-4" />
                  <span className="font-display text-2xl md:text-4xl font-mono-tabular">~2</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 md:text-xs">мин на поиск</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-center gap-1.5 text-neon">
                  <Users className="h-4 w-4" />
                  <span className="font-display text-2xl md:text-4xl font-mono-tabular">{onlinePlayers}</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 md:text-xs">игроков</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-center gap-1.5 text-neon">
                  <Zap className="h-4 w-4" />
                  <span className="font-display text-2xl md:text-4xl font-mono-tabular">{activeScrims}</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 md:text-xs">ищут сейчас</div>
              </div>
            </div>
          </div>
        </div>

        {/* Простое «как работает» — 3 шага без воды */}
        <div className="relative z-10 border-t border-white/10 bg-black/30">
          <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { n: '01', t: 'Скажи, что ищешь', d: 'Формат, время, ранг. 10 секунд.' },
                { n: '02', t: 'Найди соперника', d: 'Видишь, кто ищет прямо сейчас. Один клик.' },
                { n: '03', t: 'Играй', d: 'Контакты в Telegram, договариваетесь — и в игру.' },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="font-display text-3xl text-neon font-mono-tabular">{s.n}</div>
                  <div className="mt-2 font-display text-lg uppercase tracking-wide text-white">{s.t}</div>
                  <p className="mt-1 text-sm text-white/65">{s.d}</p>
                </div>
              ))}
            </div>

            {!isLoggedIn && (
              <div className="mt-10 text-center animate-fade-in-up" style={{ animationDelay: '360ms' }}>
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

        {/* Footer-микро */}
        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 text-xs text-white/40 md:px-6">
            <div className="font-mono-tabular">TRIVOX · Season 01</div>
            
              href="https://discord.gg/VXRyzFzcP"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white/80 transition"
            >
              Discord →
            </a>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
