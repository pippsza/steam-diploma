'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const GENRES = [
  'Action',
  'Adventure',
  'RPG',
  'Strategy',
  'Simulation',
  'Sports',
  'Racing',
  'Indie',
  'Casual',
  'Puzzle',
  'Horror',
  'Platformer',
]

const PLATFORMS = [
  { value: 'windows', label: 'Windows' },
  { value: 'mac', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
]

interface SearchFiltersProps {
  currentQuery?: string
  currentGenre?: string
  currentFree?: string
  currentPlatform?: string
}

export function SearchFilters({ currentQuery, currentGenre, currentFree, currentPlatform }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Search</label>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            updateParams('q', formData.get('q') as string || null)
          }}
        >
          <Input name="q" placeholder="Game name..." defaultValue={currentQuery} />
        </form>
      </div>

      <Separator />

      <div>
        <label className="mb-2 block text-sm font-medium">Genres</label>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((genre) => (
            <Badge
              key={genre}
              variant={currentGenre === genre ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => updateParams('genre', currentGenre === genre ? null : genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <label className="mb-2 block text-sm font-medium">Platform</label>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <Badge
              key={p.value}
              variant={currentPlatform === p.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => updateParams('platform', currentPlatform === p.value ? null : p.value)}
            >
              {p.label}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <Button
          variant={currentFree === 'true' ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          onClick={() => updateParams('free', currentFree === 'true' ? null : 'true')}
        >
          Free to Play
        </Button>
      </div>

      {(currentQuery || currentGenre || currentFree || currentPlatform) && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => router.push('?')}
          >
            Clear Filters
          </Button>
        </>
      )}
    </div>
  )
}
