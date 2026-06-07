import Redis from "ioredis"
import type { Env } from "../types/env"

let redis: Redis | null = null
let pub: Redis | null = null
let sub: Redis | null = null

function createClient(url: string, label: string): Redis {
  const client = new Redis(url, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableReadyCheck: true,
  })
  client.on("error", (err) => console.error(`[Redis:${label}] Error:`, err.message))
  client.on("connect", () => console.log(`[Redis:${label}] Connected`))
  client.on("close", () => console.log(`[Redis:${label}] Connection closed`))
  return client
}

export function getClient(env?: Env): Redis {
  if (!redis) {
    if (!env) throw new Error("Redis client not initialized. Provide env on first call.")
    redis = createClient(env.REDIS_URL, "client")
  }
  return redis
}

export function getPublisher(env?: Env): Redis {
  if (!pub) {
    if (!env) throw new Error("Redis publisher not initialized. Provide env on first call.")
    pub = createClient(env.REDIS_URL, "pub")
  }
  return pub
}

export function getSubscriber(env?: Env): Redis {
  if (!sub) {
    if (!env) throw new Error("Redis subscriber not initialized. Provide env on first call.")
    sub = createClient(env.REDIS_URL, "sub")
  }
  return sub
}

export async function connectAll(env: Env): Promise<void> {
  const clients = [getClient(env), getPublisher(env), getSubscriber(env)]
  await Promise.all(clients.map((c) => c.connect().catch((e) => {
    console.error(`[Redis] Failed to connect:`, e.message)
    throw e
  })))
}

export async function disconnectAll(): Promise<void> {
  await Promise.all(
    [redis, pub, sub].filter(Boolean).map((c) => c!.quit()),
  )
  redis = null
  pub = null
  sub = null
}
