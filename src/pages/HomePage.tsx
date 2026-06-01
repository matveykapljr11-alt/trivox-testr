import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate('/praki')
    } else {
      setAuthOpen(true)
    }
  }

  return (
    <PageShell>
      <div className="min-h-[calc(100vh-4rem)] bg-dark flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-display uppercase text-white mb-6">
            FIND <span className="text-neon italic">your match.</span>
          </h1>
          <p className="text-white/70 text-lg mb-8">
            Прак-платформа для Standoff 2. Найди тиммейтов прямо сейчас.
          </p>
          <button
            onClick={handleCTA}
            className="press inline-flex h-14 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-neon px-8 text-base font-bold uppercase tracking-wider text-primary-foreground"
          >
            {isLoggedIn ? 'Найти прак' : 'Начать играть'}
          </button>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </PageShell>
  )
}
