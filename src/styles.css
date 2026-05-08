@import "tailwindcss" source(none);
@source "../src";

@theme inline {
  --font-display: "Archivo Black", system-ui, sans-serif;
  --font-sans: "Hind", system-ui, sans-serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-ice: var(--ice);
  --color-electric: var(--electric);
  --color-deep: var(--deep);
  --color-neon: var(--neon);
  --color-danger: var(--danger);

  --shadow-glow: 0 20px 60px -20px color-mix(in oklab, var(--primary) 45%, transparent);
  --shadow-soft: 0 8px 24px -12px color-mix(in oklab, var(--deep) 25%, transparent);
  --radius: 0.75rem;
}

:root {
  --background: oklch(0.985 0.008 230);
  --foreground: oklch(0.18 0.05 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.05 250);
  --primary: oklch(0.62 0.18 245);
  --primary-foreground: oklch(1 0 0);
  --muted: oklch(0.96 0.015 230);
  --muted-foreground: oklch(0.48 0.04 245);
  --accent: oklch(0.88 0.07 230);
  --accent-foreground: oklch(0.22 0.08 250);
  --border: oklch(0.9 0.02 235);
  --input: oklch(0.92 0.02 235);
  --ring: oklch(0.62 0.18 245);
  --ice: oklch(0.96 0.03 225);
  --electric: oklch(0.7 0.2 240);
  --deep: oklch(0.18 0.06 260);
  --neon: oklch(0.85 0.2 195);
  --danger: oklch(0.68 0.24 28);
  --gradient-primary: linear-gradient(135deg, oklch(0.62 0.18 245), oklch(0.74 0.16 220));
  --gradient-neon: linear-gradient(135deg, oklch(0.7 0.2 240), oklch(0.85 0.2 195));
  --gradient-hero: radial-gradient(ellipse at top, oklch(0.88 0.08 230) 0%, oklch(0.985 0.008 230) 60%);
  --gradient-dark: radial-gradient(ellipse at 50% 0%, oklch(0.28 0.12 255) 0%, oklch(0.12 0.05 255) 70%);
  --gradient-mesh: conic-gradient(from 180deg at 50% 50%, oklch(0.88 0.07 230), oklch(0.96 0.03 225), oklch(0.74 0.16 220), oklch(0.88 0.07 230));
  --grid-color: color-mix(in oklab, oklch(0.62 0.18 245) 14%, transparent);
}

@layer base {
  * { border-color: var(--color-border); }
  html { scroll-behavior: smooth; }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    padding-bottom: env(safe-area-inset-bottom);
  }
  @media (max-width: 767px) { body { padding-bottom: 64px; } }
  h1, h2, h3, h4 {
    font-family: var(--font-display);
    letter-spacing: -0.035em;
    line-height: 0.92;
  }
  h1 { letter-spacing: -0.045em; }
}

@utility text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
@utility text-neon {
  background: var(--gradient-neon);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
@utility text-stroke {
  -webkit-text-stroke: 1.5px currentColor;
  color: transparent;
}
@utility bg-hero { background: var(--gradient-hero); }
@utility bg-dark {
  background: var(--gradient-dark);
  color: oklch(0.97 0.01 230);
}
@utility bg-grid {
  background-image:
    linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
}
@utility bg-mesh {
  background: var(--gradient-mesh);
  filter: blur(60px);
  opacity: 0.45;
}
@utility font-mono-tabular {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

@keyframes float-slow { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--primary) 50%, transparent); }
  100% { box-shadow: 0 0 0 18px transparent; }
}
@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes scale-in {
  0% { opacity: 0; transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes slide-in-top {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes marquee-x { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--neon) 0%, transparent), 0 20px 60px -20px color-mix(in oklab, var(--primary) 60%, transparent); }
  50% { box-shadow: 0 0 40px 8px color-mix(in oklab, var(--neon) 35%, transparent), 0 20px 80px -20px color-mix(in oklab, var(--primary) 80%, transparent); }
}
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.animate-marquee { animation: marquee-x 30s linear infinite; }
.animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
.animate-float { animation: float-slow 6s ease-in-out infinite; }
.animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
.animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
.animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
.animate-slide-in-top { animation: slide-in-top 0.25s ease-out both; }
.animate-ticker { animation: ticker 40s linear infinite; }

.hover-scale { transition: transform 0.2s ease; }
.hover-scale:hover { transform: scale(1.03); }

.story-link { position: relative; display: inline-block; }
.story-link::after {
  content: "";
  position: absolute;
  left: 0; bottom: -2px;
  width: 100%; height: 2px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}
.story-link:hover::after,
.story-link[data-active="true"]::after { transform: scaleX(1); transform-origin: left; }

.press { transition: transform 0.15s ease; }
.press:active { transform: scale(0.97); }

.skeleton {
  background: linear-gradient(90deg, var(--muted) 0%, color-mix(in oklab, var(--muted) 60%, white) 50%, var(--muted) 100%);
  background-size: 800px 100%;
  animation: shimmer 1.4s linear infinite;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: oklch(0.96 0.015 230); }
::-webkit-scrollbar-thumb { background: oklch(0.75 0.04 240); border-radius: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
