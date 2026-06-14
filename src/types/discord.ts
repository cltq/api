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
  icon: string | null
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
  guildId: string | null
}

export interface DiscordProfile {
  id: string
  username: string
  displayName: string
  globalName: string | null
  avatar: string | null
  banner: string | null
  accentColor: number | null
  badges: string[]
  premiumType: string | null
  premiumBadge: string | null
  guildId: string | null
  guildName: string | null
  primaryGuild: DiscordPrimaryGuild | null
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
  badges: string[]
  premiumType: string | null
  premiumBadge: string | null
  boostBadge: string | null
  boostedSince: string | null
  status: "online" | "idle" | "dnd" | "offline"
  customStatus: string | null
  spotify: DiscordSpotify | null
  activities: DiscordActivity[]
  mobile: boolean
  desktop: boolean
  web: boolean
  guildId: string | null
  guildName: string | null
  primaryGuild: DiscordPrimaryGuild | null
  publicFlags: number
  createdAt: string | null
  updatedAt: number
}

export interface DiscordPrimaryGuild {
  identityGuildId: string | null
  identityEnabled: boolean | null
  tag: string | null
  badge: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
