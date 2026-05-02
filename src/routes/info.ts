import { Elysia } from "elysia"

export const info = new Elysia({ prefix: "/info" }).get("", () => ({
  name: "Personal API",
  version: "1.0.0",
  timezone: "Asia/Bangkok",
  endpoints: {
    health: "/health",
    time: "/time",
    socials: "/socials/:name",
    info: "/info",
    docs: "/docs",
  },
}))
