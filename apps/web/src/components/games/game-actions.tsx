'use client'

import { useState, useTransition } from 'react'
import { Heart, Star, ShoppingCart, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { addFavorite, removeFavorite } from '@/actions/favorites'
import { addToWishlist, removeFromWishlist } from '@/actions/wishlist'
import { purchaseGame } from '@/actions/purchases'

interface GameActionsProps {
  gameId: string
  initialIsFavorite?: boolean
  initialIsWishlisted?: boolean
  initialIsOwned?: boolean
  price?: number
}

export function GameActions({
  gameId,
  initialIsFavorite = false,
  initialIsWishlisted = false,
  initialIsOwned = false,
  price = 0,
}: GameActionsProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [isFav, setIsFav] = useState(initialIsFavorite)
  const [isWish, setIsWish] = useState(initialIsWishlisted)
  const [isOwned, setIsOwned] = useState(initialIsOwned)

  if (!session?.user) return null

  const handleFavorite = () => {
    startTransition(async () => {
      if (isFav) {
        await removeFavorite(gameId)
        setIsFav(false)
      } else {
        await addFavorite(gameId)
        setIsFav(true)
      }
    })
  }

  const handleWishlist = () => {
    startTransition(async () => {
      if (isWish) {
        await removeFromWishlist(gameId)
        setIsWish(false)
      } else {
        await addToWishlist(gameId)
        setIsWish(true)
      }
    })
  }

  const handlePurchase = () => {
    startTransition(async () => {
      const result = await purchaseGame(gameId, price)
      if (result.success) {
        setIsOwned(true)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isOwned ? (
        <Button variant="secondary" disabled>
          <Check className="mr-2 h-4 w-4" />
          In Library
        </Button>
      ) : (
        <Button onClick={handlePurchase} disabled={isPending}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {price > 0 ? `Buy $${(price / 100).toFixed(2)}` : 'Get Free'}
        </Button>
      )}

      <Button
        variant={isFav ? 'default' : 'outline'}
        size="icon"
        onClick={handleFavorite}
        disabled={isPending}
      >
        <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
      </Button>

      <Button
        variant={isWish ? 'default' : 'outline'}
        size="icon"
        onClick={handleWishlist}
        disabled={isPending}
      >
        <Star className={`h-4 w-4 ${isWish ? 'fill-current' : ''}`} />
      </Button>
    </div>
  )
}
