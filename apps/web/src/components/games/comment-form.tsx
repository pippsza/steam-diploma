'use client'

import { useState, useTransition } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addComment } from '@/actions/comments'

interface Props {
  gameId: string
}

export function CommentForm({ gameId }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const t = useTranslations('games.comments')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isAuthenticated = !!session?.user

  if (!isAuthenticated) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center">
        <p className="mb-3 text-sm text-muted-foreground">{t('signInToComment')}</p>
        <Button variant="outline" size="sm" onClick={() => signIn('google')}>
          {t('signIn')}
        </Button>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const text = value.trim()
    if (!text) return

    startTransition(async () => {
      const result = await addComment(gameId, text)
      if (result.success) {
        setValue('')
        router.refresh()
      } else {
        setError(result.error ?? t('errorGeneric'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('placeholder')}
        maxLength={2000}
        disabled={isPending}
        className="font-(family-name:--font-inter) leading-[1.7]"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{value.length} / 2000</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-destructive">{error}</span>}
          <Button type="submit" size="sm" disabled={isPending || !value.trim()}>
            {isPending ? t('posting') : t('post')}
          </Button>
        </div>
      </div>
    </form>
  )
}
