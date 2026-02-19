import type { ReactNode } from 'react'
import { TMAProvider } from '@/components/tma/tma-provider'

export default function TMALayout({ children }: { children: ReactNode }) {
  return (
    <TMAProvider>
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-4">
          {children}
        </div>
      </main>
    </TMAProvider>
  )
}
