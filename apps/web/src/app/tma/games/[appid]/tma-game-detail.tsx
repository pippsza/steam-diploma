'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSteamHeaderImage } from '@/lib/steam'
import { formatPrice, getGameAvailability } from '@/lib/game-status'
import { hapticFeedback, closeMiniApp } from '@/lib/tma'

interface Game {
  appid: number
  name: string
  headerImage?: string | null
  shortDescription?: string | null
  isFree?: boolean | null
  comingSoon?: boolean | null
  price?: {
    currency?: string | null
    final?: number | null
    discountPercent?: number | null
  } | null
  genres?: Array<{ description?: string | null }> | null
  platforms?: {
    windows?: boolean | null
    mac?: boolean | null
    linux?: boolean | null
  } | null
  releaseDate?: string | null
  developers?: Array<{ name?: string | null }> | null
  metacritic?: {
    score?: number | null
  } | null
  screenshots?: Array<{ url?: string | null }> | null
}

export function TMAGameDetail({ game }: { game: Game }) {
  const imageUrl = game.headerImage || getSteamHeaderImage(game.appid)

  const availability = getGameAvailability({
    isFree: game.isFree,
    comingSoon: game.comingSoon,
    price: game.price,
  })
  const displayPrice =
    availability.kind === 'free'
      ? 'Free'
      : availability.kind === 'paid'
        ? formatPrice(availability.cents, availability.currency)
        : availability.kind === 'comingSoon'
          ? 'Coming Soon'
          : 'Unavailable'
  const canBuy = availability.kind === 'free' || availability.kind === 'paid'

  return (
    <div className="space-y-4 pb-8">
      <button
        onClick={() => window.history.back()}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back
      </button>

      <div className="relative aspect-[460/215] w-full overflow-hidden rounded-lg">
        <Image
          src={imageUrl}
          alt={game.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      <div>
        <h1 className="text-xl font-bold">{game.name}</h1>
        {game.developers?.[0]?.name && (
          <p className="text-sm text-muted-foreground">by {game.developers[0].name}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {game.genres?.map((g) => (
          <Badge key={g.description} variant="secondary">
            {g.description}
          </Badge>
        ))}
      </div>

      {game.shortDescription && (
        <p className="font-(family-name:--font-inter) text-base leading-[1.7] text-muted-foreground">
          {game.shortDescription}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Price:</span>{' '}
          <span className="font-bold">{displayPrice}</span>
          {game.price?.discountPercent ? (
            <Badge className="ml-2 bg-green-600">-{game.price.discountPercent}%</Badge>
          ) : null}
        </div>
        {game.metacritic?.score && (
          <div>
            <span className="text-muted-foreground">Metacritic:</span>{' '}
            <span className="font-bold">{game.metacritic.score}</span>
          </div>
        )}
        {game.releaseDate && (
          <div>
            <span className="text-muted-foreground">Release:</span> {game.releaseDate}
          </div>
        )}
        {game.platforms && (
          <div>
            <span className="text-muted-foreground">Platforms:</span>{' '}
            {[
              game.platforms.windows && 'Win',
              game.platforms.mac && 'Mac',
              game.platforms.linux && 'Linux',
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
        )}
      </div>

      {game.screenshots && game.screenshots.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Screenshots</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {game.screenshots.slice(0, 5).map((s, i) => (
              <div key={i} className="relative h-24 w-40 shrink-0 overflow-hidden rounded">
                <Image
                  src={s.url || ''}
                  alt={`Screenshot ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!canBuy}
        onClick={() => {
          if (!canBuy) return
          hapticFeedback('notification')
          closeMiniApp()
        }}
      >
        {availability.kind === 'free'
          ? 'Get Game'
          : availability.kind === 'paid'
            ? `Buy for ${displayPrice}`
            : displayPrice}
      </Button>
    </div>
  )
}
