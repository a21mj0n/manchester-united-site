import { ChevronRight } from "lucide-react";
import Link from "next/link";

import TeamBadge from "./TeamBadge";
import { MU } from "@/lib/data";
import type { LastMatchInfo } from "@/lib/queries";

const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function outcome(m: LastMatchInfo): { cls: string; label: string } {
  const isHome = m.home === MU;
  const gf = isHome ? m.homeScore : m.awayScore;
  const ga = isHome ? m.awayScore : m.homeScore;
  if (gf > ga) return { cls: "pill--w", label: "G'alaba" };
  if (gf === ga) return { cls: "pill--d", label: "Durang" };
  return { cls: "pill--l", label: "Mag'lubiyat" };
}

/** Bosh sahifadagi «oxirgi o'yin» kartasi. */
export default function LastMatch({ match }: { match: LastMatchInfo }) {
  const local = new Date(new Date(match.utcDate).getTime() + TASHKENT_OFFSET_MS);
  const date = `${local.getUTCDate()}-${MONTHS[local.getUTCMonth()]}`;
  const o = outcome(match);

  const body = (
    <>
      <div className="last__label">Oxirgi o&apos;yin · {match.competition}</div>
      <div className="last__teams">
        <span className={`last__team${match.home === MU ? " mu" : ""}`}>
          <TeamBadge badge={match.homeBadge} team={match.home} size={34} />
          {match.home}
        </span>
        <b className="last__score">
          {match.homeScore} : {match.awayScore}
        </b>
        <span className={`last__team${match.away === MU ? " mu" : ""}`}>
          <TeamBadge badge={match.awayBadge} team={match.away} size={34} />
          {match.away}
        </span>
      </div>
      <div className="last__foot">
        <span className={`pill ${o.cls}`}>{o.label}</span>
        <span className="last__date">{date}</span>
        {match.fixtureId && (
          <span className="last__more">
            Tafsilotlar
            <ChevronRight size={14} aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <section className="last" id="last">
      <div className="container">
        {match.fixtureId ? (
          <Link href={`/matches/${match.fixtureId}`} className="last__card reveal last__card--link">
            {body}
          </Link>
        ) : (
          <div className="last__card reveal">{body}</div>
        )}
      </div>
    </section>
  );
}
