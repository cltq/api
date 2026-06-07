import type { Client, Presence, User, PartialUser } from "discord.js"
import type { RedisService } from "../redis/service"
import { serializePresence, serializeProfileFromUser } from "./serializer"

export function setupHandlers(client: Client, redis: RedisService, targetUserId: string): void {
  client.on("ready", async () => {
    console.log(`[Discord] Bot logged in as ${client.user?.tag}`)

    try {
      const user = await client.users.fetch(targetUserId, { force: true })
      console.log(`[Discord] Target user found: ${user.tag} (${user.id})`)

      for (const guild of client.guilds.cache.values()) {
        try {
          const member = await guild.members.fetch({ user: targetUserId, force: true })
          if (member.presence) {
            const payload = serializePresence(member.presence)
            if (payload) {
              await redis.saveUser(targetUserId, payload)
              await redis.publishUpdate(targetUserId, payload)
            }
          }
          return
        } catch {
          continue
        }
      }

      const fallback = serializeProfileFromUser(user)
      const data = {
        ...fallback,
        accentColor: fallback.accentColor
          ? `#${fallback.accentColor.toString(16).padStart(6, "0").toUpperCase()}`
          : null,
        status: "offline" as const,
        customStatus: null,
        spotify: null,
        activities: [],
        mobile: false,
        desktop: false,
        web: false,
        updatedAt: Date.now(),
      }
      await redis.saveUser(targetUserId, data)
      await redis.publishUpdate(targetUserId, data)
    } catch (err) {
      console.error("[Discord] Failed to fetch target user:", err)
    }
  })

  client.on("presenceUpdate", async (oldPresence: Presence | null, newPresence: Presence) => {
    if (newPresence.userId !== targetUserId) return

    const payload = serializePresence(newPresence)
    if (!payload) return

    if (oldPresence) {
      const oldPayload = serializePresence(oldPresence)
      if (oldPayload && JSON.stringify(oldPayload) === JSON.stringify(payload)) return
    }

    await redis.saveUser(targetUserId, payload)
    await redis.publishUpdate(targetUserId, payload)
  })

  client.on("userUpdate", async (_oldUser: User | PartialUser, newUser: User) => {
    if (newUser.id !== targetUserId) return

    const profile = serializeProfileFromUser(newUser)
    const existing = await redis.getUser(targetUserId)
    if (existing) {
      existing.username = profile.username
      existing.displayName = profile.displayName
      existing.globalName = profile.globalName
      existing.avatar = profile.avatar
      existing.banner = profile.banner
      existing.accentColor = profile.accentColor
        ? `#${profile.accentColor.toString(16).padStart(6, "0").toUpperCase()}`
        : null
      existing.createdAt = profile.createdAt
      existing.updatedAt = Date.now()
      await redis.saveUser(targetUserId, existing)
      await redis.publishUpdate(targetUserId, existing)
    }
  })
}
