import type { Metadata } from "next";

import AdminNav from "@/components/admin/AdminNav";
import { RETENTION_DAYS, getVisitStats, type DayStat } from "@/lib/visits";

export const metadata: Metadata = {
  title: "Statistika — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
/** "2026-09-03" → "03.09" */
const shortDay = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;

function Tile({ label, visitors, views }: { label: string; visitors: number; views: number }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__label">{label}</span>
      <strong className="stat-tile__value">{fmt(visitors)}</strong>
      <span className="stat-tile__sub">tashrifchi · {fmt(views)} ko'rish</span>
    </div>
  );
}

function DailyChart({ daily }: { daily: DayStat[] }) {
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  const peak = daily.reduce((a, b) => (b.visitors > a.visitors ? b : a), daily[0]);

  return (
    <div className="bars" role="img" aria-label="Oxirgi 30 kunlik tashrifchilar">
      {daily.map((d) => {
        const h = Math.round((d.visitors / max) * 100);
        const isPeak = d.visitors > 0 && d.day === peak.day;
        return (
          <div
            key={d.day}
            className="bars__col"
            title={`${shortDay(d.day)}: ${d.visitors} tashrifchi, ${d.views} ko'rish`}
          >
            {isPeak && <span className="bars__label">{d.visitors}</span>}
            <div className="bars__bar" style={{ height: `${Math.max(h, d.visitors ? 3 : 0)}%` }} />
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminStatsPage() {
  const stats = await getVisitStats();
  const daily = stats.daily;

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Statistika</h1>
          <p className="admin__sub">
            Tashriflar Toshkent vaqti bo'yicha, botlarsiz. Tarix {RETENTION_DAYS} kun saqlanadi.
          </p>
        </div>
        <AdminNav current="/admin/stats" />
      </header>

      <div className="stats__tiles">
        <Tile label="Bugun" {...stats.today} />
        <Tile label="Oxirgi 7 kun" {...stats.week} />
        <Tile label="Oxirgi 30 kun" {...stats.month} />
      </div>

      <section className="stats__card">
        <div className="stats__card-head">
          <h2>Kunlik tashrifchilar</h2>
          <span>{shortDay(daily[0].day)} — {shortDay(daily[daily.length - 1].day)}</span>
        </div>
        <DailyChart daily={daily} />
        <div className="bars__axis">
          <span>{shortDay(daily[0].day)}</span>
          <span>{shortDay(daily[Math.floor(daily.length / 2)].day)}</span>
          <span>{shortDay(daily[daily.length - 1].day)}</span>
        </div>

        <details className="stats__details">
          <summary>Jadval ko'rinishida</summary>
          <div className="table-wrap">
            <table className="table stats__table">
              <thead>
                <tr><th>Kun</th><th>Tashrifchi</th><th>Ko'rish</th></tr>
              </thead>
              <tbody>
                {[...daily].reverse().map((d) => (
                  <tr key={d.day}>
                    <td>{shortDay(d.day)}</td>
                    <td>{fmt(d.visitors)}</td>
                    <td>{fmt(d.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="stats__card">
        <div className="stats__card-head">
          <h2>Eng ko'p ochilgan sahifalar</h2>
          <span>oxirgi 30 kun</span>
        </div>
        {stats.topPaths.length === 0 ? (
          <p className="admin__empty">Hali tashrif yozilmagan.</p>
        ) : (
          <div className="table-wrap">
            <table className="table stats__table">
              <thead>
                <tr><th className="stats__path">Sahifa</th><th>Tashrifchi</th><th>Ko'rish</th></tr>
              </thead>
              <tbody>
                {stats.topPaths.map((p) => (
                  <tr key={p.path}>
                    <td className="stats__path">{p.path}</td>
                    <td>{fmt(p.visitors)}</td>
                    <td>{fmt(p.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="note">
        7 va 30 kunlik tashrifchilar bu kunlik noyob tashrifchilar yig'indisi: bir odam
        ikki kun kirsa ikki marta sanaladi. Shaxsiy ma'lumot saqlanmaydi.
      </p>
    </main>
  );
}
