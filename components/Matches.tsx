"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import TeamBadge from "./TeamBadge";
import { MU } from "@/lib/data";
import type { Fixture, Result } from "@/lib/types";

function TeamName({ name, badge }: { name: string; badge?: string | null }) {
  return (
    <span className={`match__team${name === MU ? " mu" : ""}`}>
      <TeamBadge badge={badge} team={name} size={22} />
      {name}
    </span>
  );
}

/**
 * O'yin qatori. Tafsilot sahifasi faqat API-Football'dan kelgan
 * o'yinlarda bo'ladi — qolganlari oddiy qator bo'lib qolaveradi.
 */
function MatchRow({
  fixtureId,
  children,
}: {
  fixtureId?: number;
  children: React.ReactNode;
}) {
  if (!fixtureId) return <li className="match">{children}</li>;
  return (
    <li>
      <Link href={`/matches/${fixtureId}`} className="match match--link">
        {children}
      </Link>
    </li>
  );
}

function outcome(result: Result): { cls: string; label: string } {
  const isHome = result.home === MU;
  const gf = isHome ? result.homeScore : result.awayScore;
  const ga = isHome ? result.awayScore : result.homeScore;
  if (gf > ga) return { cls: "pill--w", label: "G'alaba" };
  if (gf === ga) return { cls: "pill--d", label: "Durang" };
  return { cls: "pill--l", label: "Mag'lubiyat" };
}

interface Props {
  fixtures: Fixture[];
  results: Result[];
}

export default function Matches({ fixtures, results }: Props) {
  const [tab, setTab] = useState<"fixtures" | "results">("fixtures");

  return (
    <section className="section section--alt" id="matches">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">O'yinlar</h2>
          <p className="section__sub">Natijalar va kelgusi uchrashuvlar jadvali</p>
        </div>

        <div className="tabs reveal" role="tablist">
          <button
            className={`tabs__btn${tab === "fixtures" ? " is-active" : ""}`}
            onClick={() => setTab("fixtures")}
            role="tab"
            aria-selected={tab === "fixtures"}
          >
            Kelgusi o'yinlar
          </button>
          <button
            className={`tabs__btn${tab === "results" ? " is-active" : ""}`}
            onClick={() => setTab("results")}
            role="tab"
            aria-selected={tab === "results"}
          >
            Natijalar
          </button>
        </div>

        {tab === "fixtures" ? (
          <div className="tab-panel is-active">
            <ul className="match-list">
              {fixtures.map((m) => (
                <MatchRow key={m.id} fixtureId={m.fixtureId}>
                  <div className="match__date">
                    <b>{m.date}</b>
                    {m.time}
                  </div>
                  <div className="match__teams">
                    <TeamName name={m.home} badge={m.homeBadge} />
                    <span className="match__score">—</span>
                    <TeamName name={m.away} badge={m.awayBadge} />
                  </div>
                  <div className="match__meta">
                    <span className="match__comp">{m.comp}</span>
                    <span className="pill pill--d">{m.venue}</span>
                    {m.fixtureId && <ChevronRight size={16} className="match__arrow" />}
                  </div>
                </MatchRow>
              ))}
            </ul>
          </div>
        ) : (
          <div className="tab-panel is-active">
            <ul className="match-list">
              {results.map((m) => {
                const o = outcome(m);
                return (
                  <MatchRow key={m.id} fixtureId={m.fixtureId}>
                    <div className="match__date">
                      <b>{m.date}</b>
                      {m.comp}
                    </div>
                    <div className="match__teams">
                      <TeamName name={m.home} badge={m.homeBadge} />
                      <span className="match__score">
                        {m.homeScore} : {m.awayScore}
                      </span>
                      <TeamName name={m.away} badge={m.awayBadge} />
                    </div>
                    <div className="match__meta">
                      <span className={`pill ${o.cls}`}>{o.label}</span>
                      {m.fixtureId && <ChevronRight size={16} className="match__arrow" />}
                    </div>
                  </MatchRow>
                );
              })}
            </ul>
          </div>
        )}

        <p className="section-more reveal">
          <Link href="/matches">Barcha o'yinlar, filtrlar va tafsilotlar →</Link>
        </p>
      </div>
    </section>
  );
}
