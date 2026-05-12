export type GameAvailability =
  | { kind: 'owned' }
  | { kind: 'comingSoon' }
  | { kind: 'free' }
  | {
      kind: 'paid'
      cents: number
      currency?: string | null
      discountPercent?: number | null
    }
  | { kind: 'unavailable' }

export interface GameStatusInput {
  isOwned?: boolean | null
  isFree?: boolean | null
  comingSoon?: boolean | null
  price?: {
    final?: number | null
    currency?: string | null
    discountPercent?: number | null
  } | null
}

export function getGameAvailability(input: GameStatusInput): GameAvailability {
  if (input.isOwned) return { kind: 'owned' }
  if (input.comingSoon) return { kind: 'comingSoon' }
  if (input.isFree) return { kind: 'free' }
  const cents = input.price?.final ?? 0
  if (cents > 0) {
    return {
      kind: 'paid',
      cents,
      currency: input.price?.currency ?? null,
      discountPercent: input.price?.discountPercent ?? null,
    }
  }
  return { kind: 'unavailable' }
}

// Steam returns ISO 4217 codes (UAH, USD, EUR…) and integer minor units.
// Use Intl.NumberFormat so the symbol, separators, and decimals match the currency.
export function formatPrice(cents: number, currency: string | null | undefined): string {
  const amount = cents / 100
  const code = (currency ?? 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${code}`
  }
}
