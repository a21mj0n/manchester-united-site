import type { Metadata } from "next";
import MatchesBrowser from "@/components/MatchesBrowser";
import SubpageShell from "@/components/SubpageShell";
import { currentApiSeason, selectableSeasons } from "@/config/football";
import { getSeasonMatches } from "@/lib/matches";

export const metadata: Metadata = {
  title: "O'yinlar — Red Devils Uzbekistan",
  description:
    "Manchester United o'yinlari: natijalar, kelgusi uchrashuvlar, musobaqa va mavsum bo'yicha filtrlar.",
};

// Bazadan o'qiladi — build paytida emas, so'rov kelganda chizamiz.
// API javoblari baribir keshlanadi (lib/football/client.ts).
export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;
  const seasons = selectableSeasons();
  const requested = Number(seasonParam);
  const season = seasons.includes(requested) ? requested : currentApiSeason();

  const data = await getSeasonMatches(season);

  return (
    <SubpageShell
      title="O'yinlar"
      sub="Manchester United'ning barcha uchrashuvlari — musobaqa, holat va mavsum bo'yicha saralang"
      backHref="/#matches"
    >
      <MatchesBrowser
        matches={data.matches}
        season={data.season}
        seasons={seasons}
        source={data.source}
      />
    </SubpageShell>
  );
}
