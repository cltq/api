import type { Redis } from "ioredis"
import type { DiscordUserPayload, DiscordPresence, DiscordProfile } from "../types/discord"

const K = {
  user: (id: string) => `discord:user:${id}`,
  presence: (id: string) => `discord:presence:${id}`,
  profile: (id: string) => `discord:profile:${id}`,
}

export const PRESENCE_CHANNEL = "discord:presence"

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
    }))
    multi.set(K.profile(userId), JSON.stringify({
      id: payload.id,
      username: payload.username,
      displayName: payload.displayName,
      globalName: payload.globalName,
      avatar: payload.avatar,
      banner: payload.banner,
      accentColor: payload.accentColor,
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
    return data ? JSON.parse(data) : null
  }

  async getPresence(userId: string): Promise<DiscordPresence | null> {
    const data = await this.client.get(K.presence(userId))
    return data ? JSON.parse(data) : null
  }

  async getProfile(userId: string): Promise<DiscordProfile | null> {
    const data = await this.client.get(K.profile(userId))
    return data ? JSON.parse(data) : null
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
