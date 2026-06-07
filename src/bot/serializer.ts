import type { Presence, User, Activity, ClientUser, GuildMember } from "discord.js"
import type { DiscordUserPayload, DiscordSpotify, DiscordActivity, DiscordProfile } from "../types/discord"

function getAvatarUrl(user: User | ClientUser): string | null {
  return user.avatarURL({ size: 256 }) ?? null
}

function getBannerUrl(user: User | ClientUser): string | null {
  return user.bannerURL({ size: 512 }) ?? null
}

function getActivityType(type: number): string {
  switch (type) {
    case 0: return "Playing"
    case 1: return "Streaming"
    case 2: return "Listening"
    case 3: return "Watching"
    case 4: return "Custom"
    case 5: return "Competing"
    default: return "Unknown"
  }
}

function serializeSpotify(activity: Activity): DiscordSpotify | null {
  if (!activity.details && !activity.state) return null

  const largeImage = activity.assets?.largeImage ?? ""
  const coverId = largeImage.replace("spotify:", "")

  return {
    song: activity.details ?? "Unknown",
    artist: activity.state ?? "Unknown",
    album: activity.assets?.largeText ?? activity.name,
    cover: coverId ? `https://i.scdn.co/image/${coverId}` : null,
    startedAt: activity.timestamps?.start?.getTime() ?? null,
    endsAt: activity.timestamps?.end?.getTime() ?? null,
  }
}

function serializeActivity(activity: Activity): DiscordActivity {
  const act: DiscordActivity = {
    id: (activity as any).id,
    name: activity.name,
    type: getActivityType(activity.type),
    details: activity.details ?? null,
    state: activity.state ?? null,
    emoji: activity.emoji?.name ?? null,
    applicationId: activity.applicationId ?? null,
    timestamps: activity.timestamps
      ? {
          start: activity.timestamps.start?.getTime() ?? null,
          end: activity.timestamps.end?.getTime() ?? null,
        }
      : null,
  }
  return act
}

export function serializePresence(presence: Presence): DiscordUserPayload | null {
  const { user, member } = presence
  if (!user) return null

  const spotifyActivity = presence.activities.find(
    (a) => a.name === "Spotify" && a.type === 2,
  )
  const customStatusActivity = presence.activities.find(
    (a) => a.type === 4,
  )
  const otherActivities = presence.activities.filter(
    (a) => a.type !== 4 && a.name !== "Spotify",
  )

  const clientStatus = presence.clientStatus ?? {}
  const displayName = member && "displayName" in member
    ? (member as GuildMember).displayName
    : user.displayName

  return {
    id: user.id,
    username: user.username,
    displayName,
    globalName: user.discriminator === "0" ? user.globalName : `${user.username}#${user.discriminator}`,
    avatar: getAvatarUrl(user),
    banner: getBannerUrl(user),
    accentColor: user.accentColor
      ? `#${user.accentColor.toString(16).padStart(6, "0").toUpperCase()}`
      : null,
    status: presence.status === "invisible" ? "offline" : presence.status,
    customStatus: customStatusActivity?.state ?? null,
    spotify: spotifyActivity ? serializeSpotify(spotifyActivity) : null,
    activities: otherActivities.map(serializeActivity),
    mobile: clientStatus.mobile !== undefined,
    desktop: clientStatus.desktop !== undefined,
    web: clientStatus.web !== undefined,
    createdAt: user.createdAt?.toISOString() ?? null,
    updatedAt: Date.now(),
  }
}

export function serializeProfileFromUser(user: User | ClientUser): DiscordProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    globalName: user.discriminator === "0" ? user.globalName : `${user.username}#${user.discriminator}`,
    avatar: getAvatarUrl(user),
    banner: getBannerUrl(user),
    accentColor: user.accentColor ?? null,
    createdAt: user.createdAt?.toISOString() ?? null,
  }
}
