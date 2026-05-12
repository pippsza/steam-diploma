import { getPayload } from 'payload'
import config from '@payload-config'

// Popular esports games (Steam appids). Used to wire tournaments to existing game docs.
const GAMES_BY_APPID: Record<number, string> = {
  730: 'Counter-Strike 2',
  570: 'Dota 2',
  578080: 'PUBG: BATTLEGROUNDS',
  252490: 'Rust',
  1172470: 'Apex Legends',
  252950: 'Rocket League',
  440: 'Team Fortress 2',
  271590: 'Grand Theft Auto V',
  1086940: "Baldur's Gate 3",
  1245620: 'Elden Ring',
  892970: 'Valheim',
  413150: 'Stardew Valley',
}

interface TournamentSeed {
  name: string
  appid: number
  prizePool: number
  startsInDays: number
  durationDays: number
  format: 'single-elimination' | 'double-elimination' | 'round-robin' | 'swiss' | 'showmatch'
  maxParticipants: number
  organizer: string
  location: string
  logo?: string
}

// Mix of past, live and upcoming tournaments across popular esports titles.
const TOURNAMENT_SEEDS: TournamentSeed[] = [
  // CS2 — live & upcoming
  { name: 'IEM Cologne 2026', appid: 730, prizePool: 1000000, startsInDays: -2, durationDays: 10, format: 'double-elimination', maxParticipants: 16, organizer: 'ESL', location: 'Cologne, DE' },
  { name: 'BLAST Premier Spring Final', appid: 730, prizePool: 425000, startsInDays: 14, durationDays: 6, format: 'double-elimination', maxParticipants: 8, organizer: 'BLAST', location: 'Lisbon, PT' },
  { name: 'ESL Pro League Season 21', appid: 730, prizePool: 850000, startsInDays: 45, durationDays: 28, format: 'swiss', maxParticipants: 24, organizer: 'ESL', location: 'Online' },
  { name: 'CCT North America Series #3', appid: 730, prizePool: 65000, startsInDays: -30, durationDays: 21, format: 'double-elimination', maxParticipants: 16, organizer: 'CCT', location: 'Online' },

  // Dota 2
  { name: 'The International 2026', appid: 570, prizePool: 25000000, startsInDays: 120, durationDays: 14, format: 'double-elimination', maxParticipants: 18, organizer: 'Valve', location: 'Seattle, US' },
  { name: 'ESL One Birmingham', appid: 570, prizePool: 1000000, startsInDays: -5, durationDays: 7, format: 'double-elimination', maxParticipants: 12, organizer: 'ESL', location: 'Birmingham, UK' },
  { name: 'DreamLeague Season 24', appid: 570, prizePool: 1000000, startsInDays: 30, durationDays: 14, format: 'swiss', maxParticipants: 16, organizer: 'DreamHack', location: 'Stockholm, SE' },
  { name: 'PGL Wallachia Season 2', appid: 570, prizePool: 500000, startsInDays: -40, durationDays: 10, format: 'double-elimination', maxParticipants: 12, organizer: 'PGL', location: 'Bucharest, RO' },

  // PUBG
  { name: 'PUBG Global Championship 2026', appid: 578080, prizePool: 2000000, startsInDays: 90, durationDays: 28, format: 'round-robin', maxParticipants: 32, organizer: 'KRAFTON', location: 'Seoul, KR' },
  { name: 'PCS Charity Showdown', appid: 578080, prizePool: 250000, startsInDays: 7, durationDays: 4, format: 'showmatch', maxParticipants: 16, organizer: 'KRAFTON', location: 'Online' },

  // Apex Legends
  { name: 'ALGS Championship 2026', appid: 1172470, prizePool: 5000000, startsInDays: 75, durationDays: 7, format: 'swiss', maxParticipants: 40, organizer: 'EA / Respawn', location: 'London, UK' },
  { name: 'ALGS Year 5 Split 2', appid: 1172470, prizePool: 1000000, startsInDays: -10, durationDays: 21, format: 'swiss', maxParticipants: 30, organizer: 'EA / Respawn', location: 'Online' },

  // Rocket League
  { name: 'RLCS Major 3', appid: 252950, prizePool: 1000000, startsInDays: 20, durationDays: 5, format: 'double-elimination', maxParticipants: 24, organizer: 'Psyonix', location: 'Dallas, US' },
  { name: 'RLCS Open Qualifier 7', appid: 252950, prizePool: 25000, startsInDays: 3, durationDays: 2, format: 'single-elimination', maxParticipants: 64, organizer: 'Psyonix', location: 'Online' },

  // Rust
  { name: 'Rust Twitch Rivals', appid: 252490, prizePool: 100000, startsInDays: 21, durationDays: 1, format: 'showmatch', maxParticipants: 50, organizer: 'Twitch Rivals', location: 'Online' },

  // TF2 — nostalgia bracket
  { name: 'RGL Highlander Season 16', appid: 440, prizePool: 5000, startsInDays: 10, durationDays: 60, format: 'round-robin', maxParticipants: 24, organizer: 'RGL.gg', location: 'Online' },

  // Singleplayer-leaning — speedrun / community style
  { name: 'Elden Ring Any% Marathon', appid: 1245620, prizePool: 15000, startsInDays: -3, durationDays: 4, format: 'showmatch', maxParticipants: 32, organizer: 'Games Done Quick', location: 'Online' },
  { name: "Baldur's Gate 3 Honour Run Showdown", appid: 1086940, prizePool: 20000, startsInDays: 40, durationDays: 3, format: 'showmatch', maxParticipants: 16, organizer: 'Larian Community', location: 'Online' },
  { name: 'Valheim Boss Rush Cup', appid: 892970, prizePool: 3000, startsInDays: 60, durationDays: 2, format: 'single-elimination', maxParticipants: 16, organizer: 'Community', location: 'Online' },
  { name: 'Stardew Valley Speedrun Open', appid: 413150, prizePool: 1000, startsInDays: 100, durationDays: 1, format: 'showmatch', maxParticipants: 8, organizer: 'SDV Community', location: 'Online' },
  { name: 'GTA V Roleplay Server League', appid: 271590, prizePool: 10000, startsInDays: 14, durationDays: 30, format: 'round-robin', maxParticipants: 20, organizer: 'NoPixel', location: 'Online' },
]

const ESPORTS_NICKS = [
  's1mple', 'ZywOo', 'NiKo', 'donk', 'm0NESY', 'b1t', 'XANTARES', 'broky', 'rain', 'electronic',
  'twistzz', 'KSCERATO', 'jks', 'sh1ro', 'apEX', 'k1to', 'iM', 'sjuush', 'mezii', 'Magisk',
  'Ana', 'Topson', 'Miracle', 'SumaiL', 'Notail', 'Ceb', 'JerAx', 'Yatoro', 'Larl', 'Collapse',
  'Mira', 'Saksa', 'iLTW', 'gpk', 'Pure', 'Nigma', 'Quinn', 'Saberlight', 'Aui_2000', 'Resolut1on',
  'TenZ', 'Aceu', 'ImperialHal', 'Snip3down', 'Reps', 'Hal', 'Genburten', 'NiceWigg', 'Sweet', 'Verhulst',
  'Zylbrad', 'Mande', 'iiTzTimmy', 'Doomsday', 'Sikezz', 'Albralelie',
]

const ESPORTS_TEAMS = [
  'NAVI', 'FaZe', 'G2', 'Astralis', 'Vitality', 'Spirit', 'MOUZ', 'FURIA', 'Heroic', 'Cloud9',
  'Liquid', 'EG', 'OG', 'Tundra', 'GG', 'TSM', 'Sentinels', 'XSET', '100T', 'Optic',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}`
}

function computeStatus(startsAt: Date, endsAt: Date | null, now: Date): 'upcoming' | 'live' | 'ended' {
  if (now < startsAt) return 'upcoming'
  if (endsAt && now > endsAt) return 'ended'
  return 'live'
}

async function main() {
  console.log('Seeding tournaments...')
  const payload = await getPayload({ config })

  // Map appid → game doc id (only for games actually present in the DB).
  const games = await payload.find({
    collection: 'games',
    where: { appid: { in: Object.keys(GAMES_BY_APPID).map(Number) } } as never,
    limit: 100,
    select: { appid: true },
  })
  const gameIdByAppid = new Map<number, string>(
    games.docs.map((g) => [g.appid as number, String(g.id)]),
  )
  console.log(`Found ${gameIdByAppid.size}/${Object.keys(GAMES_BY_APPID).length} games in DB.`)

  // Wipe previous seed data (idempotent reseeding).
  const existing = await payload.find({ collection: 'tournaments', limit: 1000 })
  for (const t of existing.docs) {
    const parts = await payload.find({
      collection: 'tournament-participants',
      where: { tournament: { equals: t.id } },
      limit: 1000,
    })
    for (const p of parts.docs) {
      await payload.delete({ collection: 'tournament-participants', id: p.id })
    }
    await payload.delete({ collection: 'tournaments', id: t.id })
  }
  console.log(`Cleared ${existing.docs.length} existing tournaments.`)

  // Pull real users so we can mix them into participants.
  const realUsers = await payload.find({
    collection: 'users',
    limit: 50,
    select: { name: true, email: true },
  })
  console.log(`Found ${realUsers.docs.length} real users — will mix into participant rosters.`)

  const now = new Date()
  let created = 0
  let participantsCreated = 0

  for (const seed of TOURNAMENT_SEEDS) {
    const startsAt = new Date(now.getTime() + seed.startsInDays * 24 * 60 * 60 * 1000)
    const endsAt = new Date(startsAt.getTime() + seed.durationDays * 24 * 60 * 60 * 1000)
    const status = computeStatus(startsAt, endsAt, now)
    const format = seed.format

    const gameId = gameIdByAppid.get(seed.appid) ?? null

    const tournament = await payload.create({
      collection: 'tournaments',
      data: {
        name: seed.name,
        game: gameId ?? undefined,
        prizePool: seed.prizePool,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        format,
        maxParticipants: seed.maxParticipants,
        organizer: seed.organizer,
        location: seed.location,
        status,
        description: `${seed.name} is a ${format.replace('-', ' ')} tournament organized by ${seed.organizer}. ${seed.location === 'Online' ? 'Played online' : `Hosted in ${seed.location}`}, with a $${seed.prizePool.toLocaleString()} prize pool on the line.`,
      },
    })
    created++

    // Roster: fill to roughly 60-95% of max.
    const rosterSize = Math.max(
      4,
      Math.floor(seed.maxParticipants * (0.6 + Math.random() * 0.35)),
    )

    // Decide how many real users to include (up to 3 or as many as available).
    const realPicks = shuffle(realUsers.docs).slice(0, Math.min(3, realUsers.docs.length))
    const nickPool = shuffle(ESPORTS_NICKS).slice(0, rosterSize - realPicks.length)

    const placements = status === 'ended' ? shuffle(Array.from({ length: rosterSize }, (_, i) => i + 1)) : null

    let seedIdx = 1
    for (const userDoc of realPicks) {
      const displayName =
        (userDoc as { name?: string }).name?.trim() ||
        ((userDoc as { email?: string }).email ?? '').split('@')[0] ||
        `Player${seedIdx}`
      await payload.create({
        collection: 'tournament-participants',
        data: {
          tournament: tournament.id,
          user: userDoc.id,
          displayName,
          avatar: avatarUrl(String(userDoc.id)),
          team: Math.random() < 0.6 ? randomItem(ESPORTS_TEAMS) : undefined,
          seed: seedIdx,
          placement: placements ? placements[seedIdx - 1] : undefined,
          isMock: false,
        },
      })
      participantsCreated++
      seedIdx++
    }

    for (const nick of nickPool) {
      const team = Math.random() < 0.7 ? randomItem(ESPORTS_TEAMS) : undefined
      await payload.create({
        collection: 'tournament-participants',
        data: {
          tournament: tournament.id,
          displayName: nick,
          avatar: avatarUrl(nick),
          team,
          seed: seedIdx,
          placement: placements ? placements[seedIdx - 1] : undefined,
          isMock: true,
        },
      })
      participantsCreated++
      seedIdx++
    }

    console.log(`  ✓ ${tournament.name} [${status}] — ${seedIdx - 1} participants`)
  }

  console.log(`\nDone. Created ${created} tournaments and ${participantsCreated} participants.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
