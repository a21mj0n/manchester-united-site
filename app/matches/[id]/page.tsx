import {
  ArrowLeftRight,
  CalendarDays,
  Goal,
  MapPin,
  MonitorPlay,
  Square,
  Trophy,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import Lineups from "@/components/Lineups";
import SubpageShell from "@/components/SubpageShell";
import TeamBadge from "@/components/TeamBadge";
import { fetchMatchDetails } from "@/lib/football/fixtures";
import { hasFootballKey } from "@/lib/football/client";
import type { MatchEvent } from "@/types/football";

export const metadata: Metadata = {
  title: "O'yin tafsilotlari — Red Devils Uzbekistan",
};

export const dynamic = "force-dynamic";

/* ---------- Voqealar ---------- */

function EventIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "goal":
    case "penalty":
      return <Goal size={16} className="ev--goal" aria-hidden="true" />;
    case "own-goal":
    case "missed-penalty":
      return <Goal size={16} className="ev--miss" aria-hidden="true" />;
    case "yellow":
      return <Square size={14} className="ev--yellow" aria-hidden="true" />;
    case "red":
      return <Square size={14} className="ev--red" aria-hidden="true" />;
    case "sub":
      return <ArrowLeftRight size={15} className="ev--sub" aria-hidden="true" />;
    case "var":
      return <MonitorPlay size={15} className="ev--var" aria-hidden="true" />;
    default:
      return <Square size={14} aria-hidden="true" />;
  }
}

function EventRow({ e }: { e: MatchEvent }) {
  return (
    <li className={`event${e.isUnited ? " event--mu" : ""}`}>
      <span className="event__minute">
        {e.minute}
        {e.extra ? `+${e.extra}` : ""}&#8242;
      </span>
      <EventIcon kind={e.kind} />
      <span className="event__body">
        <b>{e.player}</b>
        {e.kind === "sub" && e.assist && <> &#8596; {e.assist}</>}
        {e.kind !== "sub" && e.assist && (
          <small> (uzatma: {e.assist})</small>
        )}
        <small className="event__label"> — {e.label}</small>
      </span>
      <span className="event__team">{e.team}</span>
    </li>
  );
}

/* ---------- Sahifa ---------- */

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixtureId = Number(id);
  const details =
    Number.isInteger(fixtureId) && fixtureId > 0
      ? await fetchMatchDetails(fixtureId)
      : null;

  if (!details) {
    return (
      <SubpageShell title="O'yin tafsilotlari" backHref="/matches">
        <div className="empty-state">
          <p>
            {hasFootballKey()
              ? "O'yin ma'lumotini yuklab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
              : "Tafsilotli statistika manbasi hozircha ulanmagan."}
          </p>
          <div className="empty-state__actions">
            <Link className="chip" href="/matches">
              O'yinlar ro'yxatiga qaytish
            </Link>
          </div>
        </div>
      </SubpageShell>
    );
  }

  const { match, score, events, lineups, stats } = details;
  const goals = events.filter((e) => ["goal", "own-goal", "penalty"].includes(e.kind));
  const cards = events.filter((e) => ["yellow", "red"].includes(e.kind));
  const subs = events.filter((e) => e.kind === "sub");
  const vars = events.filter((e) => e.kind === "var");

  const scoreRows = [
    { label: "Birinchi bo'lim", value: score.halftime },
    { label: "Asosiy vaqt", value: score.fulltime },
    { label: "Qo'shimcha vaqt", value: score.extratime },
    { label: "Penaltilar", value: score.penalty },
  ].filter((r) => r.value);

  return (
    <SubpageShell title="O'yin tafsilotlari" backHref="/matches">
      {/* Sarlavha kartasi */}
      <div className="match-hero">
        <div className="match-hero__comp">
          <Trophy size={15} aria-hidden="true" />
          {match.competition}
          {match.round && ` · ${match.round}`}
        </div>
        <div className="match-hero__teams">
          <div className="team">
            <TeamBadge badge={match.homeLogo} team={match.home} size={64} />
            <span>{match.home}</span>
          </div>
          <div className="match-hero__score">
            {match.homeScore !== null ? (
              <b>
                {match.homeScore} : {match.awayScore}
              </b>
            ) : (
              <b>VS</b>
            )}
            <span
              className={`pill ${match.phase === "live" ? "pill--live" : "pill--d"}`}
            >
              {match.statusLabel}
            </span>
          </div>
          <div className="team">
            <TeamBadge badge={match.awayLogo} team={match.away} size={64} />
            <span>{match.away}</span>
          </div>
        </div>

        <div className="match-hero__meta">
          <span>
            <CalendarDays size={14} aria-hidden="true" />
            {match.date} · {match.time} (Toshkent)
          </span>
          {match.venue && (
            <span>
              <MapPin size={14} aria-hidden="true" />
              {match.venue}
              {details.venueCity && `, ${details.venueCity}`}
            </span>
          )}
          {details.referee && (
            <span>
              <UserRound size={14} aria-hidden="true" />
              Hakam: {details.referee}
            </span>
          )}
        </div>

        {scoreRows.length > 1 && (
          <div className="match-hero__periods">
            {scoreRows.map((r) => (
              <span key={r.label}>
                {r.label}: <b>{r.value}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Voqealar */}
      {events.length > 0 && (
        <section className="detail-block">
          <h2>Voqealar</h2>
          <ul className="event-list">
            {[...goals, ...cards, ...subs, ...vars]
              .sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0))
              .map((e, i) => (
                <EventRow key={i} e={e} />
              ))}
          </ul>
        </section>
      )}

      {/* Statistika */}
      {stats.length > 0 && (
        <section className="detail-block">
          <h2>Statistika</h2>
          <div className="stat-list">
            {stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat__nums">
                  <b>{s.home}</b>
                  <span>{s.label}</span>
                  <b>{s.away}</b>
                </div>
                <div className="stat__bar">
                  <i style={{ width: `${s.homeShare}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tarkiblar — sxema yoki ro'yxat ko'rinishida */}
      {lineups.length === 2 && <Lineups teams={lineups} />}

      {events.length === 0 && stats.length === 0 && lineups.length === 0 && (
        <p className="note">
          {match.phase === "upcoming"
            ? "O'yin hali boshlanmagan — tafsilotlar o'yin davomida paydo bo'ladi."
            : "Bu o'yin uchun batafsil ma'lumot manbada mavjud emas."}
        </p>
      )}
    </SubpageShell>
  );
}
