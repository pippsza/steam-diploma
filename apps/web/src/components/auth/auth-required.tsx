'use client'

import { LogIn } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface AuthRequiredProps {
  message?: string
}

export function AuthRequired({ message }: AuthRequiredProps) {
  const t = useTranslations('auth')

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
      <LogIn className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-semibold">{t('signInRequired')}</h3>
        <p className="text-sm text-muted-foreground">
          {message || t('signInRequiredDescription')}
        </p>
      </div>
      <Button onClick={() => signIn('google')}>
        {t('signInGoogle')}
      </Button>
    </div>
  )
}
