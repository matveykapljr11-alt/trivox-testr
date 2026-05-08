import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Swords, Users, Search, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// ─── COUNT UP ───────────────────────────────────────────────────────────────
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        let start = 0
        const duration = 1400
        const step = (timestamp: number) => {
          if (!start) start = timestamp
          const progress = Math.min((timestamp - start) / duration, 1)
          setVal(Math.floor(progress * to))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])

  return <span ref={ref}>{val.toLocaleString('ru')}{suffix}</span>
}

// ─── PAGE HERO ──────────────────────────────────────────────────────────────
export function PageHero({
  eyebrow, title, description, children,
}: {
  eyebrow: string
  title: ReactNode
  description: string
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-hero">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-mesh absolute -top-32 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>
        <h1 className="mt-2 max-w-3xl text-4xl uppercase md:text-6xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  )
}

// ─── SITE FOOTER ────────────────────────────────────────────────────────────
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-electric">
              <span className="font-display text-sm text-primary-foreground">T</span>
            </div>
            <span className="font-display text-lg">TRIVOX</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Competitive-платформа для Standoff 2.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Платформа</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {[['Праки', '/praki'], ['Команды', '/teams'], ['Игроки', '/players'], ['Турниры', '/tournaments']].map(([l, to]) => (
              <li key={to}><Link to={to} className="text-muted-foreground hover:text-foreground transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Сообщество</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="https://discord.gg/VXRyzFzcP" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Discord</a></li>
            <li><a href="https://t.me/trivoxplt" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Telegram</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Компания</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>О нас</li><li>Правила</li><li>Поддержка</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TRIVOX. Все права защищены.
      </div>
    </footer>
  )
}

// ─── BOTTOM NAV (mobile) ─────────────────────────────────────────────────────
const bottomItems = [
  { to: '/praki', label: 'Праки', icon: Swords },
  { to: '/teams', label: 'Команды', icon: Users },
  { to: '/players', label: 'Игроки', icon: Search },
  { to: '/tournaments', label: 'Турниры', icon: Trophy },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {bottomItems.map((it) => {
          const active = pathname === it.to
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <it.icon className={`h-5 w-5 transition ${active ? 'scale-110' : ''}`} />
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ─── PAGE SHELL ──────────────────────────────────────────────────────────────
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BottomNav />
    </div>
  )
}
