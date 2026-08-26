import { ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
      <p style={{ marginBottom: 18 }}>
        <Link className="chip" href="/compare">
          <ArrowLeftRight size={14} aria-hidden="true" /> O&apos;yinchilarni taqqoslash
        </Link>
      </p>
      <Squad players={squad} bare />
    </SubpageShell>
  );
}
