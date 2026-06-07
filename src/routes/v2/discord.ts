import { Elysia } from "elysia"
import type { Redis } from "ioredis"
import type { RedisService } from "../../redis/service"
import { PRESENCE_CHANNEL } from "../../redis/service"
import type { DiscordUserPayload, ApiResponse } from "../../types/discord"

interface SSEClient {
  userId: string
  controller: ReadableStreamDefaultController
  heartbeat: ReturnType<typeof setInterval>
}

const detail = (summary: string, description: string, tags = ["Discord"]) => ({
  detail: { summary, description, tags },
})

const notFound = (id: string): ApiResponse<never> => ({
  success: false,
  error: `User ${id} not found`,
})

export function createDiscordRoutes(redis: RedisService, subscriber: Redis) {
  const clients = new Map<string, SSEClient>()

  subscriber.subscribe(PRESENCE_CHANNEL, (err) => {
    if (err) console.error("[SSE] Redis subscribe error:", err)
    else console.log(`[SSE] Subscribed to ${PRESENCE_CHANNEL}`)
  })

  subscriber.on("message", (channel, message) => {
    if (channel !== PRESENCE_CHANNEL) return

    let payload: DiscordUserPayload
    try {
      payload = JSON.parse(message)
    } catch {
      return
    }

    const event = `event: presence_update\ndata: ${JSON.stringify({ success: true, data: payload })}\n\n`
    const encoded = new TextEncoder().encode(event)

    for (const [id, client] of clients) {
      if (client.userId !== payload.id) continue
      try {
        client.controller.enqueue(encoded)
      } catch {
        clearInterval(client.heartbeat)
        clients.delete(id)
      }
    }
  })

  function createSSEStream(userId: string, request: Request): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        const sid = Math.random().toString(36).slice(2, 10)
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"))
          } catch {
            clearInterval(heartbeat)
            clients.delete(sid)
          }
        }, 30000)

        clients.set(sid, { userId, controller, heartbeat })

        controller.enqueue(new TextEncoder().encode(": connected\n\n"))

        redis.getUser(userId).then((user) => {
          if (user) {
            const event = `event: presence_update\ndata: ${JSON.stringify({ success: true, data: user })}\n\n`
            try {
              controller.enqueue(new TextEncoder().encode(event))
            } catch {
              /* client disconnected */
            }
          }
        })

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat)
          clients.delete(sid)
        }, { once: true })
      },
    })
  }

  return new Elysia({ prefix: "/v2/discord" })
    .get(
      "/users/:id",
      async ({ params: { id }, set, request }) => {
        const user = await redis.getUser(id)
        if (!user) {
          set.status = 404
          return notFound(id)
        }
        return { success: true, data: user } satisfies ApiResponse<DiscordUserPayload>
      },
      detail("Get user", "Returns the complete cached Discord user payload including profile and presence."),
    )
    .get(
      "/users/:id/profile",
      async ({ params: { id }, set }) => {
        const profile = await redis.getProfile(id)
        if (!profile) {
          set.status = 404
          return notFound(id)
        }
        return { success: true, data: profile }
      },
      detail("Get user profile", "Returns cached profile information (username, avatar, banner, accent color)."),
    )
    .get(
      "/users/:id/presence",
      async ({ params: { id }, set }) => {
        const presence = await redis.getPresence(id)
        if (!presence) {
          set.status = 404
          return notFound(id)
        }
        return { success: true, data: presence }
      },
      detail("Get user presence", "Returns cached presence data (status, activities, Spotify, devices)."),
    )
    .get(
      "/users/:id/status",
      async ({ params: { id }, set }) => {
        const user = await redis.getUser(id)
        if (!user) {
          set.status = 404
          return notFound(id)
        }
        return {
          success: true,
          data: { id: user.id, status: user.status },
        }
      },
      detail("Get user status", "Returns a lightweight payload with only user ID and current status."),
    )
    .get(
      "/users/:id/live",
      ({ params: { id }, request }) => {
        const stream = createSSEStream(id, request)
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        })
      },
      detail(
        "Live presence stream (SSE)",
        "Opens a Server-Sent Events connection that streams presence updates in real time. " +
          "Emits `presence_update` events when the user's presence changes. " +
          "Includes a heartbeat comment every 30 seconds.",
      ),
    )
}
