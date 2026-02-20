'use client'

import { useEffect, useState } from 'react'

function generateBoxShadow(count: number, color: string): string {
  const shadows: string[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2000)
    const y = Math.floor(Math.random() * 2000)
    shadows.push(`${x}px ${y}px ${color}`)
  }
  return shadows.join(', ')
}

export function StarBackground() {
  const [stars, setStars] = useState<[string, string, string] | null>(null)

  useEffect(() => {
    const color = 'var(--primary)'
    setStars([
      generateBoxShadow(700, color),
      generateBoxShadow(200, color),
      generateBoxShadow(100, color),
    ])
  }, [])

  if (!stars) return <div className="pointer-events-none fixed inset-0 -z-10" />

  const [small, medium, big] = stars

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Small stars */}
      <div
        className="absolute"
        style={{
          width: '1px',
          height: '1px',
          background: 'transparent',
          boxShadow: small,
          animation: 'animStar 50s linear infinite',
        }}
      >
        <div
          className="absolute"
          style={{
            top: '2000px',
            width: '1px',
            height: '1px',
            background: 'transparent',
            boxShadow: small,
          }}
        />
      </div>

      {/* Medium stars */}
      <div
        className="absolute"
        style={{
          width: '2px',
          height: '2px',
          background: 'transparent',
          boxShadow: medium,
          animation: 'animStar 100s linear infinite',
        }}
      >
        <div
          className="absolute"
          style={{
            top: '2000px',
            width: '2px',
            height: '2px',
            background: 'transparent',
            boxShadow: medium,
          }}
        />
      </div>

      {/* Big stars */}
      <div
        className="absolute"
        style={{
          width: '3px',
          height: '3px',
          background: 'transparent',
          boxShadow: big,
          animation: 'animStar 150s linear infinite',
        }}
      >
        <div
          className="absolute"
          style={{
            top: '2000px',
            width: '3px',
            height: '3px',
            background: 'transparent',
            boxShadow: big,
          }}
        />
      </div>
    </div>
  )
}
