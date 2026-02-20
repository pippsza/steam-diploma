'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageCircle, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { submitSupportTicket, getTelegramBotUsername } from '@/actions/support'

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'critical', label: 'Critical', color: 'bg-orange-600' },
] as const

const TYPES = [
  { value: 'bug', label: 'Bug' },
  { value: 'question', label: 'Question' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' },
] as const

export default function SupportPage() {
  const t = useTranslations('support')
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Auto-fill name and email from session
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !name) setName(session.user.name)
      if (session.user.email && !email) setEmail(session.user.email)
    }
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')
  const [type, setType] = useState('question')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [botUsername, setBotUsername] = useState<string | null>(null)

  useEffect(() => {
    getTelegramBotUsername().then(setBotUsername)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await submitSupportTicket({ name, email: email || undefined, subject, message, priority, type })

    if (res.success) {
      setResult({ success: true, message: t('successMessage') })
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
      setPriority('medium')
      setType('question')
    } else {
      setResult({ success: false, message: t('errorMessage') })
    }
    setLoading(false)
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
      <p className="mb-8 text-muted-foreground">{t('subtitle')}</p>

      <Card>
        <CardHeader>
          <CardTitle>{t('formTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('nameLabel')} *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('emailLabel')}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('subjectLabel')} *</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder={t('subjectPlaceholder')}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('typeLabel')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t('priorityLabel')}</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      priority === p.value
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-input hover:bg-accent'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('messageLabel')} *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder={t('messagePlaceholder')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                  result.success
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {result.message}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t('submitButton')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">{t('orTelegram')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <a
        href={botUsername ? `https://t.me/${botUsername}` : '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button variant="outline" className="w-full">
          <MessageCircle className="mr-2 h-4 w-4" />
          {t('telegramButton')}
        </Button>
      </a>
    </div>
  )
}
