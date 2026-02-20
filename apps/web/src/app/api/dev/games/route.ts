import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// Dev-only endpoint for debugging games collection
// GET /api/dev/games?q=Terraria — search by name
// GET /api/dev/games?appid=105600 — search by appid
// GET /api/dev/games?count=true — total count
// GET /api/dev/games?top=10 — top N by recommendations

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const payload = await getPayload({ config })

  // Count total games
  if (sp.get('count') === 'true') {
    const total = await payload.count({ collection: 'games' })
    const fetched = await payload.count({
      collection: 'games',
      where: { detailsFetched: { equals: true } },
    })
    return NextResponse.json({ total, detailsFetched: fetched })
  }

  // Search by appid
  const appid = sp.get('appid')
  if (appid) {
    // Fetch with different locales to see what's stored
    const [allLocale, enLocale, ukLocale] = await Promise.all([
      payload.find({ collection: 'games', where: { appid: { equals: Number(appid) } }, locale: 'all', limit: 1 }),
      payload.find({ collection: 'games', where: { appid: { equals: Number(appid) } }, locale: 'en', limit: 1 }),
      payload.find({ collection: 'games', where: { appid: { equals: Number(appid) } }, locale: 'uk', limit: 1 }),
    ])
    const doc = allLocale.docs[0]
    return NextResponse.json({
      found: !!doc,
      name_all: doc?.name,
      name_en: enLocale.docs[0]?.name,
      name_uk: ukLocale.docs[0]?.name,
      appid: doc?.appid,
      id: doc?.id,
      detailsFetched: doc?.detailsFetched,
    })
  }

  // Search by name
  const q = sp.get('q')
  if (q) {
    const [enResult, ukResult] = await Promise.all([
      payload.find({
        collection: 'games',
        where: { name: { contains: q } },
        locale: 'en',
        limit: 10,
        sort: '-recommendations.total',
      }),
      payload.find({
        collection: 'games',
        where: { name: { contains: q } },
        locale: 'uk',
        limit: 10,
        sort: '-recommendations.total',
      }),
    ])

    return NextResponse.json({
      query: q,
      en: { total: enResult.totalDocs, games: enResult.docs.map((g) => ({ appid: g.appid, name: g.name })) },
      uk: { total: ukResult.totalDocs, games: ukResult.docs.map((g) => ({ appid: g.appid, name: g.name })) },
    })
  }

  // Migrate broken localized name fields
  // GET /api/dev/games?migrate=true (dry run)
  // GET /api/dev/games?migrate=true&apply=true (apply)
  if (sp.get('migrate') === 'true') {
    const db = payload.db
    // Access raw MongoDB collection
    const collection = (db as any).collections['games']?.collection
      ?? (db as any).connection?.collection('games')
    if (!collection) {
      return NextResponse.json({ error: 'Cannot access raw MongoDB collection' }, { status: 500 })
    }

    // Find docs where name is a string (not an object with locale keys)
    const broken = await collection.find({ name: { $type: 'string' } }).toArray()
    const apply = sp.get('apply') === 'true'

    if (apply && broken.length > 0) {
      let fixed = 0
      for (const doc of broken) {
        const nameStr = doc.name as string
        await collection.updateOne(
          { _id: doc._id },
          { $set: { name: { en: nameStr, uk: nameStr } } },
        )
        // Also fix shortDescription and aboutTheGame if they're strings
        const updates: Record<string, unknown> = {}
        if (typeof doc.shortDescription === 'string') {
          updates.shortDescription = { en: doc.shortDescription, uk: doc.shortDescription }
        }
        if (typeof doc.aboutTheGame === 'string') {
          updates.aboutTheGame = { en: doc.aboutTheGame, uk: doc.aboutTheGame }
        }
        if (Object.keys(updates).length > 0) {
          await collection.updateOne({ _id: doc._id }, { $set: updates })
        }
        fixed++
      }
      return NextResponse.json({ broken: broken.length, fixed, status: 'applied' })
    }

    return NextResponse.json({
      broken: broken.length,
      sample: broken.slice(0, 5).map((d: any) => ({ appid: d.appid, name: d.name })),
      status: 'dry_run',
      hint: 'Add &apply=true to fix',
    })
  }

  // List all genres
  if (sp.get('genres') === 'true') {
    const db = payload.db
    const collection = (db as any).collections['games']?.collection
      ?? (db as any).connection?.collection('games')
    if (collection) {
      const genres = await collection.distinct('genres.description')
      return NextResponse.json({ genres: genres.sort(), count: genres.length })
    }
  }

  // Top N games
  const top = Number(sp.get('top') || '10')
  const result = await payload.find({
    collection: 'games',
    where: { detailsFetched: { equals: true } },
    locale: 'en',
    limit: top,
    sort: '-recommendations.total',
  })

  return NextResponse.json({
    total: result.totalDocs,
    games: result.docs.map((g) => ({
      appid: g.appid,
      name: g.name,
      recommendations: g.recommendations?.total,
    })),
  })
}
