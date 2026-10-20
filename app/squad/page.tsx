import { ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Squad from "@/components/Squad";
import SubpageShell from "@/components/SubpageShell";
import { hasFootballKey } from "@/lib/football/client";
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
      sub={
        hasFootballKey()
          ? "O'yinchi kartasini bosib mavsum statistikasini ko'ring"
          : "Joriy mavsum tarkibi"
      }
      backHref="/#squad"
    >
      <p style={{ marginBottom: 18 }}>
        <Link className="chip" href="/compare">
          <ArrowLeftRight size={14} aria-hidden="true" /> O&apos;yinchilarni taqqoslash
        </Link>
      </p>
      <Squad players={squad} bare statsEnabled={hasFootballKey()} />
    </SubpageShell>
  );
}
