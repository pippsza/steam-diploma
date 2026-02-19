'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { routing } from '@/i18n/routing'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleSwitch = () => {
    const nextLocale = locale === 'uk' ? 'en' : 'uk'
    const segments = pathname.split('/')

    // Replace locale segment
    const localeIndex = segments.findIndex((s) => routing.locales.includes(s as 'uk' | 'en'))
    if (localeIndex !== -1) {
      segments[localeIndex] = nextLocale
    }

    router.replace(segments.join('/'))
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSwitch} className="gap-1 text-xs font-medium">
      {locale === 'uk' ? '🇺🇦 UA' : '🇬🇧 EN'}
    </Button>
  )
}
