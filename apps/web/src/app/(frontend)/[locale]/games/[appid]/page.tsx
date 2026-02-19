import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGameByAppId } from '@/actions/games'
import { GameDetail } from '@/components/games/game-detail'
import { getSteamHeaderImage } from '@/lib/steam'

interface Props {
  params: Promise<{ appid: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { appid: appidStr } = await params
  const appid = parseInt(appidStr, 10)
  if (isNaN(appid)) return {}

  const game = await getGameByAppId(appid)
  if (!game) return {}

  return {
    title: game.name,
    description: game.shortDescription || `${game.name} on Steam Diploma`,
    openGraph: {
      title: game.name,
      description: game.shortDescription || undefined,
      images: [game.headerImage || getSteamHeaderImage(appid)],
    },
  }
}

export default async function GamePage({ params }: Props) {
  const { appid: appidStr } = await params
  const appid = parseInt(appidStr, 10)

  if (isNaN(appid)) notFound()

  const game = await getGameByAppId(appid)

  if (!game) notFound()

  return (
    <div className="container max-w-4xl py-8">
      <GameDetail
        appid={game.appid}
        name={game.name}
        headerImage={game.headerImage}
        shortDescription={game.shortDescription}
        isFree={game.isFree}
        price={game.price}
        genres={game.genres}
        developers={game.developers}
        publishers={game.publishers}
        platforms={game.platforms}
        releaseDate={game.releaseDate}
        metacritic={game.metacritic}
        screenshots={game.screenshots}
        recommendations={game.recommendations}
      />
    </div>
  )
}
