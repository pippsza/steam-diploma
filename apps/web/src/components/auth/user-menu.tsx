'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignInButton } from './sign-in-button'

export function UserMenu() {
  const { data: session, status } = useSession()
  const t = useTranslations('common')
  const locale = useLocale()

  if (status === 'loading') {
    return <Button variant="ghost" size="icon" disabled className="h-8 w-8 rounded-full opacity-0" />
  }

  if (!session?.user) {
    return <SignInButton />
  }

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="font-medium">{session.user.name}</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/settings`}>{t('settings')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>{t('signOut')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
