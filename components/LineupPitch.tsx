import TeamBadge from "./TeamBadge";
import { MU } from "@/lib/data";
import type { LineupPlayerItem, LineupTeam } from "@/types/football";

/**
 * Tarkiblarning maydon ustidagi ko'rinishi.
 *
 * O'rinlar API beradigan `grid` ("qator:ustun") asosida hisoblanadi:
 * 1-qator — darvozabon, keyingilari oldinga; 1-ustun — chap qanot.
 * Uy egalari chapdan o'ngga, mehmonlar o'ngdan chapga hujum qiladi,
 * shuning uchun mehmon jamoada ustunlar teskari o'qiladi — chap
 * qanot ekranning pastida bo'ladi.
 */

interface Placed {
  player: LineupPlayerItem;
  /** Konteynerga nisbatan foizda */
  x: number;
  y: number;
}

/**
 * Chizmaning chap/o'ng chegaralari (foizda). Markazgacha bormaymiz:
 * ikkala jamoaning eng oldingi chizig'i markazda uchrashsa ismlar
 * bir-birining ustiga tushib qoladi.
 */
const NEAR_GOAL = 5;
const NEAR_CENTER = 41;

function place(team: LineupTeam, isHome: boolean): Placed[] | null {
  const parsed = team.startXI
    .map((player) => {
      const [row, col] = (player.grid ?? "").split(":").map(Number);
      return Number.isInteger(row) && Number.isInteger(col)
        ? { player, row, col }
        : null;
    })
    .filter((p): p is { player: LineupPlayerItem; row: number; col: number } => p !== null);

  // Manba o'rinlarni bermagan — sxema chizib bo'lmaydi
  if (parsed.length < team.startXI.length || parsed.length === 0) return null;

  const perRow = new Map<number, number>();
  for (const p of parsed) perRow.set(p.row, (perRow.get(p.row) ?? 0) + 1);
  const maxRow = Math.max(...parsed.map((p) => p.row));

  return parsed.map(({ player, row, col }) => {
    const depth = maxRow > 1 ? (row - 1) / (maxRow - 1) : 0;
    const x = isHome
      ? NEAR_GOAL + depth * (NEAR_CENTER - NEAR_GOAL)
      : 100 - NEAR_GOAL - depth * (NEAR_CENTER - NEAR_GOAL);

    const inRow = perRow.get(row) ?? 1;
    const across = ((col - 0.5) / inRow) * 100;

    return { player, x, y: isHome ? across : 100 - across };
  });
}

function PlayerDot({ p, isMu }: { p: Placed; isMu: boolean }) {
  return (
    <div
      className={`pitch-player${isMu ? " pitch-player--mu" : ""}`}
      style={{ left: `${p.x}%`, top: `${p.y}%` }}
    >
      <span className="pitch-player__num">{p.player.number || "—"}</span>
      <span className="pitch-player__name">{p.player.name}</span>
    </div>
  );
}

function TeamHead({ team, align }: { team: LineupTeam; align: "start" | "end" }) {
  return (
    <div className={`pitch-head pitch-head--${align}`}>
      <TeamBadge badge={team.logo} team={team.team} size={24} />
      <div>
        <b>{team.team}</b>
        <small>
          {team.formation && `Sxema: ${team.formation}`}
          {team.coach && ` · Murabbiy: ${team.coach}`}
        </small>
      </div>
    </div>
  );
}

function Subs({ team }: { team: LineupTeam }) {
  if (team.substitutes.length === 0) return null;
  return (
    <div className="pitch-subs">
      <p className="lineup__subhead">{team.team} — zaxira</p>
      <p className="pitch-subs__list">
        {team.substitutes.map((p) => `${p.number || "—"} ${p.name}`).join(" · ")}
      </p>
    </div>
  );
}

export default function LineupPitch({ teams }: { teams: LineupTeam[] }) {
  const [home, away] = teams;
  const homePlaced = place(home, true);
  const awayPlaced = place(away, false);

  if (!homePlaced || !awayPlaced) {
    return (
      <p className="note">
        Bu o&apos;yin uchun manba o&apos;yinchilarning maydondagi o&apos;rnini
        bermagan — tarkiblarni ro&apos;yxat ko&apos;rinishida ko&apos;ring.
      </p>
    );
  }

  return (
    <>
      <div className="pitch-heads">
        <TeamHead team={home} align="start" />
        <TeamHead team={away} align="end" />
      </div>

      <div className="pitch-scroll">
        <div className="pitch">
          {/* Maydon chiziqlari */}
          <span className="pitch__half" aria-hidden="true" />
          <span className="pitch__circle" aria-hidden="true" />
          <span className="pitch__box pitch__box--left" aria-hidden="true" />
          <span className="pitch__box pitch__box--right" aria-hidden="true" />
          <span className="pitch__six pitch__six--left" aria-hidden="true" />
          <span className="pitch__six pitch__six--right" aria-hidden="true" />

          {homePlaced.map((p) => (
            <PlayerDot key={p.player.id ?? p.player.name} p={p} isMu={home.team === MU} />
          ))}
          {awayPlaced.map((p) => (
            <PlayerDot key={p.player.id ?? p.player.name} p={p} isMu={away.team === MU} />
          ))}
        </div>
      </div>

      <div className="pitch-subs-grid">
        <Subs team={home} />
        <Subs team={away} />
      </div>
    </>
  );
}
