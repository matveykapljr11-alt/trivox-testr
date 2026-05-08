import { useState } from 'react'
import { PageShell, PageHero } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'
import { Save, User } from 'lucide-react'

const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legendary', 'Mythic I', 'Mythic II', 'Champion']
const ROLES = ['player', 'IGL', 'AWP', 'Entry', 'Support', 'Lurker', 'Coach']

export default function ProfilePage() {
  const { user, isLoggedIn, updateProfile } = useAuth()
  const [nick, setNick] = useState(user?.name || '')
  const [telegram, setTelegram] = useState(user?.telegram || '')
  const [gameId, setGameId] = useState(user?.game_id || '')
  const [rankMm, setRankMm] = useState(user?.rank_mm || 'Legendary')
  const [kd, setKd] = useState(user?.kd?.toString() || '')
  const [hours, setHours] = useState(user?.hours?.toString() || '')
  const [role, setRole] = useState(user?.role || 'player')
  const [saving, setSaving] = useState(false)

  if (!isLoggedIn) return <Navigate to="/" replace />

  async function handleSave() {
    setSaving(true)
    try {
      const updates = {
        name: nick.trim() || user!.name,
        telegram: telegram.trim() || null,
        game_id: gameId.trim() || null,
        rank_mm: rankMm,
        kd: kd ? parseFloat(kd) : null,
        hours: hours ? parseInt(hours) : null,
        role,
      }
      await updateProfile(updates)

      // Also sync to players table
      await supabase.from('players').upsert({
        user_id: user!.id,
        ...updates,
      }, { onConflict: 'user_id' })

      toast.success('Профиль сохранён!')
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Профиль"
        title={<>Мой <span className="text-gradient">аккаунт</span></>}
        description="Заполни профиль чтобы тебя нашли для праков и командного набора."
      />

      <section className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
        {/* Avatar / header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-electric text-3xl font-display text-primary-foreground shadow-glow">
            {user?.avatar || user?.name?.slice(0, 2).toUpperCase() || <User className="h-8 w-8" />}
          </div>
          <div>
            <div className="font-display text-2xl uppercase">{user?.name}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">{user?.provider}</span>
              <span>·</span>
              <span className="capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg uppercase border-b border-border pb-3">Основная информация</h3>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Игровой ник</label>
            <input value={nick} onChange={e => setNick(e.target.value)} placeholder="Твой ник"
              className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telegram</label>
              <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Game ID (Standoff 2)</label>
              <input value={gameId} onChange={e => setGameId(e.target.value)} placeholder="Твой ID в игре"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Роль</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={`press rounded-full border px-3 py-1.5 text-xs font-medium transition capitalize ${
                    role === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <h3 className="font-display text-lg uppercase border-b border-border pb-3 pt-2">Статистика</h3>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ранг в MM</label>
            <div className="flex flex-wrap gap-2">
              {RANKS.map(r => (
                <button key={r} onClick={() => setRankMm(r)}
                  className={`press rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    rankMm === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">K/D</label>
              <input value={kd} onChange={e => setKd(e.target.value)} placeholder="1.25" type="number" step="0.01" min="0" max="10"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Часов в игре</label>
              <input value={hours} onChange={e => setHours(e.target.value)} placeholder="1500" type="number" min="0"
                className="h-11 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="press mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-electric text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Сохраняем...' : 'Сохранить профиль'}
          </button>
        </div>
      </section>
    </PageShell>
  )
}
