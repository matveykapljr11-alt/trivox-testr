import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-start justify-end overflow-hidden bg-dark pb-12 pl-8 md:pl-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-mesh animate-float opacity-30" />

      <div className="pointer-events-none absolute inset-0 z-0">
        <svg viewBox="0 0 1000 660" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.12 0.05 255)" />
              <stop offset="100%" stopColor="oklch(0.18 0.06 260)" />
            </linearGradient>
            <radialGradient id="cityGlow" cx="50%" cy="80%" r="60%">
              <stop offset="0%" stopColor="oklch(0.62 0.18 245)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="1000" height="660" fill="url(#skyGrad)" />
          <rect width="1000" height="660" fill="url(#cityGlow)" />
          <g fill="rgba(255,255,255,0.5)">
            <circle cx="115" cy="28" r="0.7"/><circle cx="275" cy="14" r="0.55"/>
            <circle cx="445" cy="22" r="0.65"/><circle cx="615" cy="9" r="0.5"/>
            <circle cx="785" cy="33" r="0.7"/><circle cx="925" cy="18" r="0.55"/>
          </g>
          <g fill="oklch(0.14 0.04 255)" opacity="0.9">
            <rect x="0" y="320" width="60" height="340"/>
            <rect x="70" y="260" width="80" height="400"/>
            <rect x="160" y="300" width="50" height="360"/>
            <rect x="220" y="240" width="90" height="420"/>
            <rect x="700" y="280" width="70" height="380"/>
            <rect x="780" y="340" width="55" height="320"/>
            <rect x="845" y="270" width="85" height="390"/>
            <rect x="940" y="310" width="60" height="350"/>
          </g>
          <g fill="oklch(0.74 0.16 220)" opacity="0.35">
            <rect x="10" y="340" width="8" height="5" rx="1"/>
            <rect x="80" y="280" width="10" height="6" rx="1"/>
            <rect x="230" y="260" width="12" height="7" rx="1"/>
            <rect x="710" y="300" width="10" height="6" rx="1"/>
            <rect x="855" y="290" width="12" height="7" rx="1"/>
          </g>
          <path d="M0 500 L1000 380 L1000 660 L0 660 Z" fill="oklch(0.13 0.03 250)" opacity="0.95"/>
          <rect x="0" y="580" width="1000" height="80" fill="url(#skyGrad)" opacity="0.6"/>
        </svg>
      </div>

      <div className="absolute left-0 right-0 top-0 z-20 flex h-16 items-center border-b border-white/10 px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-electric shadow-glow">
            <span className="font-display text-xs text-primary-foreground">T</span>
          </div>
          <span className="font-display text-base tracking-tight text-white">TRIVOX</span>
        </Link>
      </div>

      <div className="relative z-10 max-w-2xl">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-neon mb-3">// Error 404</div>
        <div
          className="font-display uppercase leading-[0.85] select-none text-gradient"
          style={{ fontSize: 'clamp(80px, 18vw, 200px)', animation: 'glitch404 5s infinite' }}
        >
          404
        </div>
        <div className="mt-2 font-display text-xs uppercase tracking-[0.25em] text-white/40">
          PAGE_NOT_FOUND · STANDOFF_2 · TRIVOX
        </div>
        <p className="mt-5 max-w-md text-sm text-white/60 md:text-base">
          Эта страница пропала как моб после round end.{' '}
          <span className="text-white/90 font-semibold">Вернись на базу.</span>
        </p>

<div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="press inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-bold uppercase tracking-wider text-foreground transition hover:opacity-90">
            <ArrowLeft className="h-4 w-4" /> На главную
          </Link>
          <Link to="/praki" className="press inline-flex h-12 items-center rounded-lg border border-white/20 bg-white/5 px-6 text-sm font-bold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/10">
            Найти прак
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes glitch404 {
          0%,90%,100% { transform:none; filter:none; }
          91% { transform:translate(-4px,0); filter:hue-rotate(60deg) brightness(1.3); }
          92% { transform:translate(4px,0); filter:hue-rotate(-60deg); }
          93% { transform:none; filter:none; }
          94% { transform:translate(-2px,1px); }
          95% { transform:none; }
        }
      `}</style>
    </div>
  )
}
