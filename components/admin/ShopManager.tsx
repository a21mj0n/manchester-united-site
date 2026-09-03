"use client";

import { Eye, EyeOff, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  sizes: string;
  image: string | null;
  active: boolean;
  sortOrder: number;
}

type Draft = Omit<Product, "id" | "slug" | "image">;

const EMPTY: Draft = { name: "", description: "", price: 0, sizes: "S,M,L,XL", active: true, sortOrder: 0 };
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function ShopManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function startNew() {
    setEditing(null);
    setDraft(EMPTY);
    setFile(null);
    setRemoveImage(false);
    setError("");
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setDraft({
      name: p.name,
      description: p.description,
      price: p.price,
      sizes: p.sizes,
      active: p.active,
      sortOrder: p.sortOrder,
    });
    setFile(null);
    setRemoveImage(false);
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");

    const fd = new FormData();
    fd.set("name", draft.name);
    fd.set("description", draft.description);
    fd.set("price", String(draft.price));
    fd.set("sizes", draft.sizes);
    fd.set("active", String(draft.active));
    fd.set("sortOrder", String(draft.sortOrder));
    if (file) fd.set("image", file);
    if (removeImage) fd.set("removeImage", "true");

    const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    try {
      const res = await fetch(url, { method: editing ? "PATCH" : "POST", body: fd });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Saqlab bo'lmadi.");
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

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    router.refresh();
  }

  async function remove(p: Product) {
    if (!confirm(`"${p.name}" o'chirilsinmi?`)) return;
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    if (data?.message) alert(data.message);
    router.refresh();
  }

  return (
    <>
      <div className="news-admin__bar">
        <button className="btn btn--primary" onClick={startNew}>
          <Plus size={17} aria-hidden="true" /> Mahsulot qo'shish
        </button>
      </div>

      {open && (
        <form className="news-form" onSubmit={save}>
          <h3 className="form__title">{editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</h3>

          <div className="news-form__row news-form__row--2">
            <label className="field">
              <span>Nomi</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                maxLength={80}
                placeholder="Sharf «Red Devils Uzbekistan»"
                required
              />
            </label>
            <label className="field">
              <span>Narxi (so'm)</span>
              <input
                type="number"
                min={1000}
                step={1000}
                value={draft.price || ""}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Tavsif</span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              maxLength={1000}
              placeholder="Material, o'lcham jadvali, partiya muddati…"
            />
          </label>

          <div className="news-form__row news-form__row--2">
            <label className="field">
              <span>O'lchamlar (vergul bilan, bo'sh bo'lsa o'lchamsiz)</span>
              <input
                value={draft.sizes}
                onChange={(e) => setDraft({ ...draft, sizes: e.target.value })}
                placeholder="S,M,L,XL"
              />
            </label>
            <label className="field">
              <span>Tartib (kichigi oldin)</span>
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
              />
            </label>
          </div>

          <label className="field">
            <span>Rasm (JPG, PNG yoki WebP, 2 MB gacha)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="news-form__checks">
            <label>
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Sotuvda
            </label>
            {editing?.image && (
              <label>
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(e) => setRemoveImage(e.target.checked)}
                />
                Rasmni olib tashlash
              </label>
            )}
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

      {products.length === 0 ? (
        <p className="admin__empty">Hali mahsulot yo'q. Qo'shilgach /shop va bosh sahifada chiqadi.</p>
      ) : (
        <div className="news-admin__list">
          {products.map((p) => (
            <article key={p.id} className={`news-admin${p.active ? "" : " is-hidden"}`}>
              <div className="news-admin__thumb product-thumb">
                {p.image ? <img src={p.image} alt="" /> : <ImageOff size={22} aria-hidden="true" />}
              </div>
              <div className="news-admin__body">
                <div className="news-admin__tags">
                  <span className="tag tag--gold">{fmt(p.price)} so'm</span>
                  {p.sizes && <span className="tag">{p.sizes.split(",").join(" · ")}</span>}
                  {!p.active && <span className="tag">Sotuvda emas</span>}
                </div>
                <h3>{p.name}</h3>
                <p>{p.description || "Tavsif yo'q"}</p>
                <Link href={`/shop/${p.slug}`} className="news__date" target="_blank">
                  /shop/{p.slug}
                </Link>
              </div>
              <div className="news-admin__actions">
                <button className="mini" onClick={() => startEdit(p)}>
                  <Pencil size={13} aria-hidden="true" /> Tahrirlash
                </button>
                <button className="mini" onClick={() => toggleActive(p)}>
                  {p.active ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                  {p.active ? "Yashirish" : "Sotuvga"}
                </button>
                <button className="mini mini--no" onClick={() => remove(p)}>
                  <Trash2 size={13} aria-hidden="true" /> O'chirish
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
