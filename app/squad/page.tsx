import type { Metadata } from "next";
import Squad from "@/components/Squad";
import SubpageShell from "@/components/SubpageShell";
import { getSquad } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Jamoa tarkibi — Red Devils Uzbekistan",
  description:
    "Manchester United jamoa tarkibi: darvozabonlar, himoyachilar, yarim himoyachilar va hujumchilar.",
};

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const squad = await getSquad();

  return (
    <SubpageShell
      title="Jamoa tarkibi"
      sub="O'yinchi kartasini bosib mavsum statistikasini ko'ring"
      backHref="/#squad"
    >
      <Squad players={squad} bare />
    </SubpageShell>
  );
}
