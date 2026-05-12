import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { listComments } from '@/actions/comments'
import { Separator } from '@/components/ui/separator'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'

interface Props {
  gameId: string
}

export async function CommentsSection({ gameId }: Props) {
  const [comments, session, t] = await Promise.all([
    listComments(gameId),
    auth(),
    getTranslations('games.comments'),
  ])
  const currentUserId = session?.user?.id ? String(session.user.id) : null

  return (
    <>
      <Separator />
      <section className="space-y-6 font-(family-name:--font-inter)">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-2xl font-semibold leading-normal md:text-3xl">{t('title')}</h2>
          <span className="text-sm text-muted-foreground">
            {t('count', { count: comments.length })}
          </span>
        </div>

        <CommentForm gameId={gameId} />

        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                gameId={gameId}
                canDelete={!!currentUserId && c.user?.id === currentUserId}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
