import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xgxhpmvrmaezuonatyjk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneGhwbXZybWFlenVvbmF0eWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTgyNTMsImV4cCI6MjA5MDc5NDI1M30.0i_FqafbpE9J3m6qi4BgH1blUciKw6yQKMnw2Db0erA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export type User = {
  id: string
  provider_id: string
  provider: string
  name: string
  avatar: string
  avatar_url?: string
  role: string
  lang?: string
  telegram?: string
  game_id?: string
  rank_mm?: string
  rank_naps?: string
  kd?: number
  hours?: number
  created_at?: string
}

export type Scrim = {
  id: string
  team_id?: string
  team_name: string
  team_tag?: string
  rank: string
  format: string
  maps: string[]
  time_text: string
  time_raw?: string
  status: 'open' | 'pending' | 'confirmed' | 'cancelled'
  user_id: string
  discord?: string
  telegram?: string
  created_at: string
}

export type Team = {
  id: string
  name: string
  tag: string
  region: string
  rating?: number
  wins?: number
  status: string
  game: string
  discord?: string
  telegram?: string
  owner_id: string
  created_at: string
}

export type Tournament = {
  id: string
  title: string
  description?: string
  format: string
  prize?: string
  date_text?: string
  status: 'upcoming' | 'live' | 'finished'
  max_teams: number
  level?: string
  organizer_id: string
  created_at: string
}
