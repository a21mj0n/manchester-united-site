import type { Metadata } from "next";
import Link from "next/link";

import AdminNav from "@/components/admin/AdminNav";
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
        <AdminNav current="/admin/stream" />
      </header>

      <StreamForm initialUrl={url} />

      <p className="note">
        Havola <Link href="/tomosha">/tomosha</Link> sahifasida ⚽ tugmasi 5
        marta bosilganda ko'rinadi.
      </p>
    </main>
  );
}
