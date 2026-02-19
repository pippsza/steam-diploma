'use client'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function SignInButton() {
  const t = useTranslations('auth')

  return (
    <Button onClick={() => signIn('google')} variant="default">
      {t('signInGoogle')}
    </Button>
  )
}
