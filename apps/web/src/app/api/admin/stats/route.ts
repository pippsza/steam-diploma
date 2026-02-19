import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totalUsers, recentUsers7d, recentUsers30d, totalGames, totalPurchases, totalFavorites, totalWishlist, totalChatSessions] =
    await Promise.all([
      payload.count({ collection: 'users' }),
      payload.count({ collection: 'users', where: { createdAt: { greater_than: sevenDaysAgo.toISOString() } } }),
      payload.count({ collection: 'users', where: { createdAt: { greater_than: thirtyDaysAgo.toISOString() } } }),
      payload.count({ collection: 'games' }),
      payload.count({ collection: 'purchases' }),
      payload.count({ collection: 'favorites' }),
      payload.count({ collection: 'wishlist' }),
      payload.count({ collection: 'chat-sessions' }),
    ])

  // Most popular games (by purchases)
  const popularGames = await payload.find({
    collection: 'games',
    where: { detailsFetched: { equals: true } },
    sort: '-recommendations.total',
    limit: 5,
    select: { name: true, appid: true, recommendations: true },
  })

  return Response.json({
    users: {
      total: totalUsers.totalDocs,
      last7Days: recentUsers7d.totalDocs,
      last30Days: recentUsers30d.totalDocs,
    },
    games: { total: totalGames.totalDocs },
    purchases: { total: totalPurchases.totalDocs },
    favorites: { total: totalFavorites.totalDocs },
    wishlist: { total: totalWishlist.totalDocs },
    chatSessions: { total: totalChatSessions.totalDocs },
    popularGames: popularGames.docs.map((g) => ({
      name: g.name,
      appid: g.appid,
      recommendations: g.recommendations?.total ?? 0,
    })),
  })
}
