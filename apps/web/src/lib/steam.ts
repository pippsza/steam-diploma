const STEAM_CDN_BASE = 'https://cdn.akamai.steamstatic.com/steam/apps'
const STEAM_STORE_API = 'https://store.steampowered.com/api'

export function getSteamHeaderImage(appid: number): string {
  return `${STEAM_CDN_BASE}/${appid}/header.jpg`
}

export function getSteamCapsuleImage(appid: number): string {
  return `${STEAM_CDN_BASE}/${appid}/capsule_616x353.jpg`
}

export function getSteamLibraryCapsule(appid: number): string {
  return `${STEAM_CDN_BASE}/${appid}/library_600x900_2x.jpg`
}

export function getSteamHeroImage(appid: number): string {
  return `${STEAM_CDN_BASE}/${appid}/library_hero.jpg`
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

export interface SteamRequirements {
  minimum?: string
  recommended?: string
}

export interface SteamAppDetails {
  type: string
  name: string
  steam_appid: number
  is_free: boolean
  short_description: string
  detailed_description: string
  about_the_game: string
  supported_languages: string
  header_image: string
  developers?: string[]
  publishers?: string[]
  price_overview?: {
    currency: string
    initial: number
    final: number
    discount_percent: number
  }
  platforms: {
    windows: boolean
    mac: boolean
    linux: boolean
  }
  pc_requirements: SteamRequirements | []
  mac_requirements: SteamRequirements | []
  linux_requirements: SteamRequirements | []
  metacritic?: {
    score: number
    url: string
  }
  categories?: Array<{ id: number; description: string }>
  genres?: Array<{ id: string; description: string }>
  screenshots?: Array<{ id: number; path_thumbnail: string; path_full: string }>
  recommendations?: { total: number }
  release_date?: { coming_soon: boolean; date: string }
}

export interface SteamReview {
  recommendationid: string
  author: {
    steamid: string
    num_games_owned: number
    num_reviews: number
    playtime_forever: number
    playtime_last_two_weeks: number
    last_played: number
  }
  language: string
  review: string
  timestamp_created: number
  timestamp_updated: number
  voted_up: boolean
  votes_up: number
  votes_funny: number
  weighted_vote_score: string
  steam_purchase: boolean
  received_for_free: boolean
  written_during_early_access: boolean
}

export type SteamLanguage = 'english' | 'ukrainian'

export async function fetchSteamAppDetails(
  appid: number,
  lang: SteamLanguage = 'english',
): Promise<SteamAppDetails | null> {
  try {
    const res = await fetch(`${STEAM_STORE_API}/appdetails?appids=${appid}&l=${lang}`, {
      next: { revalidate: 86400 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const appData = data[String(appid)]

    if (!appData?.success) return null

    return appData.data as SteamAppDetails
  } catch {
    return null
  }
}

export async function fetchSteamReviews(
  appid: number,
  lang: SteamLanguage = 'english',
  count: number = 5,
): Promise<SteamReview[]> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/appreviews/${appid}?json=1&language=${lang}&num_per_page=${count}&filter=recent&purchase_type=steam`,
    )

    if (!res.ok) return []

    const data = await res.json()
    if (data.success !== 1) return []

    return (data.reviews ?? []) as SteamReview[]
  } catch {
    return []
  }
}

/**
 * Parse requirements from Steam API response.
 * Steam returns `[]` (empty array) when no requirements exist, or an object with minimum/recommended.
 */
export function parseRequirements(
  reqs: SteamRequirements | [],
): { minimum?: string; recommended?: string } | undefined {
  if (Array.isArray(reqs)) return undefined
  if (!reqs.minimum && !reqs.recommended) return undefined
  return {
    minimum: reqs.minimum ? stripHtml(reqs.minimum) : undefined,
    recommended: reqs.recommended ? stripHtml(reqs.recommended) : undefined,
  }
}

export async function fetchSteamAppList(): Promise<Array<{ appid: number; name: string }>> {
  const res = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/')
  const data = await res.json()
  return data.applist.apps
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchSteamAppDetailsBatch(
  appids: number[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<number, SteamAppDetails>> {
  const results = new Map<number, SteamAppDetails>()
  const batchSize = 1
  const delayMs = 1500

  for (let i = 0; i < appids.length; i += batchSize) {
    const appid = appids[i]
    const details = await fetchSteamAppDetails(appid)
    if (details) {
      results.set(appid, details)
    }

    onProgress?.(i + 1, appids.length)

    if (i + batchSize < appids.length) {
      await delay(delayMs)
    }
  }

  return results
}
