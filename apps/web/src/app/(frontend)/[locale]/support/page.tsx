import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Mail } from 'lucide-react'

export default async function SupportPage() {
  const t = await getTranslations('support')

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
      <p className="mb-8 text-muted-foreground">{t('subtitle')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Telegram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Get instant help from our support bot
            </p>
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'steam_diploma_bot'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t('telegramButton')}
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('contactUs')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Email us for complex issues
            </p>
            <a href="mailto:support@steam-diploma.dev">
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                support@steam-diploma.dev
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
