import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import SyncPanel from "@/components/admin/SyncPanel";
import { prisma } from "@/lib/prisma";
import { formatTashkentDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sinxronizatsiya — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSyncPage() {
  const [logs, counts] = await Promise.all([
    prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    Promise.all([
      prisma.player.count(),
      prisma.match.count(),
      prisma.standingRow.count(),
      prisma.newsPost.count({ where: { externalId: { not: null } } }),
    ]),
  ]);

  const [players, matches, standings, importedNews] = counts;
  const last = logs[0];

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Sinxronizatsiya</h1>
          <p className="admin__sub">
            {last
              ? `Oxirgi yurish: ${formatTashkentDate(last.startedAt.toISOString())} · ${
                  last.ok ? "muvaffaqiyatli" : "qisman"
                }`
              : "Hali ishga tushmagan"}
          </p>
        </div>
        <AdminNav current="/admin/sync" />
      </header>

      <div className="sync-stats">
        <div><b>{players}</b><span>o&apos;yinchi</span></div>
        <div><b>{matches}</b><span>o&apos;yin</span></div>
        <div><b>{standings}</b><span>jadval qatori</span></div>
        <div><b>{importedNews}</b><span>import qilingan yangilik</span></div>
      </div>

      <SyncPanel
        logs={logs.map((l) => ({
          id: l.id,
          startedAt: l.startedAt.toISOString(),
          ok: l.ok,
          finished: l.finishedAt !== null,
          details: l.details,
        }))}
      />
    </main>
  );
}
