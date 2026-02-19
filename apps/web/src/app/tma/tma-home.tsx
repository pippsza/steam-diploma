'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSteamHeaderImage } from '@/lib/steam'
import { hapticFeedback } from '@/lib/tma'

interface Game {
  appid: number
  name: string
  headerImage?: string | null
  isFree?: boolean | null
  price?: {
    currency?: string | null
    final?: number | null
    discountPercent?: number | null
  } | null
  genres?: Array<{ description?: string | null }> | null
}

export function TMAHome({ games }: { games: Game[] }) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? games.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : games

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Steam Diploma</h1>

      <Input
        placeholder="Search games..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      <div className="grid grid-cols-1 gap-3">
        {filtered.map((game) => (
          <Link
            key={game.appid}
            href={`/tma/games/${game.appid}`}
            onClick={() => hapticFeedback('selection')}
          >
            <Card className="overflow-hidden">
              <div className="flex gap-3">
                <div className="relative h-20 w-36 shrink-0">
                  <Image
                    src={game.headerImage || getSteamHeaderImage(game.appid)}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                </div>
                <CardContent className="flex flex-col justify-center p-2">
                  <h3 className="line-clamp-1 text-sm font-medium">{game.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    {game.genres?.slice(0, 1).map((g) => (
                      <Badge key={g.description} variant="secondary" className="text-xs">
                        {g.description}
                      </Badge>
                    ))}
                    {game.isFree ? (
                      <span className="text-xs font-bold text-green-500">Free</span>
                    ) : game.price?.final ? (
                      <span className="text-xs font-bold">
                        ${(game.price.final / 100).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
