import type { Metadata } from "next";
import Link from "next/link";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import LogoutButton from "@/components/admin/LogoutButton";
import { getApplications, getApplicationStats } from "@/lib/applications";
import { STATUS_LABELS } from "@/lib/status";

export const metadata: Metadata = {
  title: "Arizalar — Admin panel",
  robots: { index: false, follow: false },
};

// Har kirishda yangi ma'lumot ko'rsatilsin
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Barchasi" },
  { key: "new", label: STATUS_LABELS.new },
  { key: "approved", label: STATUS_LABELS.approved },
  { key: "rejected", label: STATUS_LABELS.rejected },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const [applications, counts] = await Promise.all([
    getApplications(status),
    getApplicationStats(),
  ]);

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Fan-klub arizalari</h1>
          <p className="admin__sub">
            Jami {counts.all} ta ariza · {counts.new} tasi ko'rilmagan
          </p>
        </div>
        <div className="admin__actions">
          <Link href="/admin/squad" className="btn btn--ghost">Tarkib</Link>
          <Link href="/admin/news" className="btn btn--ghost">
            Yangiliklar
          </Link>
          <Link href="/admin/sync" className="btn btn--ghost">
            Sinxronizatsiya
          </Link>
          <Link href="/admin/stream" className="btn btn--ghost">
            Efir
          </Link>
          <Link href="/admin/support" className="btn btn--ghost">Donat</Link>
          <Link href="/" className="btn btn--ghost">
            Saytga
          </Link>
          <LogoutButton />
        </div>
      </header>

      <nav className="filters">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin" : `/admin?status=${f.key}`}
            className={`chip${status === f.key ? " is-active" : ""}`}
          >
            {f.label}
            <span className="chip__count">{counts[f.key] ?? 0}</span>
          </Link>
        ))}
      </nav>

      {applications.length === 0 ? (
        <p className="admin__empty">
          {status === "all"
            ? "Hali birorta ariza kelmagan."
            : "Bu holatda ariza yo'q."}
        </p>
      ) : (
        <ApplicationsTable
          applications={applications.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      )}
    </main>
  );
}
