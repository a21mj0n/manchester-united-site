"use client";

import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";

import LineupPitch from "./LineupPitch";
import TeamBadge from "./TeamBadge";
import type { LineupTeam } from "@/types/football";

/** Tarkiblar: ro'yxat yoki maydon sxemasi ko'rinishida. */

function LineupCol({ l }: { l: LineupTeam }) {
  return (
    <div className="lineup">
      <div className="lineup__head">
        <TeamBadge badge={l.logo} team={l.team} size={26} />
        <div>
          <b>{l.team}</b>
          <small>
            {l.formation && `Sxema: ${l.formation}`}
            {l.coach && ` · Murabbiy: ${l.coach}`}
          </small>
        </div>
      </div>
      <ol className="lineup__list">
        {l.startXI.map((p) => (
          <li key={p.id ?? p.name}>
            <i>{p.number || "—"}</i> {p.name}
          </li>
        ))}
      </ol>
      {l.substitutes.length > 0 && (
        <>
          <p className="lineup__subhead">Zaxira</p>
          <ol className="lineup__list lineup__list--subs">
            {l.substitutes.map((p) => (
              <li key={p.id ?? p.name}>
                <i>{p.number || "—"}</i> {p.name}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export default function Lineups({ teams }: { teams: LineupTeam[] }) {
  const [view, setView] = useState<"pitch" | "list">("pitch");

  return (
    <section className="detail-block">
      <div className="detail-block__head">
        <h2>Tarkiblar</h2>
        <div className="view-switch" role="tablist" aria-label="Tarkib ko'rinishi">
          <button
            className={`chip${view === "pitch" ? " is-active" : ""}`}
            onClick={() => setView("pitch")}
            role="tab"
            aria-selected={view === "pitch"}
          >
            <LayoutGrid size={14} aria-hidden="true" />
            Sxema
          </button>
          <button
            className={`chip${view === "list" ? " is-active" : ""}`}
            onClick={() => setView("list")}
            role="tab"
            aria-selected={view === "list"}
          >
            <List size={14} aria-hidden="true" />
            Ro&apos;yxat
          </button>
        </div>
      </div>

      {view === "pitch" ? (
        <LineupPitch teams={teams} />
      ) : (
        <div className="lineups-grid">
          <LineupCol l={teams[0]} />
          <LineupCol l={teams[1]} />
        </div>
      )}
    </section>
  );
}
