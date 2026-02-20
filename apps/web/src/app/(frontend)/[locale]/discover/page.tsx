'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Bot, ArrowLeft, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useChatContext } from '@/components/ai/chat-provider'
import { GameGrid } from '@/components/games/game-grid'
import { Button } from '@/components/ui/button'

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function DiscoverPage() {
  const { toolAction, open } = useChatContext()
  const t = useTranslations('discover')
  const router = useRouter()

  // Redirect home if no search results
  useEffect(() => {
    if (!toolAction || toolAction.type !== 'search_games') {
      router.replace('/')
    }
  }, [toolAction, router])

  if (!toolAction || toolAction.type !== 'search_games') return null

  const { games, aiMessage } = toolAction

  // Map genres from string[] to { description: string }[] for GameGrid
  const mappedGames = games.map((g) => ({
    ...g,
    genres: g.genres?.map((d) => ({ description: d })) ?? null,
  }))

  return (
    <motion.div
      className="container py-8"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div className="mb-6 flex items-center gap-3" variants={fadeUp}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
      </motion.div>

      {/* AI message */}
      {aiMessage && (
        <motion.div
          className="mb-6 rounded-lg border bg-muted/50 p-4"
          variants={fadeUp}
        >
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiMessage}</p>
        </motion.div>
      )}

      {/* Game grid */}
      <motion.div variants={fadeUp}>
        {mappedGames.length > 0 ? (
          <GameGrid games={mappedGames} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-muted-foreground">{t('noResults')}</p>
          </div>
        )}
      </motion.div>

      {/* Continue chatting */}
      <motion.div className="mt-8 text-center" variants={fadeUp}>
        <Button variant="outline" onClick={open} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          {t('continueChat')}
        </Button>
      </motion.div>
    </motion.div>
  )
}
