import TeamBadge from "./TeamBadge";
import type { Standing } from "@/lib/types";

interface Props {
  rows: Standing[];
  season: string;
  /** Joriy mavsum hali boshlanmagani uchun oldingi mavsum ko'rsatilyaptimi */
  isPreviousSeason: boolean;
  /** true — section qobiq'siz (alohida sahifada SubpageShell beradi) */
  bare?: boolean;
}

export default function Standings({ rows, season, isPreviousSeason, bare }: Props) {
  const seasonLabel = season === "namunaviy" ? "namunaviy ko'rinish" : season.replace("-", "/");
  // Manba bepul tarifda to'liq 20 talik jadvalni bermaydi
  const isPartial = season !== "namunaviy" && rows.length < 18;

  const subtitle = (
    <>
      Angliya Premer-ligasi · {seasonLabel}
      {isPreviousSeason && " · yakuniy (yangi mavsum hali boshlanmadi)"}
      {isPartial && ` · yuqori ${rows.length} o'rin`}
    </>
  );

  const table = (
    <>
      <div className={`table-wrap${bare ? "" : " reveal"}`}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th className="ta-left">Jamoa</th>
              <th>O</th><th>G'</th><th>D</th><th>M</th><th>F</th><th>O'</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team} className={r.isUnited ? "is-mu" : undefined}>
                <td className="rank">{r.pos}</td>
                <td>
                  <div className="team-cell">
                    <TeamBadge badge={r.badge} team={r.team} size={26} />
                    {r.team}
                  </div>
                </td>
                <td>{r.played}</td>
                <td>{r.won}</td>
                <td>{r.drawn}</td>
                <td>{r.lost}</td>
                <td>{r.gd}</td>
                <td className="pts">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`note${bare ? "" : " reveal"}`}>
        O — o'yin, G' — g'alaba, D — durang, M — mag'lubiyat, F — farq, O' — ochko
      </p>
    </>
  );

  if (bare) {
    return (
      <div>
        <p className="section__sub subpage__lead">{subtitle}</p>
        {table}
      </div>
    );
  }

  return (
    <section className="section section--alt" id="table">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Turnir jadvali</h2>
          <p className="section__sub">{subtitle}</p>
        </div>
        {table}
        <p className="section-more reveal">
          <a href="/standings">To'liq jadval sahifasi →</a>
        </p>
      </div>
    </section>
  );
}
