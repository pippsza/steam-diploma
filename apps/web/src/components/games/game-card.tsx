import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSteamHeaderImage } from '@/lib/steam'
import { formatPrice } from '@/lib/game-status'

interface GameCardProps {
  appid: number
  name: string
  headerImage?: string | null
  isFree?: boolean
  isOwned?: boolean
  price?: {
    currency?: string | null
    final?: number | null
    discountPercent?: number | null
  } | null
  genres?: Array<{ description?: string | null }> | null
}

export function GameCard({ appid, name, headerImage, isFree, isOwned, price, genres }: GameCardProps) {
  const locale = useLocale()
  const t = useTranslations('games')
  const imageUrl = headerImage || getSteamHeaderImage(appid)

  const displayPrice = isFree
    ? t('free')
    : price?.final
      ? formatPrice(price.final, price.currency)
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
          {isOwned ? (
            <Badge className="absolute top-2 right-2 bg-green-600/90 backdrop-blur-sm">
              <Check className="mr-1 size-3" />
              {t('inLibrary')}
            </Badge>
          ) : price?.discountPercent ? (
            <Badge className="absolute top-2 right-2 bg-green-600">
              -{price.discountPercent}%
            </Badge>
          ) : null}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 font-medium text-sm">{name}</h3>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex gap-1">
              {genres?.slice(0, 2).map((g) => (
                <Badge key={g.description} variant="secondary" className="text-xs">
                  {g.description}
                </Badge>
              ))}
            </div>
            {!isOwned && displayPrice && (
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
