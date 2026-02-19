import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getSteamHeaderImage } from '@/lib/steam'

interface GameDetailProps {
  appid: number
  name: string
  headerImage?: string | null
  shortDescription?: string | null
  isFree?: boolean | null
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
}

export function GameDetail({
  appid,
  name,
  headerImage,
  shortDescription,
  isFree,
  price,
  genres,
  developers,
  publishers,
  platforms,
  releaseDate,
  metacritic,
  screenshots,
  recommendations,
}: GameDetailProps) {
  const imageUrl = headerImage || getSteamHeaderImage(appid)

  const displayPrice = isFree
    ? 'Free'
    : price?.final
      ? `$${(price.final / 100).toFixed(2)}`
      : 'N/A'

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
          {price?.discountPercent ? (
            <Badge className="mb-1 bg-green-600 text-lg">-{price.discountPercent}%</Badge>
          ) : null}
          <p className="text-2xl font-bold">{displayPrice}</p>
        </div>
      </div>

      <Separator />

      {/* Description */}
      {shortDescription && <p className="text-muted-foreground">{shortDescription}</p>}

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
      </div>

      {/* Screenshots */}
      {screenshots && screenshots.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-lg font-semibold">Screenshots</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {screenshots.slice(0, 4).map((s, i) => (
                <div key={i} className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={s.url || s.thumbnailUrl || ''}
                    alt={`${name} screenshot ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
