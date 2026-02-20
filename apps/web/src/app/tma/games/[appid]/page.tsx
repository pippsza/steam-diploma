import { getGameByAppId } from '@/actions/games'
import { TMAGameDetail } from './tma-game-detail'
import { notFound } from 'next/navigation'

export default async function TMAGamePage({ params }: { params: Promise<{ appid: string }> }) {
  const { appid } = await params
  const game = await getGameByAppId(Number(appid))

  if (!game) {
    notFound()
  }

  return <TMAGameDetail game={game as any} />
}
