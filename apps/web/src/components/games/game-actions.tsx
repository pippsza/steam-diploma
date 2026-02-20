'use client'

import { useState, useTransition } from 'react'
import { Heart, Star, ShoppingCart, Check } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  const t = useTranslations('auth')
  const [isPending, startTransition] = useTransition()
  const [isFav, setIsFav] = useState(initialIsFavorite)
  const [isWish, setIsWish] = useState(initialIsWishlisted)
  const [isOwned, setIsOwned] = useState(initialIsOwned)

  const isAuthenticated = !!session?.user

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      signIn('google')
      return
    }
    action()
  }

  const handleFavorite = () => {
    requireAuth(() => {
      startTransition(async () => {
        if (isFav) {
          await removeFavorite(gameId)
          setIsFav(false)
        } else {
          await addFavorite(gameId)
          setIsFav(true)
        }
      })
    })
  }

  const handleWishlist = () => {
    requireAuth(() => {
      startTransition(async () => {
        if (isWish) {
          await removeFromWishlist(gameId)
          setIsWish(false)
        } else {
          await addToWishlist(gameId)
          setIsWish(true)
        }
      })
    })
  }

  const handlePurchase = () => {
    requireAuth(() => {
      startTransition(async () => {
        const result = await purchaseGame(gameId, price)
        if (result.success) {
          setIsOwned(true)
          setIsWish(false)
        }
      })
    })
  }

  const authTooltip = !isAuthenticated ? t('signInToInteract') : undefined

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {isOwned ? (
          <Button variant="secondary" disabled>
            <Check className="mr-2 h-4 w-4" />
            In Library
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handlePurchase} disabled={isPending}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {price > 0 ? `Buy $${(price / 100).toFixed(2)}` : 'Get Free'}
              </Button>
            </TooltipTrigger>
            {authTooltip && <TooltipContent>{authTooltip}</TooltipContent>}
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isFav ? 'default' : 'outline'}
              size="icon"
              onClick={handleFavorite}
              disabled={isPending}
            >
              <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
            </Button>
          </TooltipTrigger>
          {authTooltip && <TooltipContent>{authTooltip}</TooltipContent>}
        </Tooltip>

        {!isOwned && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isWish ? 'default' : 'outline'}
                size="icon"
                onClick={handleWishlist}
                disabled={isPending}
              >
                <Star className={`h-4 w-4 ${isWish ? 'fill-current' : ''}`} />
              </Button>
            </TooltipTrigger>
            {authTooltip && <TooltipContent>{authTooltip}</TooltipContent>}
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
