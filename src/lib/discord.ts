const API_BASE = "https://discord.com/api/v10"

const BADGE_TIERS: [number, string][] = [
  [72, "Opal"],
  [60, "Ruby"],
  [36, "Emerald"],
  [24, "Diamond"],
  [12, "Platinum"],
  [6, "Gold"],
  [3, "Silver"],
  [1, "Bronze"],
]

export async function fetchDiscordUser(token: string, userId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
    })
    if (!res.ok) return null
    return (await res.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

export function calculatePremiumBadge(
  data: Record<string, unknown>,
  fallbackPremiumType?: number | null,
): string | null {
  const premiumSince = data.premium_since as string | undefined

  if (premiumSince) {
    const start = new Date(premiumSince).getTime()
    const months = (Date.now() - start) / (1000 * 60 * 60 * 24 * 30.44)
    for (const [threshold, badge] of BADGE_TIERS) {
      if (months >= threshold) return badge
    }
    return "Nitro"
  }

  const dataPremiumType = data.premium_type as number | undefined
  const premiumType = dataPremiumType || fallbackPremiumType || 0
  if (premiumType === 0) return null

  return "Nitro"
}

const BOOST_TIERS: [number, string][] = [
  [24, "Diamond"],
  [18, "Platinum"],
  [12, "Gold"],
  [9, "Silver"],
  [6, "Bronze"],
  [3, "Copper"],
  [2, "Basic"],
]

export function calculateBoostBadge(premiumSince: Date | null): string | null {
  if (!premiumSince) return null

  const months = (Date.now() - premiumSince.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  for (const [threshold, badge] of BOOST_TIERS) {
    if (months >= threshold) return badge
  }
  return "Booster"
}
