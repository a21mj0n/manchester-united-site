import { ArrowLeftRight, CalendarDays, Flag, Ruler, Weight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import SubpageShell from "@/components/SubpageShell";
import { competitionLabel, currentApiSeason } from "@/config/football";
import { hasFootballKey } from "@/lib/football/client";
import { fetchLatestPlayerProfile } from "@/lib/football/players";
import type { PlayerCompetitionStats } from "@/types/football";

export const metadata: Metadata = {
  title: "Futbolchi statistikasi — Red Devils Uzbekistan",
};

export const dynamic = "force-dynamic";

const POSITION_UZ: Record<string, string> = {
  Goalkeeper: "Darvozabon",
  Defender: "Himoyachi",
  Midfielder: "Yarim himoyachi",
  Attacker: "Hujumchi",
};

/**
 * Manba bo'y va vaznni goh "183 cm", goh shunchaki "183" ko'rinishida
 * beradi — o'lchov birligi yo'q bo'lsa o'zimiz qo'shamiz.
 */
function withUnit(value: string, unit: string): string {
  return /[a-z]/i.test(value) ? value : `${value} ${unit}`;
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pstat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function CompetitionBlock({ s, isGK }: { s: PlayerCompetitionStats; isGK: boolean }) {
  return (
    <section className="detail-block">
      <h2>{competitionLabel(s.competition)}</h2>
      <div className="pstat-grid">
        <StatCell label="O'yinlar" value={s.appearances} />
        <StatCell label="Asosiy tarkibda" value={s.lineups} />
        <StatCell label="Daqiqalar" value={s.minutes} />
        {s.rating && <StatCell label="Reyting" value={s.rating} />}
        <StatCell label="Gollar" value={s.goals} />
        <StatCell label="Golli uzatmalar" value={s.assists} />
        {isGK ? (
          <>
            <StatCell label="Seyvlar" value={s.saves} />
            <StatCell label="O'tkazilgan gollar" value={s.conceded} />
          </>
        ) : (
          <>
            <StatCell label="Zarbalar (aniq)" value={`${s.shots} (${s.shotsOn})`} />
            <StatCell label="Driblinglar" value={s.dribblesWon} />
          </>
        )}
        <StatCell label="Uzatmalar" value={s.passes} />
        <StatCell label="Kalit uzatmalar" value={s.keyPasses} />
        {s.passAccuracy !== null && (
          <StatCell label="Uzatma aniqligi" value={`${s.passAccuracy}%`} />
        )}
        <StatCell label="To'p olib qo'yish" value={s.tackles} />
        <StatCell label="Uzilishlar" value={s.interceptions} />
        <StatCell label="Yakkama-yakka (yutuq)" value={s.duelsWon} />
        <StatCell label="Sariq kartochka" value={s.yellow} />
        <StatCell label="Qizil kartochka" value={s.red} />
      </div>
    </section>
  );
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playerId = Number(id);
  const profile =
    Number.isInteger(playerId) && playerId > 0
      ? await fetchLatestPlayerProfile(playerId)
      : null;

  if (!profile) {
    return (
      <SubpageShell title="Futbolchi statistikasi" backHref="/squad">
        <div className="empty-state">
          <p>
            {hasFootballKey()
              ? "Futbolchi ma'lumotini yuklab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
              : "Statistika manbasi hozircha ulanmagan."}
          </p>
          <div className="empty-state__actions">
            <Link className="chip" href="/squad">
              Tarkibga qaytish
            </Link>
          </div>
        </div>
      </SubpageShell>
    );
  }

  const isGK = profile.position === "Goalkeeper";
  // Joriy mavsum manbada yopiq bo'lsa eskiroq mavsum ko'rsatiladi
  const isOlderSeason = profile.season !== currentApiSeason();

  return (
    <SubpageShell
      title={profile.name}
      sub={`${profile.season}/${String(profile.season + 1).slice(2)} mavsumi statistikasi`}
      backHref="/squad"
    >
      <div className="player-hero">
        {profile.photo ? (
          <img src={profile.photo} alt="" width={96} height={96} className="player-hero__photo" />
        ) : (
          <div className="player__shirt">{profile.number ?? "—"}</div>
        )}
        <div className="player-hero__info">
          <p className="player-hero__pos">
            {profile.number !== null && <b>#{profile.number}</b>}
            {profile.position && (POSITION_UZ[profile.position] ?? profile.position)}
          </p>
          <div className="player-hero__meta">
            {profile.nationality && (
              <span>
                <Flag size={14} aria-hidden="true" /> {profile.nationality}
              </span>
            )}
            {profile.age !== null && (
              <span>
                <CalendarDays size={14} aria-hidden="true" /> {profile.age} yosh
              </span>
            )}
            {profile.height && (
              <span>
                <Ruler size={14} aria-hidden="true" /> {withUnit(profile.height, "sm")}
              </span>
            )}
            {profile.weight && (
              <span>
                <Weight size={14} aria-hidden="true" /> {withUnit(profile.weight, "kg")}
              </span>
            )}
          </div>
          <p style={{ marginTop: 12 }}>
            <Link className="chip" href={`/compare?p1=${profile.id}`}>
              <ArrowLeftRight size={14} aria-hidden="true" /> Boshqa futbolchi bilan taqqoslash
            </Link>
          </p>
        </div>
      </div>

      {isOlderSeason && (
        <p className="note">
          Joriy mavsum statistikasi manbada hali ochiq emas — oxirgi mavjud
          mavsum ko&apos;rsatilmoqda.
        </p>
      )}

      {profile.competitions.length === 0 ? (
        <p className="note">Bu mavsumda o&apos;ynalgan o&apos;yinlar bo&apos;yicha ma&apos;lumot hali yo&apos;q.</p>
      ) : (
        profile.competitions.map((s) => (
          <CompetitionBlock key={s.competition} s={s} isGK={isGK} />
        ))
      )}
    </SubpageShell>
  );
}
