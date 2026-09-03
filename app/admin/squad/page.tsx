import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import SquadManager from "@/components/admin/SquadManager";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tarkib — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSquadPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ isAcademy: "asc" }, { pos: "asc" }, { num: "asc" }],
  });

  const first = players.filter((p) => !p.isAcademy).length;

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Jamoa tarkibi</h1>
          <p className="admin__sub">
            {first} asosiy · {players.length - first} akademiya ·{" "}
            {players.filter((p) => p.manual).length} tasi qo&apos;lda qo&apos;shilgan
          </p>
        </div>
        <AdminNav current="/admin/squad" />
      </header>

      <SquadManager
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          num: p.num,
          pos: p.pos,
          posName: p.posName,
          age: p.age,
          photo: p.photo,
          isAcademy: p.isAcademy,
          manual: p.manual,
          overridden: p.academyOverride !== null,
        }))}
      />
    </main>
  );
}
