'use client'

import { MessageCircle, Send, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatContext } from './chat-provider'
import { ChatMessages } from './chat-messages'
import { cn } from '@/lib/utils'

export function ChatInputBar() {
  const { data: session } = useSession()
  const t = useTranslations('chat')
  const { input, setInput, handleSubmit, isOpen, open, close, isLoading } = useChatContext()

  if (!session?.user) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={close}
        />
      )}

      {/* Chat container */}
      <div
        className={cn(
          'fixed z-50 transition-all duration-300 ease-in-out',
          isOpen
            ? 'inset-4 top-20 bottom-4 sm:inset-x-[10%] sm:top-[10%] sm:bottom-[10%]'
            : 'bottom-4 left-1/2 -translate-x-1/2 w-[min(24rem,calc(100vw-2rem))]',
        )}
      >
        <div
          className={cn(
            'flex h-full flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-300',
            isOpen ? 'rounded-2xl' : 'rounded-full',
          )}
        >
          {/* Expanded: Header + Messages */}
          {isOpen && (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <h2 className="font-semibold">{t('title')}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={close}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ChatMessages />
            </>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!isOpen) {
                open()
                return
              }
              handleSubmit(e)
            }}
            className={cn('flex items-center gap-2', isOpen ? 'border-t p-3' : 'p-2')}
          >
            {!isOpen && <MessageCircle className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              onFocus={() => !isOpen && open()}
              className={cn(
                'flex-1 border-0 bg-transparent focus-visible:ring-0',
                !isOpen && 'text-sm',
              )}
            />
            {isOpen && (
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
