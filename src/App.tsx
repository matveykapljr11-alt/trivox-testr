import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { SiteHeader } from './components/SiteHeader'
import HomePage from './pages/HomePage'
import PrakiPage from './pages/PrakiPage'
import TeamsPage from './pages/TeamsPage'
import TeamProfilePage from './pages/TeamProfilePage'
import PlayersPage from './pages/PlayersPage'
import PlayerProfilePage from './pages/PlayerProfilePage'
import TournamentsPage from './pages/TournamentsPage'
import TournamentProfilePage from './pages/TournamentProfilePage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import MyTeamPage from './pages/MyTeamPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteHeader />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/praki" element={<PrakiPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:id" element={<TeamProfilePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerProfilePage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:id" element={<TournamentProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-team" element={<MyTeamPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'oklch(1 0 0)',
              border: '1px solid oklch(0.9 0.02 235)',
              color: 'oklch(0.18 0.05 250)',
              fontFamily: 'Hind, system-ui, sans-serif',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
