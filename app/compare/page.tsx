import { AlertTriangle, Hand, Scale, Shield, Sparkles, Star, Target } from "lucide-react";
import type { Metadata } from "next";

import CompareSelect from "@/components/compare/CompareSelect";
import RadarChart from "@/components/compare/RadarChart";
import StatBar from "@/components/compare/StatBar";
import SubpageShell from "@/components/SubpageShell";
import { currentApiSeason } from "@/config/football";
import {
  aggregateStats,
  computeStrengths,
  gkRadarAxes,
  hasEnoughMinutes,
  isGoalkeeper,
  outfieldRadarAxes,
  pct,
  per90,
  type AggregatedStats,
  type Strength,
  type StrengthCategory,
} from "@/lib/football/compare";
import { hasFootballKey } from "@/lib/football/client";
import { fetchLatestPlayerProfile } from "@/lib/football/players";
import { getSquad } from "@/lib/queries";
import type { PlayerProfile } from "@/types/football";

export const metadata: Metadata = {
  title: "O'yinchilarni taqqoslash — Red Devils Uzbekistan",
  description:
    "Manchester United futbolchilarini yonma-yon taqqoslang: statistika, radar diagramma va ustun jihatlar.",
};

export const dynamic = "force-dynamic";

const POSITION_UZ: Record<string, string> = {
  Goalkeeper: "Darvozabon",
  Defender: "Himoyachi",
  Midfielder: "Yarim himoyachi",
  Attacker: "Hujumchi",
};

const CATEGORY_ICON: Record<StrengthCategory, React.ReactNode> = {
  overall: <Star size={14} aria-hidden="true" />,
  attack: <Target size={14} aria-hidden="true" />,
  creativity: <Sparkles size={14} aria-hidden="true" />,
  defense: <Shield size={14} aria-hidden="true" />,
  discipline: <AlertTriangle size={14} aria-hidden="true" />,
  gk: <Hand size={14} aria-hidden="true" />,
};

function parseId(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function HeroSide({ profile, tone }: { profile: PlayerProfile; tone: "a" | "b" }) {
  return (
    <div className={`vs-hero__side vs-hero__side--${tone}`}>
      {profile.photo ? (
        <img src={profile.photo} alt="" width={110} height={110} className="vs-hero__photo" />
      ) : (
        <div className="player__shirt">{profile.number ?? "—"}</div>
      )}
      <h2 className="vs-hero__name">{profile.name}</h2>
      <p className="vs-hero__meta">
        {profile.number !== null && <b>#{profile.number}</b>}
        {profile.position && (POSITION_UZ[profile.position] ?? profile.position)}
        {profile.age !== null && ` · ${profile.age} yosh`}
      </p>
      {profile.nationality && <p className="vs-hero__nation">{profile.nationality}</p>}
    </div>
  );
}

function StrengthCard({
  name,
  tone,
  strengths,
}: {
  name: string;
  tone: "a" | "b";
  strengths: Strength[];
}) {
  return (
    <div className={`strength-card strength-card--${tone}`}>
      <h3>{name}</h3>
      {strengths.length === 0 ? (
        <p className="strength-card__empty">
          <Scale size={14} aria-hidden="true" /> Sezilarli ustunlik yo&apos;q — kuchlar teng
        </p>
      ) : (
        <ul>
          {strengths.map((s) => (
            <li key={s.label} className="strength-chip">
              {CATEGORY_ICON[s.category]}
              <span>{s.label}</span>
              <b>{s.detail}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Statistika bo'limi: sarlavha + qatorlar */
function BarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="detail-block">
      <h2>{title}</h2>
      <div className="statbar-list">{children}</div>
    </section>
  );
}

const f1 = (v: number) => v.toFixed(1);

function Comparison({ a, b }: { a: PlayerProfile; b: PlayerProfile }) {
  const sa = aggregateStats(a);
  const sb = aggregateStats(b);

  const gkA = isGoalkeeper(a);
  const gkB = isGoalkeeper(b);
  const bothGK = gkA && gkB;
  const mixed = gkA !== gkB;

  const axes = bothGK ? gkRadarAxes(sa, sb) : outfieldRadarAxes(sa, sb);
  const strengths = computeStrengths(sa, sb, bothGK);

  const lowMinutes = !hasEnoughMinutes(sa) || !hasEnoughMinutes(sb);

  const pctText = (part: number, whole: number) => {
    const v = pct(part, whole);
    return v === null ? "—" : `${Math.round(v)}%`;
  };
  const per90Text = (v: number, s: AggregatedStats) => f1(per90(v, s.minutes));

  return (
    <>
      {mixed && (
        <p className="note">
          <AlertTriangle size={14} aria-hidden="true" /> Darvozabon bilan maydon
          o&apos;yinchisini taqqoslash unchalik o&apos;rinli emas — pozitsiyasi yaqin
          futbolchilarni tanlash tavsiya etiladi.
        </p>
      )}
      {lowMinutes && (
        <p className="note">
          Futbolchilardan biri juda kam daqiqa o&apos;ynagan — 90 daqiqaga
          normallashtirilgan ko&apos;rsatkichlar chalg&apos;itishi mumkin.
        </p>
      )}

      {!mixed && (
        <section className="detail-block">
          <h2>Umumiy qiyofa</h2>
          <RadarChart axes={axes} nameA={a.name} nameB={b.name} />
        </section>
      )}

      <section className="detail-block">
        <h2>Ustun jihatlar</h2>
        <div className="strengths-grid">
          <StrengthCard name={a.name} tone="a" strengths={strengths.a} />
          <StrengthCard name={b.name} tone="b" strengths={strengths.b} />
        </div>
      </section>

      <BarSection title="Umumiy">
        <StatBar label="O'yinlar" a={sa.appearances} b={sb.appearances} />
        <StatBar label="Asosiy tarkibda" a={sa.lineups} b={sb.lineups} />
        <StatBar label="Daqiqalar" a={sa.minutes} b={sb.minutes} />
        <StatBar
          label="O'rtacha reyting"
          a={sa.rating ?? 0}
          b={sb.rating ?? 0}
          aText={sa.rating ? sa.rating.toFixed(2) : "—"}
          bText={sb.rating ? sb.rating.toFixed(2) : "—"}
        />
      </BarSection>

      {bothGK ? (
        <BarSection title="Darvoza himoyasi">
          <StatBar label="Seyvlar" a={sa.saves} b={sb.saves} />
          <StatBar
            label="Seyvlar (90 daq.)"
            a={per90(sa.saves, sa.minutes)}
            b={per90(sb.saves, sb.minutes)}
            aText={per90Text(sa.saves, sa)}
            bText={per90Text(sb.saves, sb)}
          />
          <StatBar label="O'tkazilgan gollar" a={sa.conceded} b={sb.conceded} lowerIsBetter />
          <StatBar
            label="O'tkazilgan (90 daq.)"
            a={per90(sa.conceded, sa.minutes)}
            b={per90(sb.conceded, sb.minutes)}
            aText={per90Text(sa.conceded, sa)}
            bText={per90Text(sb.conceded, sb)}
            lowerIsBetter
          />
        </BarSection>
      ) : (
        <BarSection title="Hujum">
          <StatBar label="Gollar" a={sa.goals} b={sb.goals} />
          <StatBar
            label="Gollar (90 daq.)"
            a={per90(sa.goals, sa.minutes)}
            b={per90(sb.goals, sb.minutes)}
            aText={per90Text(sa.goals, sa)}
            bText={per90Text(sb.goals, sb)}
          />
          <StatBar label="Golli uzatmalar" a={sa.assists} b={sb.assists} />
          <StatBar label="Zarbalar" a={sa.shots} b={sb.shots} />
          <StatBar
            label="Zarba aniqligi"
            a={pct(sa.shotsOn, sa.shots) ?? 0}
            b={pct(sb.shotsOn, sb.shots) ?? 0}
            aText={pctText(sa.shotsOn, sa.shots)}
            bText={pctText(sb.shotsOn, sb.shots)}
          />
          <StatBar
            label="Driblinglar (muvaffaqiyatli)"
            a={sa.dribblesWon}
            b={sb.dribblesWon}
            aText={`${sa.dribblesWon}/${sa.dribbleAttempts}`}
            bText={`${sb.dribblesWon}/${sb.dribbleAttempts}`}
          />
          {(sa.penaltyScored + sa.penaltyMissed > 0 || sb.penaltyScored + sb.penaltyMissed > 0) && (
            <StatBar
              label="Penaltilar (aniq)"
              a={sa.penaltyScored}
              b={sb.penaltyScored}
              aText={`${sa.penaltyScored}/${sa.penaltyScored + sa.penaltyMissed}`}
              bText={`${sb.penaltyScored}/${sb.penaltyScored + sb.penaltyMissed}`}
            />
          )}
        </BarSection>
      )}

      <BarSection title="Uzatmalar">
        <StatBar label="Uzatmalar" a={sa.passes} b={sb.passes} />
        <StatBar label="Kalit uzatmalar" a={sa.keyPasses} b={sb.keyPasses} />
        <StatBar
          label="Uzatma aniqligi"
          a={sa.passAccuracy ?? 0}
          b={sb.passAccuracy ?? 0}
          aText={sa.passAccuracy === null ? "—" : `${Math.round(sa.passAccuracy)}%`}
          bText={sb.passAccuracy === null ? "—" : `${Math.round(sb.passAccuracy)}%`}
        />
      </BarSection>

      {!bothGK && (
        <BarSection title="Himoya">
          <StatBar label="To'p olib qo'yish" a={sa.tackles} b={sb.tackles} />
          <StatBar label="Uzilishlar" a={sa.interceptions} b={sb.interceptions} />
          <StatBar
            label="Duel g'alabalari"
            a={sa.duelsWon}
            b={sb.duelsWon}
            aText={`${sa.duelsWon} (${pctText(sa.duelsWon, sa.duelsTotal)})`}
            bText={`${sb.duelsWon} (${pctText(sb.duelsWon, sb.duelsTotal)})`}
          />
        </BarSection>
      )}

      <BarSection title="Intizom">
        <StatBar label="Sariq kartochka" a={sa.yellow} b={sb.yellow} lowerIsBetter />
        <StatBar label="Qizil kartochka" a={sa.red} b={sb.red} lowerIsBetter />
        <StatBar label="Unga qilingan fol" a={sa.foulsDrawn} b={sb.foulsDrawn} />
        <StatBar label="O'zi qilgan fol" a={sa.foulsCommitted} b={sb.foulsCommitted} lowerIsBetter />
      </BarSection>
    </>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string }>;
}) {
  const params = await searchParams;
  const id1 = parseId(params.p1);
  const id2 = parseId(params.p2);
  const samePlayer = id1 !== null && id1 === id2;

  const squad = await getSquad();

  const [profileA, profileB] =
    id1 && id2 && !samePlayer
      ? await Promise.all([fetchLatestPlayerProfile(id1), fetchLatestPlayerProfile(id2)])
      : [null, null];

  const bothLoaded = profileA !== null && profileB !== null;
  const seasonsDiffer = bothLoaded && profileA.season !== profileB.season;
  const isOlderSeason =
    bothLoaded && (profileA.season !== currentApiSeason() || profileB.season !== currentApiSeason());

  return (
    <SubpageShell
      title="O'yinchilarni taqqoslash"
      sub="Ikki futbolchini tanlang — mavsum statistikasi yonma-yon"
      backHref="/squad"
    >
      <CompareSelect players={squad} p1={id1} p2={id2} />

      {samePlayer && (
        <div className="empty-state">
          <p>Ikki xil futbolchini tanlang — futbolchi o&apos;zi bilan taqqoslanmaydi 🙂</p>
        </div>
      )}

      {!samePlayer && bothLoaded && (
        <>
          <div className="vs-hero">
            <HeroSide profile={profileA} tone="a" />
            <div className="vs-hero__vs">VS</div>
            <HeroSide profile={profileB} tone="b" />
          </div>

          {seasonsDiffer ? (
            <p className="note">
              Diqqat: futbolchilar turli mavsum ma&apos;lumotlari bilan taqqoslanmoqda (
              {profileA.season}/{String(profileA.season + 1).slice(2)} va {profileB.season}/
              {String(profileB.season + 1).slice(2)}) — manbada mavjud oxirgi mavsumlar shu.
            </p>
          ) : (
            bothLoaded && (
              <p className="note">
                {profileA.season}/{String(profileA.season + 1).slice(2)} mavsumi, barcha
                musobaqalar yig&apos;indisi.
                {isOlderSeason &&
                  " Joriy mavsum manbada hali ochiq emas — oxirgi mavjud mavsum ko'rsatilmoqda."}
              </p>
            )
          )}

          <Comparison a={profileA} b={profileB} />
        </>
      )}

      {!samePlayer && !bothLoaded && (id1 || id2) && (
        <div className="empty-state">
          <p>
            {!id1 || !id2
              ? "Taqqoslash uchun ikkinchi futbolchini ham tanlang."
              : hasFootballKey()
                ? "Futbolchi ma'lumotini yuklab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
                : "Statistika manbasi hozircha ulanmagan."}
          </p>
        </div>
      )}

      {!id1 && !id2 && (
        <div className="empty-state">
          <p>
            Yuqoridan ikki futbolchini tanlang. Eng qiziq taqqoslash — pozitsiyasi
            yaqin o&apos;yinchilar o&apos;rtasida bo&apos;ladi.
          </p>
        </div>
      )}
    </SubpageShell>
  );
}
