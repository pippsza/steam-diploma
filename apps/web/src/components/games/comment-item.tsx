'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { deleteComment, type CommentItem as CommentItemType } from '@/actions/comments'

interface Props {
  comment: CommentItemType
  gameId: string
  canDelete: boolean
}

export function CommentItem({ comment, gameId, canDelete }: Props) {
  const router = useRouter()
  const t = useTranslations('games.comments')
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await deleteComment(comment.id, gameId)
      router.refresh()
    })
  }

  const displayName = comment.user?.name ?? t('anonymous')
  const initial = displayName.charAt(0).toUpperCase()
  const date = new Date(comment.createdAt).toLocaleDateString()

  return (
    <div className="flex gap-3 rounded-md border bg-card p-4">
      <Avatar className="size-9 shrink-0">
        {comment.user?.image && <AvatarImage src={comment.user.image} alt={displayName} />}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{displayName}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
              aria-label={t('delete')}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        <p className="font-(family-name:--font-inter) whitespace-pre-line text-base leading-[1.7]">
          {comment.content}
        </p>
      </div>
    </div>
  )
}
