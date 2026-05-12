'use client'

import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Dices } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getRandomGameAppId } from '@/actions/games'

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
  currentHasReqs?: string
}

export function SearchFilters({ currentQuery, currentGenre, currentFree, currentPlatform, currentHasReqs }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? 'en'
  const [query, setQuery] = useState(currentQuery ?? '')
  const [isRandomPending, startRandom] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleRandom = () => {
    startRandom(async () => {
      const appid = await getRandomGameAppId()
      if (appid) router.push(`/${locale}/games/${appid}`, { scroll: false })
    })
  }

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
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

  useEffect(() => {
    setQuery(currentQuery ?? '')
  }, [currentQuery])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams('q', value || null)
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Search</label>
        <Input
          placeholder="Game name..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
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

      <div className="flex flex-col gap-2">
        <Button
          variant={currentFree === 'true' ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          onClick={() => updateParams('free', currentFree === 'true' ? null : 'true')}
        >
          Free to Play
        </Button>
        <Button
          variant={currentHasReqs === 'true' ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          onClick={() => updateParams('reqs', currentHasReqs === 'true' ? null : 'true')}
        >
          Has PC Requirements
        </Button>
      </div>

      <Separator />

      <Button
        variant="secondary"
        size="sm"
        className="w-full gap-2"
        onClick={handleRandom}
        disabled={isRandomPending}
      >
        <Dices className={`size-4 ${isRandomPending ? 'animate-spin' : ''}`} />
        {isRandomPending ? 'Picking...' : 'Random Game'}
      </Button>

      {(currentQuery || currentGenre || currentFree || currentPlatform || currentHasReqs) && (
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
