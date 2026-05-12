'use client'

import { useState, useTransition } from 'react'
import { Heart, Star, ShoppingCart, Check, Ban, Calendar } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { addFavorite, removeFavorite } from '@/actions/favorites'
import { addToWishlist, removeFromWishlist } from '@/actions/wishlist'
import { PurchaseDialog } from './purchase-dialog'
import { formatPrice, getGameAvailability } from '@/lib/game-status'

interface GameActionsProps {
  gameId: string
  appid: number
  name: string
  headerImage?: string | null
  initialIsFavorite?: boolean
  initialIsWishlisted?: boolean
  initialIsOwned?: boolean
  price?: number
  currency?: string | null
  isFree?: boolean | null
  comingSoon?: boolean | null
}

export function GameActions({
  gameId,
  appid,
  name,
  headerImage,
  initialIsFavorite = false,
  initialIsWishlisted = false,
  initialIsOwned = false,
  price = 0,
  currency = null,
  isFree = false,
  comingSoon = false,
}: GameActionsProps) {
  const { data: session } = useSession()
  const tAuth = useTranslations('auth')
  const tGames = useTranslations('games')
  const [isPending, startTransition] = useTransition()
  const [isFav, setIsFav] = useState(initialIsFavorite)
  const [isWish, setIsWish] = useState(initialIsWishlisted)
  const [isOwned, setIsOwned] = useState(initialIsOwned)
  const [purchaseOpen, setPurchaseOpen] = useState(false)

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
    requireAuth(() => setPurchaseOpen(true))
  }

  const handlePurchased = () => {
    setIsOwned(true)
    setIsWish(false)
  }

  const authTooltip = !isAuthenticated ? tAuth('signInToInteract') : undefined

  const availability = getGameAvailability({
    isOwned,
    isFree,
    comingSoon,
    price: { final: price, currency },
  })

  const renderPurchaseButton = () => {
    switch (availability.kind) {
      case 'owned':
        return (
          <Button variant="secondary" disabled>
            <Check className="mr-2 h-4 w-4" />
            {tGames('inLibrary')}
          </Button>
        )
      case 'comingSoon':
        return (
          <Button variant="secondary" disabled>
            <Calendar className="mr-2 h-4 w-4" />
            {tGames('comingSoon')}
          </Button>
        )
      case 'unavailable':
        return (
          <Button variant="secondary" disabled>
            <Ban className="mr-2 h-4 w-4" />
            {tGames('unavailable')}
          </Button>
        )
      case 'free':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handlePurchase} disabled={isPending}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {tGames('getFree')}
              </Button>
            </TooltipTrigger>
            {authTooltip && <TooltipContent>{authTooltip}</TooltipContent>}
          </Tooltip>
        )
      case 'paid':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handlePurchase} disabled={isPending}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {tGames('buyFor', { price: formatPrice(availability.cents, availability.currency) })}
              </Button>
            </TooltipTrigger>
            {authTooltip && <TooltipContent>{authTooltip}</TooltipContent>}
          </Tooltip>
        )
    }
  }

  return (
    <TooltipProvider>
      <PurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        gameId={gameId}
        appid={appid}
        name={name}
        headerImage={headerImage}
        isFree={!!isFree}
        priceCents={price}
        currency={currency}
        onPurchased={handlePurchased}
      />
      <div className="flex flex-wrap gap-2">
        {renderPurchaseButton()}

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
