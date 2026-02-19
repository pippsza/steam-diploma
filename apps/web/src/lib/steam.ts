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

export interface SteamAppDetails {
  type: string
  name: string
  steam_appid: number
  is_free: boolean
  short_description: string
  detailed_description: string
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

export async function fetchSteamAppDetails(appid: number): Promise<SteamAppDetails | null> {
  try {
    const res = await fetch(`${STEAM_STORE_API}/appdetails?appids=${appid}&l=english`, {
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
  const delayMs = 1500 // ~40 req/min to stay under rate limits

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
