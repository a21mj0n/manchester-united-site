"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import TeamBadge from "./TeamBadge";
import { MU } from "@/lib/data";
import type { MatchSource } from "@/lib/matches";
import type { MatchItem, MatchPhase } from "@/types/football";

const PAGE_SIZE = 10;

const PHASES: { key: MatchPhase | "all"; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "upcoming", label: "Kelgusi" },
  { key: "live", label: "Jonli" },
  { key: "finished", label: "Tugagan" },
];

function scoreOf(m: MatchItem): string {
  if (m.homeScore === null || m.awayScore === null) return "—";
  return `${m.homeScore} : ${m.awayScore}`;
}

function outcomePill(m: MatchItem): { cls: string; label: string } | null {
  if (m.phase === "live") return { cls: "pill--live", label: m.statusLabel };
  if (m.phase !== "finished" || m.homeScore === null || m.awayScore === null) return null;
  const isHome = m.home === MU;
  const gf = isHome ? m.homeScore : m.awayScore;
  const ga = isHome ? m.awayScore : m.homeScore;
  if (gf > ga) return { cls: "pill--w", label: "G'alaba" };
  if (gf === ga) return { cls: "pill--d", label: "Durang" };
  return { cls: "pill--l", label: "Mag'lubiyat" };
}

interface Props {
  matches: MatchItem[];
  season: number;
  seasons: number[];
  source: MatchSource;
}

export default function MatchesBrowser({ matches, season, seasons, source }: Props) {
  const router = useRouter();
  const [comp, setComp] = useState("all");
  const [phase, setPhase] = useState<MatchPhase | "all">("all");
  const [shown, setShown] = useState(PAGE_SIZE);

  const competitions = useMemo(
    () => Array.from(new Set(matches.map((m) => m.competition))),
    [matches],
  );

  const filtered = useMemo(
    () =>
      matches.filter(
        (m) =>
          (comp === "all" || m.competition === comp) &&
          (phase === "all" || m.phase === phase),
      ),
    [matches, comp, phase],
  );

  const visible = filtered.slice(0, shown);

  const reset = () => setShown(PAGE_SIZE);

  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <p>
          {season === seasons[0]
            ? "O'yinlar ro'yxatini yuklab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
            : "Bu mavsum uchun ma'lumot manbada ochiq emas."}
        </p>
        <div className="empty-state__actions">
          <button className="chip" onClick={() => router.refresh()}>
            Qayta urinish
          </button>
          {season !== seasons[0] && (
            <Link className="chip" href="/matches">
              Joriy mavsumga qaytish
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="filters-bar">
        <div className="filters">
          <span className="filters__label">Mavsum:</span>
          {seasons.map((s) => (
            <Link
              key={s}
              href={s === seasons[0] ? "/matches" : `/matches?season=${s}`}
              className={`chip${s === season ? " is-active" : ""}`}
            >
              {s}/{String(s + 1).slice(2)}
            </Link>
          ))}
        </div>

        <div className="filters">
          <span className="filters__label">Holat:</span>
          {PHASES.map((f) => (
            <button
              key={f.key}
              className={`chip${phase === f.key ? " is-active" : ""}`}
              onClick={() => {
                setPhase(f.key);
                reset();
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {competitions.length > 1 && (
          <div className="filters">
            <span className="filters__label">Musobaqa:</span>
            <button
              className={`chip${comp === "all" ? " is-active" : ""}`}
              onClick={() => {
                setComp("all");
                reset();
              }}
            >
              Barchasi
            </button>
            {competitions.map((c) => (
              <button
                key={c}
                className={`chip${comp === c ? " is-active" : ""}`}
                onClick={() => {
                  setComp(c);
                  reset();
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {source === "db" && (
        <p className="note">
          Tafsilotli statistika manbasi hozircha ulanmagan — ro'yxat kunlik
          sinxronizatsiyadan ko'rsatilmoqda.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="admin__empty">Tanlangan filtrga mos o'yin topilmadi.</p>
      ) : (
        <ul className="match-list matches-page__list">
          {visible.map((m) => {
            const pill = outcomePill(m);
            const row = (
              <>
                <div className="match__date">
                  <b>{m.date}</b>
                  {m.phase === "upcoming" ? m.time : m.statusLabel}
                </div>
                <div className="match__teams">
                  <span className={`match__team${m.home === MU ? " mu" : ""}`}>
                    <TeamBadge badge={m.homeLogo} team={m.home} size={22} />
                    {m.home}
                  </span>
                  <span className="match__score">{scoreOf(m)}</span>
                  <span className={`match__team${m.away === MU ? " mu" : ""}`}>
                    <TeamBadge badge={m.awayLogo} team={m.away} size={22} />
                    {m.away}
                  </span>
                </div>
                <div className="match__meta">
                  <span className="match__comp">{m.competition}</span>
                  {pill && <span className={`pill ${pill.cls}`}>{pill.label}</span>}
                  {m.hasDetails && <ChevronRight size={16} className="match__arrow" />}
                </div>
              </>
            );

            return m.hasDetails ? (
              <li key={m.id}>
                <Link href={`/matches/${m.id}`} className="match match--link">
                  {row}
                </Link>
              </li>
            ) : (
              <li className="match" key={m.id}>
                {row}
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > shown && (
        <div className="matches-page__more">
          <button className="btn btn--ghost" onClick={() => setShown((v) => v + PAGE_SIZE)}>
            Yana ko'rsatish ({filtered.length - shown} ta qoldi)
          </button>
        </div>
      )}
    </>
  );
}
