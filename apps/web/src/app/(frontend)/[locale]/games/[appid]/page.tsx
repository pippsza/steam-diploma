import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameByAppId } from "@/actions/games";
import { isFavorite } from "@/actions/favorites";
import { isWishlisted } from "@/actions/wishlist";
import { isOwned } from "@/actions/purchases";
import { GameDetail } from "@/components/games/game-detail";
import { GameActions } from "@/components/games/game-actions";
import { PageTransition } from "@/components/layout/page-transition";
import { getSteamHeaderImage } from "@/lib/steam";

interface Props {
  params: Promise<{ appid: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { appid: appidStr, locale } = await params;
  const appid = parseInt(appidStr, 10);
  if (isNaN(appid)) return {};

  const game = await getGameByAppId(appid, locale);
  if (!game) return {};

  return {
    title: game.name,
    description: game.shortDescription || `${game.name} on Steam Games`,
    openGraph: {
      title: game.name,
      description: game.shortDescription || undefined,
      images: [game.headerImage || getSteamHeaderImage(appid)],
    },
  };
}

export default async function GamePage({ params }: Props) {
  const { appid: appidStr, locale } = await params;
  const appid = parseInt(appidStr, 10);

  if (isNaN(appid)) notFound();

  const game = await getGameByAppId(appid, locale);

  if (!game) notFound();

  const gameId = String(game.id)
  const [fav, wish, owned] = await Promise.all([
    isFavorite(gameId),
    isWishlisted(gameId),
    isOwned(gameId),
  ]);

  return (
    <PageTransition className="container max-w-4xl py-8">
      <GameDetail
        appid={game.appid}
        name={game.name}
        headerImage={game.headerImage}
        shortDescription={game.shortDescription}
        aboutTheGame={game.aboutTheGame}
        supportedLanguages={game.supportedLanguages}
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
        pcRequirements={game.pcRequirements}
        macRequirements={game.macRequirements}
        linuxRequirements={game.linuxRequirements}
        reviews={game.reviews}
        locale={locale}
      >
        <GameActions
          gameId={gameId}
          initialIsFavorite={fav}
          initialIsWishlisted={wish}
          initialIsOwned={owned}
          price={game.price?.final ?? 0}
        />
      </GameDetail>
    </PageTransition>
  );
}
