import type { ReactNode } from 'react'
import Image from 'next/image'
import { ThumbsUp, ThumbsDown, Clock, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { getSteamHeaderImage } from '@/lib/steam'
import { formatPrice, getGameAvailability } from '@/lib/game-status'
import { ScreenshotGallery } from '@/components/games/screenshot-gallery'

interface RequirementsGroup {
  minimum?: string | null
  recommended?: string | null
}

interface Review {
  reviewId?: string | null
  language?: string | null
  review?: string | null
  votedUp?: boolean | null
  playtimeForever?: number | null
  timestampCreated?: number | null
  votesUp?: number | null
  votesFunny?: number | null
}

interface GameDetailProps {
  appid: number
  name: string
  headerImage?: string | null
  shortDescription?: string | null
  aboutTheGame?: string | null
  supportedLanguages?: string | null
  isFree?: boolean | null
  comingSoon?: boolean | null
  isOwned?: boolean | null
  price?: {
    currency?: string | null
    initial?: number | null
    final?: number | null
    discountPercent?: number | null
  } | null
  genres?: Array<{ description?: string | null }> | null
  developers?: Array<{ name?: string | null }> | null
  publishers?: Array<{ name?: string | null }> | null
  platforms?: { windows?: boolean | null; mac?: boolean | null; linux?: boolean | null } | null
  releaseDate?: string | null
  metacritic?: { score?: number | null } | null
  screenshots?: Array<{ url?: string | null; thumbnailUrl?: string | null }> | null
  recommendations?: { total?: number | null } | null
  pcRequirements?: RequirementsGroup | null
  macRequirements?: RequirementsGroup | null
  linuxRequirements?: RequirementsGroup | null
  reviews?: Review[] | null
  locale?: string
  children?: ReactNode
}

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours.toLocaleString()}h`
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString()
}

function RequirementsSection({ label, data }: { label: string; data: RequirementsGroup }) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">{label}</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.minimum && (
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Minimum</p>
            <p className="whitespace-pre-line text-sm">{data.minimum}</p>
          </div>
        )}
        {data.recommended && (
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Recommended</p>
            <p className="whitespace-pre-line text-sm">{data.recommended}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function GameDetail({
  appid,
  name,
  headerImage,
  shortDescription,
  aboutTheGame,
  supportedLanguages,
  isFree,
  comingSoon,
  isOwned,
  price,
  genres,
  developers,
  publishers,
  platforms,
  releaseDate,
  metacritic,
  screenshots,
  recommendations,
  pcRequirements,
  macRequirements,
  linuxRequirements,
  reviews,
  locale = 'en',
  children,
}: GameDetailProps) {
  const t = useTranslations('games')
  const imageUrl = headerImage || getSteamHeaderImage(appid)

  const availability = getGameAvailability({ isOwned, isFree, comingSoon, price })
  const displayPrice =
    availability.kind === 'owned'
      ? t('inLibrary')
      : availability.kind === 'free'
        ? t('free')
        : availability.kind === 'paid'
          ? formatPrice(availability.cents, availability.currency)
          : availability.kind === 'comingSoon'
            ? t('comingSoon')
            : t('unavailable')

  const hasRequirements =
    pcRequirements?.minimum || pcRequirements?.recommended ||
    macRequirements?.minimum || macRequirements?.recommended ||
    linuxRequirements?.minimum || linuxRequirements?.recommended

  // Filter reviews by current locale language, fallback to english
  const langMap: Record<string, string> = { en: 'english', uk: 'ukrainian' }
  const currentLang = langMap[locale] ?? 'english'
  const localeReviews = reviews?.filter((r) => r.language === currentLang) ?? []
  const displayReviews = localeReviews.length > 0
    ? localeReviews
    : reviews?.filter((r) => r.language === 'english') ?? []

  // Determine default tab for requirements
  const defaultReqTab = pcRequirements?.minimum || pcRequirements?.recommended
    ? 'pc'
    : macRequirements?.minimum || macRequirements?.recommended
      ? 'mac'
      : 'linux'

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative aspect-[460/215] w-full overflow-hidden rounded-lg">
        <Image src={imageUrl} alt={name} fill className="object-cover" priority />
      </div>

      {/* Title + Price */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {genres?.map((g) => (
              <Badge key={g.description} variant="secondary">
                {g.description}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-right">
          {availability.kind === 'paid' && availability.discountPercent ? (
            <Badge className="mb-1 bg-green-600 text-lg">-{availability.discountPercent}%</Badge>
          ) : null}
          {availability.kind === 'owned' ? (
            <p className="inline-flex items-center gap-1.5 text-lg font-medium text-green-500">
              <Check className="size-5" />
              {displayPrice}
            </p>
          ) : (
            <p
              className={
                availability.kind === 'paid' || availability.kind === 'free'
                  ? 'text-2xl font-bold'
                  : 'text-lg font-medium text-muted-foreground'
              }
            >
              {displayPrice}
            </p>
          )}
        </div>
      </div>

      {/* Actions (buy, favorite, wishlist) */}
      {children}

      <Separator />

      {/* Description */}
      {shortDescription && (
        <p className="font-(family-name:--font-inter) text-base leading-[1.7] text-muted-foreground">
          {shortDescription}
        </p>
      )}

      {/* About the Game */}
      {aboutTheGame && (
        <>
          <Separator />
          <section className="space-y-6 font-(family-name:--font-inter)">
            <h2 className="text-2xl font-semibold leading-normal md:text-3xl">About the Game</h2>
            <p className="whitespace-pre-line text-base leading-[1.7] text-muted-foreground">
              {aboutTheGame}
            </p>
          </section>
        </>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {developers && developers.length > 0 && (
          <div>
            <p className="font-medium">Developer</p>
            <p className="text-muted-foreground">{developers.map((d) => d.name).join(', ')}</p>
          </div>
        )}
        {publishers && publishers.length > 0 && (
          <div>
            <p className="font-medium">Publisher</p>
            <p className="text-muted-foreground">{publishers.map((p) => p.name).join(', ')}</p>
          </div>
        )}
        {releaseDate && (
          <div>
            <p className="font-medium">Release Date</p>
            <p className="text-muted-foreground">{releaseDate}</p>
          </div>
        )}
        {metacritic?.score && (
          <div>
            <p className="font-medium">Metacritic</p>
            <Badge
              className={
                metacritic.score >= 75
                  ? 'bg-green-600'
                  : metacritic.score >= 50
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
              }
            >
              {metacritic.score}
            </Badge>
          </div>
        )}
        {platforms && (
          <div>
            <p className="font-medium">Platforms</p>
            <div className="flex gap-2 text-muted-foreground">
              {platforms.windows && <span>Windows</span>}
              {platforms.mac && <span>macOS</span>}
              {platforms.linux && <span>Linux</span>}
            </div>
          </div>
        )}
        {recommendations?.total && (
          <div>
            <p className="font-medium">Reviews</p>
            <p className="text-muted-foreground">{recommendations.total.toLocaleString()}</p>
          </div>
        )}
        {supportedLanguages && (
          <div className="col-span-2">
            <p className="font-medium">Languages</p>
            <p className="text-muted-foreground">{supportedLanguages}</p>
          </div>
        )}
      </div>

      {/* Screenshots */}
      {screenshots && screenshots.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-lg font-semibold">Screenshots</h2>
            <ScreenshotGallery screenshots={screenshots} gameName={name} />
          </div>
        </>
      )}

      {/* System Requirements */}
      {hasRequirements && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-lg font-semibold">System Requirements</h2>
            <Tabs defaultValue={defaultReqTab}>
              <TabsList>
                {(pcRequirements?.minimum || pcRequirements?.recommended) && (
                  <TabsTrigger value="pc">Windows</TabsTrigger>
                )}
                {(macRequirements?.minimum || macRequirements?.recommended) && (
                  <TabsTrigger value="mac">macOS</TabsTrigger>
                )}
                {(linuxRequirements?.minimum || linuxRequirements?.recommended) && (
                  <TabsTrigger value="linux">Linux</TabsTrigger>
                )}
              </TabsList>
              {pcRequirements && (pcRequirements.minimum || pcRequirements.recommended) && (
                <TabsContent value="pc">
                  <RequirementsSection label="Windows" data={pcRequirements} />
                </TabsContent>
              )}
              {macRequirements && (macRequirements.minimum || macRequirements.recommended) && (
                <TabsContent value="mac">
                  <RequirementsSection label="macOS" data={macRequirements} />
                </TabsContent>
              )}
              {linuxRequirements && (linuxRequirements.minimum || linuxRequirements.recommended) && (
                <TabsContent value="linux">
                  <RequirementsSection label="Linux" data={linuxRequirements} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </>
      )}

      {/* Reviews */}
      {displayReviews.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
            <div className="space-y-3">
              {displayReviews.map((r) => (
                <Card key={r.reviewId}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-3 text-sm text-muted-foreground">
                      {r.votedUp ? (
                        <ThumbsUp className="size-4 text-green-500" />
                      ) : (
                        <ThumbsDown className="size-4 text-red-500" />
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {r.playtimeForever != null ? formatPlaytime(r.playtimeForever) : '—'}
                      </span>
                      {r.timestampCreated && (
                        <span>{formatTimestamp(r.timestampCreated)}</span>
                      )}
                      {r.votesUp != null && r.votesUp > 0 && (
                        <span>{r.votesUp} helpful</span>
                      )}
                    </div>
                    <p className="line-clamp-4 text-sm">{r.review}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
