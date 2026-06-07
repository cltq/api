export interface DiscordSpotify {
  song: string
  artist: string
  album: string
  cover: string | null
  startedAt: number | null
  endsAt: number | null
}

export interface DiscordActivity {
  id: string
  name: string
  type: string
  details: string | null
  state: string | null
  emoji: string | null
  applicationId: string | null
  timestamps: {
    start: number | null
    end: number | null
  } | null
}

export interface DiscordPresence {
  status: "online" | "idle" | "dnd" | "offline"
  customStatus: string | null
  spotify: DiscordSpotify | null
  activities: DiscordActivity[]
  mobile: boolean
  desktop: boolean
  web: boolean
}

export interface DiscordProfile {
  id: string
  username: string
  displayName: string
  globalName: string | null
  avatar: string | null
  banner: string | null
  accentColor: number | null
  createdAt: string | null
}

export interface DiscordUserPayload {
  id: string
  username: string
  displayName: string
  globalName: string | null
  avatar: string | null
  banner: string | null
  accentColor: string | null
  status: "online" | "idle" | "dnd" | "offline"
  customStatus: string | null
  spotify: DiscordSpotify | null
  activities: DiscordActivity[]
  mobile: boolean
  desktop: boolean
  web: boolean
  createdAt: string | null
  updatedAt: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
