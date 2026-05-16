import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Search, Shield, User, Trash2, Crown } from 'lucide-react'

export default function AdminPage() {
  const { user, isLoggedIn } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    if (!user) return
    async function checkAdmin() {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user!.id)
        .single()
      setIsAdmin(data?.role === 'admin')
      setCheckingAdmin(false)
    }
    checkAdmin()
  }, [user])

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin])

  async function loadUsers() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('users')
        .select('id, name, role, trivox_id, avatar, created_at, telegram, discord')
        .order('created_at', { ascending: false })
        .limit(100)
      setUsers(data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function setRole(userId: string, role: string) {
    try {
      await supabase.from('users').update({ role }).eq('id', userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success(`Роль изменена на ${role}`)
    } catch {
      toast.error('Ошибка изменения роли')
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Удалить пользователя ${name}?`)) return
    try {
      await supabase.from('users').delete().eq('id', userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('Пользователь удалён')
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  if (!isLoggedIn) return <Navigate to="/" replace />
  if (checkingAdmin) return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-48 rounded-2xl skeleton" />
      </div>
    </PageShell>
  )
  if (!isAdmin) return <Navigate to="/" replace />

  const filtered = users.filter(u =>
    !q ||
    u.name?.toLowerCase().includes(q.toLowerCase()) ||
    u.trivox_id?.toLowerCase().includes(q.toLowerCase()) ||
    u.telegram?.toLowerCase().includes(q.toLowerCase())
  )

  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 space-y-6">

        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-electric">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl uppercase">Панель администратора</h1>
              <div className="text-sm text-muted-foreground">
                {users.length} пользователей · {adminCount} админов
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/60 p-3 text-center">
              <div className="font-display text-2xl">{users.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Всего юзеров</div>
            </div>
            <div className="rounded-xl bg-muted/60 p-3 text-center">
              <div className="font-display text-2xl text-primary">{adminCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Админов</div>
            </div>
            <div className="rounded-xl bg-muted/60 p-3 text-center">
              <div className="font-display text-2xl">{users.filter(u => !u.role || u.role === 'user').length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Обычных</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Поиск по имени, trivox_id, telegram..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Users list */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <span className="font-display text-sm uppercase">Пользователи</span>
            <span className="text-xs text-muted-foreground">{filtered.length} найдено</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Пользователи не найдены</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition">
                  {/* Avatar */}
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-electric/20 font-display text-sm text-primary">
                    {u.avatar || u.name?.slice(0, 2).toUpperCase() || 'U'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{u.name || 'Без имени'}</span>
                      {u.role === 'admin' && (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <Crown className="h-3 w-3" /> ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                      {u.trivox_id && <span>ID: {u.trivox_id}</span>}
                      {u.telegram && <span>TG: {u.telegram}</span>}
                      <span className="text-muted-foreground/60">
                        {new Date(u.created_at).toLocaleDateString('ru')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.role === 'admin' ? (
                      <button
                        onClick={() => setRole(u.id, 'user')}
                        disabled={u.id === user?.id}
                        className="press flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition disabled:opacity-40"
                      >
                        <User className="h-3.5 w-3.5" /> Снять админа
                      </button>
                    ) : (
                      <button
                        onClick={() => setRole(u.id, 'admin')}
                        className="press flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                      >
                        <Crown className="h-3.5 w-3.5" /> Сделать админом
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(u.id, u.name)}
                      disabled={u.id === user?.id}
                      className="press grid h-8 w-8 place-items-center rounded-lg border border-danger/20 text-danger hover:bg-danger/10 transition disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick assign by trivox_id */}
        <QuickAssign onAssigned={loadUsers} />

      </div>
    </PageShell>
  )
}

function QuickAssign({ onAssigned }: { onAssigned: () => void }) {
  const [trivoxId, setTrivoxId] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)

  async function handleAssign() {
    if (!trivoxId.trim()) { toast.error('Введи Trivox ID'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('trivox_id', trivoxId.trim())
        .select()

      if (error) throw error
      if (!data || data.length === 0) {
        toast.error('Пользователь не найден', { description: `Trivox ID: ${trivoxId}` })
      } else {
        toast.success(`Роль ${role} назначена!`, { description: data[0].name })
        setTrivoxId('')
        onAssigned()
      }
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" /> Быстрое назначение по Trivox ID
      </h2>
      <div className="flex gap-3">
        <input
          value={trivoxId}
          onChange={e => setTrivoxId(e.target.value)}
          placeholder="Введи Trivox ID пользователя"
          className="flex-1 h-11 rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
          onKeyDown={e => e.key === 'Enter' && handleAssign()}
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="h-11 rounded-xl border border-border bg-muted/60 px-3 text-sm outline-none transition focus:border-primary"
        >
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
        </select>
        <button
          onClick={handleAssign}
          disabled={loading}
          className="press h-11 rounded-xl bg-gradient-to-r from-primary to-electric px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
        >
          {loading ? '...' : 'Назначить'}
        </button>
      </div>
    </div>
  )
}
