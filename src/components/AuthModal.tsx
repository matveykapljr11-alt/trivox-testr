import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: Props) {
  const { signInWithDiscord, signInWithGoogle, needsProfile, completeRegistration } = useAuth()
  const [nick, setNick] = useState('')
  const [telegram, setTelegram] = useState('')
  const [gameId, setGameId] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleComplete() {
    if (!nick.trim()) { toast.error('Введи ник'); return }
    if (!telegram.trim()) { toast.error('Укажи Telegram — он обязателен'); return }
    setLoading(true)
    try {
      await completeRegistration(nick.trim(), telegram.trim().replace('@', ''), gameId.trim())
      toast.success('Добро пожаловать, ' + nick + '!')
      onClose()
    } catch {
      toast.error('Ошибка сохранения профиля')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-scale-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card shadow-glow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-electric">
              <span className="font-display text-xs text-primary-foreground">T</span>
            </div>
            <span className="font-display text-base tracking-tight">TRIVOX</span>
          </div>
          <button onClick={onClose} className="press rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {!needsProfile ? (
            /* Step 1 — Auth methods */
            <>
              <h2 className="font-display text-2xl uppercase">Войти в TRIVOX</h2>
              <p className="mt-1 text-sm text-muted-foreground">Присоединяйся к тысячам игроков Standoff 2</p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={signInWithDiscord}
                  className="press flex h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:border-primary/40 hover:bg-muted"
                >
                  {/* Discord icon */}
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Войти через Discord
                </button>

                <button
                  onClick={signInWithGoogle}
                  className="press flex h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:border-primary/40 hover:bg-muted"
                >
                  {/* Google icon */}
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Войти через Google
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Регистрируясь, ты соглашаешься с правилами платформы
              </p>
            </>
          ) : (
            /* Step 2 — Complete profile */
            <>
              <h2 className="font-display text-2xl uppercase">Заполни профиль</h2>
              <p className="mt-1 text-sm text-muted-foreground">Последний шаг — и ты в игре</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ник / имя *
                  </label>
                  <input
                    value={nick}
                    onChange={e => setNick(e.target.value)}
                    placeholder="Твой игровой ник"
                    className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Telegram * (для связи по пракам)
                  </label>
                  <input
                    value={telegram}
                    onChange={e => setTelegram(e.target.value)}
                    placeholder="@username"
                    className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Game ID в Standoff 2
                  </label>
                  <input
                    value={gameId}
                    onChange={e => setGameId(e.target.value)}
                    placeholder="Твой ID в игре"
                    className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="press mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-electric text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? 'Сохраняем...' : 'Войти в платформу →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
