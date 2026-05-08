import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'
import { toast } from 'sonner'

const nav = [
  { to: '/praki', label: 'Праки' },
  { to: '/teams', label: 'Команды' },
  { to: '/players', label: 'Игроки' },
  { to: '/tournaments', label: 'Турниры' },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isLoggedIn, signOut } = useAuth()
  const { pathname } = useLocation()

  async function handleSignOut() {
    await signOut()
    setUserMenuOpen(false)
    toast.success('До встречи!')
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
          {/* Logo */}
          <Link to="/" className="press flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-electric shadow-glow">
              <span className="font-display text-sm text-primary-foreground">T</span>
            </div>
            <span className="font-display text-lg tracking-tight">TRIVOX</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`story-link py-2 text-sm font-medium transition-colors ${
                  pathname === n.to
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-active={pathname === n.to}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="press flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-muted"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-electric text-xs font-bold text-primary-foreground">
                    {user.avatar || user.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden md:block max-w-[100px] truncate">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-glow animate-slide-in-top">
                    <div className="border-b border-border px-4 py-3">
                      <div className="text-sm font-semibold">{user.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      >
                        <User className="h-4 w-4 text-muted-foreground" /> Мой профиль
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-muted"
                      >
                        <LogOut className="h-4 w-4" /> Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="hidden h-9 rounded-md px-3 text-sm font-medium text-foreground transition hover:bg-muted md:inline-flex md:items-center"
                >
                  Войти
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="press hidden h-9 items-center rounded-md bg-gradient-to-r from-primary to-electric px-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 md:inline-flex"
                >
                  Регистрация
                </button>
              </>
            )}

            {/* Mobile burger */}
            <button
              className="rounded-md p-2 md:hidden"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Меню"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden animate-slide-in-top">
            <div className="flex flex-col gap-1 p-3">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    pathname === n.to
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {n.label}
                </Link>
              ))}
              {!isLoggedIn && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMobileOpen(false); setAuthOpen(true) }}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); setAuthOpen(true) }}
                    className="press rounded-md bg-gradient-to-r from-primary to-electric px-3 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Регистрация
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
