import type { Standing } from "@/lib/types";

export default function Standings({ rows }: { rows: Standing[] }) {
  return (
    <section className="section section--alt" id="table">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Turnir jadvali</h2>
          <p className="section__sub">Angliya Premer-ligasi · namunaviy ko'rinish</p>
        </div>

        <div className="table-wrap reveal">
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
                      <i>{r.team.slice(0, 3).toUpperCase()}</i>
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
        <p className="note reveal">
          O — o'yin, G' — g'alaba, D — durang, M — mag'lubiyat, F — farq, O' — ochko
        </p>
      </div>
    </section>
  );
}
