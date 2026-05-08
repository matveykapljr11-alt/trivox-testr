import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Swords, Users, Search, Trophy, ArrowRight, Zap, Shield, Target } from 'lucide-react'
import { PageShell, CountUp } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { toast } from 'sonner'

// ─── LIVE TICKER ─────────────────────────────────────────────────────────────
const live = [
  { a: 'VOID', b: 'Echo.GG', score: '10 : 8', map: 'Sandstone' },
  { a: 'NorthFrame', b: 'Static Wave', score: '6 : 7', map: 'Rust' },
  { a: 'Polar Wolves', b: 'Halo Squad', score: '12 : 4', map: 'Sakura' },
  { a: 'Blue Phoenix', b: 'Crimson Pact', score: '9 : 9', map: 'Province' },
  { a: 'Echo.GG', b: 'Static Wave', score: '11 : 6', map: 'Zone 9' },
]

function LiveTicker() {
  const items = [...live, ...live]
  return (
    <div className="relative overflow-hidden border-y border-border bg-card/60">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-ticker gap-3 py-3">
        {items.map((m, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 rounded-full border border-border bg-background px-4 py-1.5 text-xs">
            <span className="flex h-2 w-2 rounded-full bg-danger animate-pulse" />
            <span className="font-semibold uppercase tracking-wide">LIVE</span>
            <span className="text-muted-foreground">{m.a}</span>
            <span className="font-display text-gradient">{m.score}</span>
            <span className="text-muted-foreground">{m.b}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{m.map}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── QUICK QUEUE ─────────────────────────────────────────────────────────────
const formats = ['1x1', '2x2', '5x5'] as const
type Fmt = typeof formats[number]

function QuickQueue() {
  const [fmt, setFmt] = useState<Fmt>('5x5')
  const [searching, setSearching] = useState(false)
  const { isLoggedIn } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  const start = () => {
    if (!isLoggedIn) { setAuthOpen(true); return }
    setSearching(true)
    toast.success(`Ищем матч ${fmt}`, { description: 'Среднее время поиска — 35 секунд' })
    setTimeout(() => {
      setSearching(false)
      toast('Матч найден!', { description: `${fmt} · MR12 · Sandstone` })
    }, 2400)
  }

  return (
    <>
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" /> Быстрый поиск прака
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFmt(f)}
                className={`rounded-md py-2 text-sm font-semibold transition ${
                  fmt === f ? 'bg-background shadow-soft text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={start}
            disabled={searching}
            className="press inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-electric px-5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-70"
          >
            {searching ? 'Поиск...' : 'Найти'}
          </button>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-dark">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-mesh animate-float" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-background" />
        </div>

        {/* Status bar */}
        <div className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 md:px-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-60 animate-pulse-ring" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span>Season 01 · Standoff 2</span>
            </div>
            <div className="hidden md:flex items-center gap-4 font-mono-tabular">
              <span>1,284 онлайн</span>
              <span className="text-white/30">/</span>
              <span>27 матчей сейчас</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-12 md:px-6 md:pb-32 md:pt-20">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80 backdrop-blur animate-fade-in-up">
              competitive · mobile · esports
            </div>

            <h1 className="font-display uppercase text-white animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <span className="block text-[clamp(3rem,11vw,9rem)] leading-[0.85]">PLAY</span>
              <span className="block text-[clamp(3rem,11vw,9rem)] leading-[0.85] text-stroke text-white/90 italic">to&nbsp;win.</span>
              <span className="mt-2 block text-[clamp(2.5rem,9vw,7rem)] leading-[0.85] text-neon">RISE.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-base text-white/70 md:text-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              TRIVOX — competitive-платформа для Standoff 2.
              Праки, поиск тиммейтов, открытые турниры и честный рейтинг.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up" style={{ animationDelay: '280ms' }}>
              <button
                onClick={() => isLoggedIn ? null : setAuthOpen(true)}
                className="press group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary via-electric to-neon px-8 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-glow animate-glow-pulse"
              >
                <span className="relative z-10">Начать играть</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <Link
                to="/tournaments"
                className="press inline-flex h-14 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 text-sm font-bold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/10"
              >
                Турниры сезона
              </Link>
            </div>

            <QuickQueue />

            {/* Stats */}
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-3 md:gap-6">
              {[
                { v: 12000, suffix: '+', l: 'Игроков' },
                { v: 1800, suffix: '', l: 'Команд' },
                { v: 240, suffix: '', l: 'Турниров' },
              ].map((s, i) => (
                <div
                  key={s.l}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-neon/40 hover:bg-white/10 animate-fade-in-up"
                  style={{ animationDelay: `${400 + i * 80}ms` }}
                >
                  <div className="font-display text-3xl text-white font-mono-tabular md:text-5xl">
                    <CountUp to={s.v} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 md:text-xs">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative z-10 overflow-hidden border-y border-white/10 bg-black/30 py-3">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
            {Array.from({ length: 2 }).flatMap((_, k) =>
              ['PRAKI', '5v5', 'RANKED', 'TOURNAMENTS', 'STANDOFF 2', 'OPEN BRACKETS', 'PRIZE POOLS', 'CLIMB THE LADDER'].map((w, i) => (
                <span key={`${k}-${i}`} className="flex items-center gap-10 font-display text-2xl uppercase tracking-tight text-white/30 md:text-4xl">
                  {w} <span className="text-neon">★</span>
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      <LiveTicker />

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">// Что внутри</div>
          <h2 className="mt-3 text-4xl uppercase md:text-7xl">
            Всё для <span className="text-gradient italic">competitive</span>-сцены
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Один аккаунт — все возможности от соло-игрока до призёра турниров.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Swords, t: 'Праки', d: 'Тренировочные матчи против команд твоего уровня. Без воды, по делу.', to: '/praki' },
            { icon: Users, t: 'Поиск команды', d: 'Найди ростер, который подходит по графику, рангу и роли.', to: '/teams' },
            { icon: Search, t: 'Поиск игроков', d: 'Подбирай тиммейтов с нужными навыками и стилем игры.', to: '/players' },
            { icon: Trophy, t: 'Турниры', d: 'Открытые сетки, призы и путь до профессиональной сцены.', to: '/tournaments' },
          ].map((f, i) => (
            <Link
              key={f.t}
              to={f.to}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-glow animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute right-4 top-4 font-display text-xs text-muted-foreground/40 font-mono-tabular">0{i + 1}</div>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-electric text-primary-foreground shadow-soft transition-transform group-hover:scale-110 group-hover:rotate-3">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl uppercase">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary opacity-0 transition group-hover:opacity-100">
                Открыть <ArrowRight className="h-3 w-3" />
              </div>
              <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-dark py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-14 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">// Как это работает</div>
              <h2 className="mt-3 text-4xl uppercase text-white md:text-7xl">
                От нуля до <span className="text-neon">победы</span> — за 3 шага
              </h2>
              <p className="mt-4 max-w-md text-white/70 md:text-lg">
                Никакой бюрократии. Регистрируйся, подключай ник Standoff 2 и заходи в игру.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { n: '01', icon: Shield, t: 'Создай профиль', d: 'Привяжи ник Standoff 2, выбери роли и предпочитаемое время игры.' },
                { n: '02', icon: Target, t: 'Найди матч', d: 'Зайди в очередь праков, собери ростер или зарегистрируйся в турнире.' },
                { n: '03', icon: Zap, t: 'Поднимай рейтинг', d: 'Выигрывай матчи, поднимайся в рейтинге и получай приглашения от топ-команд.' },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className="group flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-0.5 hover:border-neon/40 hover:bg-white/10 animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="font-display text-4xl text-white/20 font-mono-tabular md:text-5xl group-hover:text-neon transition-colors">{s.n}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-neon" />
                      <h3 className="font-display text-lg uppercase tracking-wide text-white">{s.t}</h3>
                    </div>
                    <p className="mt-1 text-sm text-white/65">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-dark p-8 text-white shadow-glow md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl animate-float" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-neon/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">// Ready up</div>
            <h2 className="mt-3 text-4xl uppercase md:text-7xl">
              Готов выйти<br />на <span className="text-neon italic">сцену</span>?
            </h2>
            <p className="mt-4 max-w-md text-white/70 md:text-lg">
              Создай аккаунт TRIVOX и присоединяйся к тысячам игроков, которые уже тренируются и побеждают.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!isLoggedIn ? (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="press inline-flex h-14 items-center gap-2 rounded-lg bg-white px-8 text-sm font-bold uppercase tracking-wider text-foreground transition hover:opacity-90"
                >
                  Создать аккаунт <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to="/praki"
                  className="press inline-flex h-14 items-center gap-2 rounded-lg bg-white px-8 text-sm font-bold uppercase tracking-wider text-foreground transition hover:opacity-90"
                >
                  Найти прак <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <a
                href="https://discord.gg/VXRyzFzcP"
                target="_blank"
                rel="noreferrer"
                className="press inline-flex h-14 items-center rounded-lg border border-white/30 bg-white/5 px-8 text-sm font-bold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/10"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
