import { Elysia } from "elysia"
import { getEnv } from "../../types/env"
import { calculatePremiumBadge } from "../../lib/discord"

const API_BASE = "https://discord.com/api/v10"
const OAUTH_BASE = "https://discord.com/oauth2"

const SCOPES = ["identify"]

function buildRedirectUri(request: Request): string {
  const env = process.env.DISCORD_REDIRECT_URI
  if (env) return env
  const url = new URL(request.url)
  return `${url.origin}/v2/discord/auth/callback`
}

export const discordAuth = new Elysia({ prefix: "/v2/discord/auth" })
  .get("/login", ({ redirect, request }) => {
    const env = getEnv()
    if (!env.DISCORD_CLIENT_ID) {
      return { success: false, error: "OAuth2 not configured" }
    }

    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      response_type: "code",
      redirect_uri: buildRedirectUri(request),
      scope: SCOPES.join(" "),
    })

    return redirect(`${OAUTH_BASE}/authorize?${params}`)
  })
  .get("/callback", async ({ request, set }) => {
    const env = getEnv()
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
      set.status = 503
      return { success: false, error: "OAuth2 not configured" }
    }

    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")

    if (error) {
      set.status = 400
      return { success: false, error: `Discord OAuth2 error: ${error}` }
    }

    if (!code) {
      set.status = 400
      return { success: false, error: "Missing authorization code" }
    }

    const redirectUri = buildRedirectUri(request)

    const tokenRes = await fetch(`${OAUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      set.status = 502
      return { success: false, error: "Failed to exchange authorization code" }
    }

    const tokenData = (await tokenRes.json()) as Record<string, unknown>
    const accessToken = tokenData.access_token as string | undefined

    if (!accessToken) {
      set.status = 502
      return { success: false, error: "No access token in response" }
    }

    const userRes = await fetch(`${API_BASE}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userRes.ok) {
      set.status = 502
      return { success: false, error: "Failed to fetch user data" }
    }

    const userData = (await userRes.json()) as Record<string, unknown>

    const premiumBadge = calculatePremiumBadge(userData)

    return {
      success: true,
      data: {
        id: userData.id,
        username: userData.username,
        global_name: userData.global_name,
        avatar: userData.avatar,
        banner: userData.banner,
        accent_color: userData.accent_color,
        flags: userData.flags,
        public_flags: userData.public_flags,
        premium_type: userData.premium_type,
        premium_badge: premiumBadge,
      },
    }
  })
