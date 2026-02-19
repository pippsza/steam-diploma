import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSteamHeaderImage } from '@/lib/steam'

interface GameCardProps {
  appid: number
  name: string
  headerImage?: string | null
  isFree?: boolean
  price?: {
    currency?: string | null
    final?: number | null
    discountPercent?: number | null
  } | null
  genres?: Array<{ description?: string | null }> | null
}

export function GameCard({ appid, name, headerImage, isFree, price, genres }: GameCardProps) {
  const locale = useLocale()
  const imageUrl = headerImage || getSteamHeaderImage(appid)

  const displayPrice = isFree
    ? 'Free'
    : price?.final
      ? `$${(price.final / 100).toFixed(2)}`
      : null

  return (
    <Link href={`/${locale}/games/${appid}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="relative aspect-[460/215] overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {price?.discountPercent ? (
            <Badge className="absolute top-2 right-2 bg-green-600">
              -{price.discountPercent}%
            </Badge>
          ) : null}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 font-medium text-sm">{name}</h3>
          <div className="mt-1 flex items-center justify-between">
            <div className="flex gap-1">
              {genres?.slice(0, 2).map((g) => (
                <Badge key={g.description} variant="secondary" className="text-xs">
                  {g.description}
                </Badge>
              ))}
            </div>
            {displayPrice && (
              <span className={`text-sm font-bold ${isFree ? 'text-green-500' : ''}`}>
                {displayPrice}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
