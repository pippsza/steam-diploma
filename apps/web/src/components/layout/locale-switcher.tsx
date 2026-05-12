'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routing } from '@/i18n/routing'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleSwitch = () => {
    const nextLocale = locale === 'uk' ? 'en' : 'uk'
    const segments = (pathname ?? '/').split('/')

    const localeIndex = segments.findIndex((s) => routing.locales.includes(s as 'uk' | 'en'))
    if (localeIndex !== -1) {
      segments[localeIndex] = nextLocale
    }

    router.replace(segments.join('/'))
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleSwitch} title={locale === 'uk' ? 'English' : 'Українська'}>
      <Globe className="h-4 w-4" />
      <span className="sr-only">{locale === 'uk' ? 'Switch to English' : 'Переключити на українську'}</span>
    </Button>
  )
}
