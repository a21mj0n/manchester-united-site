import type { Metadata } from "next";
import Link from "next/link";

import LogoutButton from "@/components/admin/LogoutButton";
import StreamForm from "@/components/admin/StreamForm";
import { getSecretStreamUrl } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Yashirin efir — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminStreamPage() {
  const url = await getSecretStreamUrl();

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Yashirin efir</h1>
          <p className="admin__sub">
            Tomosha sahifasidagi yashirin havola. Har o'yin oldidan yangilang.
          </p>
        </div>
        <div className="admin__actions">
          <Link href="/admin" className="btn btn--ghost">Arizalar</Link>
          <Link href="/admin/squad" className="btn btn--ghost">Tarkib</Link>
          <Link href="/admin/news" className="btn btn--ghost">Yangiliklar</Link>
          <Link href="/admin/sync" className="btn btn--ghost">Sinxronizatsiya</Link>
          <LogoutButton />
        </div>
      </header>

      <StreamForm initialUrl={url} />

      <p className="note">
        Havola <Link href="/tomosha">/tomosha</Link> sahifasida ⚽ tugmasi 5
        marta bosilganda ko'rinadi.
      </p>
    </main>
  );
}
