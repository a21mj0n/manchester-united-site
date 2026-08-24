import type { Metadata } from "next";
import SubpageShell from "@/components/SubpageShell";
import Standings from "@/components/Standings";
import { getStandings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Turnir jadvali — Red Devils Uzbekistan",
  description: "Angliya Premer-ligasi turnir jadvali — Manchester United o'rni.",
};

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const data = await getStandings();

  return (
    <SubpageShell title="Turnir jadvali" backHref="/#table">
      <Standings
        rows={data.rows}
        season={data.season}
        isPreviousSeason={data.isPreviousSeason}
        bare
      />
    </SubpageShell>
  );
}
