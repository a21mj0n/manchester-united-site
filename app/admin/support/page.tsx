import type { Metadata } from "next";
import Link from "next/link";

import LogoutButton from "@/components/admin/LogoutButton";
import SupportForm from "@/components/admin/SupportForm";
import { getDonateSettings } from "@/lib/donate";

export const metadata: Metadata = {
  title: "Donat — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const settings = await getDonateSettings();

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Donat</h1>
          <p className="admin__sub">
            Qo'llab-quvvatlash sahifasidagi oylik maqsad va to'lov rekvizitlari.
          </p>
        </div>
        <div className="admin__actions">
          <Link href="/admin" className="btn btn--ghost">Arizalar</Link>
          <Link href="/admin/squad" className="btn btn--ghost">Tarkib</Link>
          <Link href="/admin/news" className="btn btn--ghost">Yangiliklar</Link>
          <Link href="/admin/sync" className="btn btn--ghost">Sinxronizatsiya</Link>
          <Link href="/admin/stream" className="btn btn--ghost">Efir</Link>
          <LogoutButton />
        </div>
      </header>

      <SupportForm initial={settings} />

      <p className="note">
        Sahifa: <Link href="/support">/support</Link>. Rekvizitlar bazada saqlanadi,
        kodga yozilmaydi.
      </p>
    </main>
  );
}
