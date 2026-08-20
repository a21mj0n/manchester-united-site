"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Post {
  id: number;
  title: string;
  excerpt: string;
  tag: string;
  tagColor: string;
  image: number;
  meta: string;
  featured: boolean;
  published: boolean;
}

const EMPTY: Omit<Post, "id"> = {
  title: "",
  excerpt: "",
  tag: "Yangilik",
  tagColor: "default",
  image: 1,
  meta: "",
  featured: false,
  published: true,
};

export default function NewsManager({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Post | null>(null);
  const [draft, setDraft] = useState<Omit<Post, "id">>(EMPTY);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function startNew() {
    setEditing(null);
    setDraft(EMPTY);
    setError("");
    setOpen(true);
  }

  function startEdit(post: Post) {
    setEditing(post);
    const { id: _id, ...rest } = post;
    setDraft(rest);
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");

    const url = editing ? `/api/admin/news/${editing.id}` : "/api/admin/news";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Saqlab bo'lmadi.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setPending(false);
    }
  }

  async function togglePublished(post: Post) {
    await fetch(`/api/admin/news/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    router.refresh();
  }

  async function remove(post: Post) {
    if (!confirm(`"${post.title}" o'chirilsinmi?`)) return;
    await fetch(`/api/admin/news/${post.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="news-admin__bar">
        <button className="btn btn--primary" onClick={startNew}>
          <Plus size={17} aria-hidden="true" /> Yangilik qo'shish
        </button>
      </div>

      {open && (
        <form className="news-form" onSubmit={save}>
          <h3 className="form__title">
            {editing ? "Yangilikni tahrirlash" : "Yangi yangilik"}
          </h3>

          <label className="field">
            <span>Sarlavha</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              maxLength={120}
            />
          </label>

          <label className="field">
            <span>Matn</span>
            <textarea
              rows={3}
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              maxLength={400}
            />
          </label>

          <div className="news-form__row">
            <label className="field">
              <span>Yorliq</span>
              <input
                value={draft.tag}
                onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                maxLength={30}
              />
            </label>

            <label className="field">
              <span>Yorliq rangi</span>
              <select
                value={draft.tagColor}
                onChange={(e) => setDraft({ ...draft, tagColor: e.target.value })}
              >
                <option value="default">Oddiy</option>
                <option value="red">Qizil</option>
                <option value="gold">Oltin</option>
              </select>
            </label>

            <label className="field">
              <span>Fon naqshi</span>
              <select
                value={draft.image}
                onChange={(e) => setDraft({ ...draft, image: Number(e.target.value) })}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>Naqsh {n}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Kichik matn (masalan: Har hafta · Toshkent)</span>
            <input
              value={draft.meta}
              onChange={(e) => setDraft({ ...draft, meta: e.target.value })}
              maxLength={60}
            />
          </label>

          <div className="news-form__checks">
            <label>
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Katta karta sifatida ko'rsatilsin
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />
              Saytda ko'rinsin
            </label>
          </div>

          {error && <p className="form__msg err">{error}</p>}

          <div className="news-form__actions">
            <button type="submit" className="btn btn--primary" disabled={pending}>
              {pending ? "Saqlanmoqda…" : "Saqlash"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <p className="admin__empty">
          Hali yangilik yo'q. Qo'shmaguningizcha bosh sahifada standart kartalar turadi.
        </p>
      ) : (
        <div className="news-admin__list">
          {posts.map((p) => (
            <article key={p.id} className={`news-admin${p.published ? "" : " is-hidden"}`}>
              <div className={`news-admin__thumb news__img--${p.image}`} />
              <div className="news-admin__body">
                <div className="news-admin__tags">
                  <span className={`tag${p.tagColor === "red" ? " tag--red" : p.tagColor === "gold" ? " tag--gold" : ""}`}>
                    {p.tag}
                  </span>
                  {p.featured && <span className="tag tag--gold">Katta</span>}
                  {!p.published && <span className="tag">Yashirin</span>}
                </div>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                {p.meta && <span className="news__date">{p.meta}</span>}
              </div>
              <div className="news-admin__actions">
                <button className="mini" onClick={() => startEdit(p)}>
                  <Pencil size={13} aria-hidden="true" /> Tahrirlash
                </button>
                <button className="mini" onClick={() => togglePublished(p)}>
                  {p.published ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                  {p.published ? "Yashirish" : "Ko'rsatish"}
                </button>
                <button className="mini mini--no" onClick={() => remove(p)}>
                  <Trash2 size={13} aria-hidden="true" /> O&apos;chirish
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
