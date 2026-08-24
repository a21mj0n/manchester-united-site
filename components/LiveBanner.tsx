"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import TeamBadge from "./TeamBadge";
import type { MatchItem } from "@/types/football";

/** Klient necha soniyada bir /api/live ni so'raydi */
const POLL_MS = 90_000;

/**
 * Jonli o'yin banneri. Server /api/live orqali javob beradi —
 * u tashqi API ga faqat o'yin oynasida, keshlangan holda murojaat
 * qiladi (lib/live.ts). O'yin bo'lmasa hech narsa chizilmaydi.
 */
export default function LiveBanner() {
  const [match, setMatch] = useState<MatchItem | null>(null);

  useEffect(() => {
    let stopped = false;

    const load = async () => {
      try {
        const res = await fetch("/api/live");
        if (!res.ok) return;
        const data = (await res.json()) as { match: MatchItem | null };
        if (!stopped) setMatch(data.match);
      } catch {
        // Jim o'tamiz — banner shunchaki ko'rinmaydi
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  if (!match) return null;

  const inner = (
    <div className="container live-banner__inner">
      <span className="live-banner__dot" aria-hidden="true" />
      <span className="live-banner__label">Jonli</span>
      <span className="live-banner__teams">
        <TeamBadge badge={match.homeLogo} team={match.home} size={20} />
        {match.home}
        <b>
          {match.homeScore ?? 0} : {match.awayScore ?? 0}
        </b>
        {match.away}
        <TeamBadge badge={match.awayLogo} team={match.away} size={20} />
      </span>
      <span className="live-banner__minute">{match.statusLabel}</span>
    </div>
  );

  return match.hasDetails ? (
    <Link href={`/matches/${match.id}`} className="live-banner">
      {inner}
    </Link>
  ) : (
    <div className="live-banner">{inner}</div>
  );
}
