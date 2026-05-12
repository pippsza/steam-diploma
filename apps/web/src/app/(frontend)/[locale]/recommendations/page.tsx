import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { GameGrid } from "@/components/games/game-grid";
import { PageTransition } from "@/components/layout/page-transition";
import { getOwnedGameIds } from "@/actions/purchases";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RecommendationsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("recommendations");
  const payload = await getPayload({ config });

  const popular = await payload.find({
    collection: "games",
    where: { detailsFetched: { equals: true } },
    sort: "-recommendations.total",
    locale: locale as "en" | "uk",
    limit: 8,
  });

  const topRated = await payload.find({
    collection: "games",
    where: {
      detailsFetched: { equals: true },
      "metacritic.score": { greater_than: 0 },
    },
    sort: "-metacritic.score",
    locale: locale as "en" | "uk",
    limit: 8,
  });

  const ownedIds = await getOwnedGameIds();

  return (
    <PageTransition className="container space-y-12 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("popular")}</h2>
        <GameGrid games={popular.docs as any} ownedIds={ownedIds} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("topRated")}</h2>
        <GameGrid games={topRated.docs as any} ownedIds={ownedIds} />
      </section>
    </PageTransition>
  );
}
