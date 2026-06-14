import type { Redis } from "ioredis"
import type { DiscordUserPayload, DiscordPresence, DiscordProfile, DiscordPrimaryGuild } from "../types/discord"

const K = {
  user: (id: string) => `discord:user:${id}`,
  presence: (id: string) => `discord:presence:${id}`,
  profile: (id: string) => `discord:profile:${id}`,
}

export const PRESENCE_CHANNEL = "discord:presence"

function migrateProfile(data: Partial<DiscordProfile>): DiscordProfile {
  return {
    id: data.id ?? "",
    username: data.username ?? "",
    displayName: data.displayName ?? "",
    globalName: data.globalName ?? null,
    avatar: data.avatar ?? null,
    banner: data.banner ?? null,
    accentColor: data.accentColor ?? null,
    badges: data.badges ?? [],
    premiumType: data.premiumType ?? null,
    premiumBadge: data.premiumBadge ?? null,
    guildId: data.guildId ?? null,
    guildName: data.guildName ?? null,
    primaryGuild: data.primaryGuild ?? null,
    createdAt: data.createdAt ?? null,
  }
}

function migrateUserPayload(data: Partial<DiscordUserPayload>): DiscordUserPayload {
  return {
    id: data.id ?? "",
    username: data.username ?? "",
    displayName: data.displayName ?? "",
    globalName: data.globalName ?? null,
    avatar: data.avatar ?? null,
    banner: data.banner ?? null,
    accentColor: data.accentColor ?? null,
    badges: data.badges ?? [],
    premiumType: data.premiumType ?? null,
    premiumBadge: data.premiumBadge ?? null,
    boostBadge: data.boostBadge ?? null,
    boostedSince: data.boostedSince ?? null,
    status: data.status ?? "offline",
    customStatus: data.customStatus ?? null,
    spotify: data.spotify ?? null,
    activities: data.activities ?? [],
    mobile: data.mobile ?? false,
    desktop: data.desktop ?? false,
    web: data.web ?? false,
    guildId: data.guildId ?? null,
    guildName: data.guildName ?? null,
    primaryGuild: data.primaryGuild ?? null,
    publicFlags: data.publicFlags ?? 0,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? 0,
  }
}

export class RedisService {
  constructor(
    private client: Redis,
    private publisher: Redis,
  ) {}

  async saveUser(userId: string, payload: DiscordUserPayload): Promise<void> {
    const multi = this.client.multi()
    multi.set(K.user(userId), JSON.stringify(payload))
    multi.set(K.presence(userId), JSON.stringify({
      status: payload.status,
      customStatus: payload.customStatus,
      spotify: payload.spotify,
      activities: payload.activities,
      mobile: payload.mobile,
      desktop: payload.desktop,
      web: payload.web,
      guildId: payload.guildId,
    }))
    multi.set(K.profile(userId), JSON.stringify({
      id: payload.id,
      username: payload.username,
      displayName: payload.displayName,
      globalName: payload.globalName,
      avatar: payload.avatar,
      banner: payload.banner,
      accentColor: payload.accentColor,
      badges: payload.badges,
      premiumType: payload.premiumType,
      premiumBadge: payload.premiumBadge,
      guildId: payload.guildId,
      guildName: payload.guildName,
      primaryGuild: payload.primaryGuild,
      createdAt: payload.createdAt,
    }))
    const expiry = 60 * 60 * 24 * 7
    multi.expire(K.user(userId), expiry)
    multi.expire(K.presence(userId), expiry)
    multi.expire(K.profile(userId), expiry)
    await multi.exec()
  }

  async getUser(userId: string): Promise<DiscordUserPayload | null> {
    const data = await this.client.get(K.user(userId))
    if (!data) return null
    const parsed = JSON.parse(data) as Partial<DiscordUserPayload>
    return migrateUserPayload(parsed)
  }

  async getPresence(userId: string): Promise<DiscordPresence | null> {
    const data = await this.client.get(K.presence(userId))
    return data ? JSON.parse(data) : null
  }

  async getProfile(userId: string): Promise<DiscordProfile | null> {
    const data = await this.client.get(K.profile(userId))
    if (!data) return null
    const parsed = JSON.parse(data) as Partial<DiscordProfile>
    return migrateProfile(parsed)
  }

  async publishUpdate(userId: string, payload: DiscordUserPayload): Promise<void> {
    await this.publisher.publish(PRESENCE_CHANNEL, JSON.stringify(payload))
  }

  async isReady(): Promise<boolean> {
    try {
      await this.client.ping()
      return true
    } catch {
      return false
    }
  }
}
