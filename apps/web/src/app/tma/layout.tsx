import type { ReactNode } from 'react'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { TMAProvider } from '@/components/tma/tma-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
})

export default function TMALayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}>
        <SessionProvider>
          <TMAProvider>
            <main className="min-h-screen bg-background text-foreground">
              <div className="container mx-auto px-4 py-4">
                {children}
              </div>
            </main>
          </TMAProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
