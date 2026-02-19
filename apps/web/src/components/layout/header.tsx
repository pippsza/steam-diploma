'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Gamepad2, Heart, Library, Star, HelpCircle, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { UserMenu } from '@/components/auth/user-menu'

export function Header() {
  const t = useTranslations('common')
  const locale = useLocale()

  const navItems = [
    { href: `/${locale}`, label: t('home'), icon: Gamepad2 },
    { href: `/${locale}/library`, label: t('library'), icon: Library },
    { href: `/${locale}/favorites`, label: t('favorites'), icon: Heart },
    { href: `/${locale}/wishlist`, label: t('wishlist'), icon: Star },
    { href: `/${locale}/recommendations`, label: t('recommendations'), icon: Search },
    { href: `/${locale}/support`, label: t('support'), icon: HelpCircle },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href={`/${locale}`} className="mr-6 flex items-center gap-2 font-bold">
          <Gamepad2 className="h-5 w-5" />
          <span className="hidden sm:inline">{t('appName')}</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
