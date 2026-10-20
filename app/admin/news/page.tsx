import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import NewsManager from "@/components/admin/NewsManager";
import { channelConfigured, newsChannelSent } from "@/lib/channel";
import { getAllNews } from "@/lib/news";

export const metadata: Metadata = {
  title: "Yangiliklar — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const [posts, sent] = await Promise.all([getAllNews(), newsChannelSent()]);

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Yangiliklar</h1>
          <p className="admin__sub">
            {posts.length === 0
              ? "Hali yangilik qo'shilmagan — bosh sahifada standart kartalar ko'rsatilyapti"
              : `${posts.length} ta yozuv · ${posts.filter((p) => p.published).length} tasi saytda`}
          </p>
        </div>
        <AdminNav current="/admin/news" />
      </header>

      <NewsManager
        channelReady={channelConfigured()}
        posts={posts.map((p) => ({
          channelSentAt: sent.get(p.id) ?? null,
          id: p.id,
          title: p.title,
          excerpt: p.excerpt,
          tag: p.tag,
          tagColor: p.tagColor,
          image: p.image,
          meta: p.meta,
          featured: p.featured,
          published: p.published,
        }))}
      />
    </main>
  );
}
