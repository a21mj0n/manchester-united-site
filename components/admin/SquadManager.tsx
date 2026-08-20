"use client";

import { ArrowLeftRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Row {
  id: number;
  name: string;
  num: number;
  pos: string;
  posName: string;
  age: number | null;
  photo: string | null;
  isAcademy: boolean;
  manual: boolean;
  overridden: boolean;
}

const POSITIONS = [
  { key: "GK", label: "Darvozabon" },
  { key: "DF", label: "Himoyachi" },
  { key: "MF", label: "Yarim himoyachi" },
  { key: "FW", label: "Hujumchi" },
];

const EMPTY = { name: "", num: "", pos: "DF", age: "", photo: "", isAcademy: false };

export default function SquadManager({ players }: { players: Row[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | "form" | null>(null);
  const [error, setError] = useState("");

  const first = players.filter((p) => !p.isAcademy);
  const academy = players.filter((p) => p.isAcademy);

  async function move(player: Row) {
    setBusy(player.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/squad/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAcademy: !player.isAcademy }),
      });
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "O'zgartirib bo'lmadi.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(player: Row) {
    if (!confirm(`"${player.name}" o'chirilsinmi?`)) return;
    setBusy(player.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/squad/${player.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "O'chirib bo'lmadi.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function startEdit(player: Row) {
    setEditingId(player.id);
    setDraft({
      name: player.name,
      num: String(player.num),
      pos: player.pos,
      age: player.age === null ? "" : String(player.age),
      photo: player.photo ?? "",
      isAcademy: player.isAcademy,
    });
    setOpen(true);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("form");
    setError("");

    const payload = {
      name: draft.name,
      num: Number(draft.num),
      pos: draft.pos,
      age: draft.age === "" ? null : Number(draft.age),
      photo: draft.photo || null,
      isAcademy: draft.isAcademy,
    };

    try {
      const res = await fetch(
        editingId ? `/api/admin/squad/${editingId}` : "/api/admin/squad",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Saqlab bo'lmadi.");
        return;
      }
      setOpen(false);
      setEditingId(null);
      setDraft({ ...EMPTY });
      router.refresh();
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setBusy(null);
    }
  }

  function renderGroup(title: string, rows: Row[]) {
    return (
      <section className="squad-admin__group">
        <h2 className="squad-admin__title">
          {title} <b>{rows.length}</b>
        </h2>
        <div className="squad-admin__list">
          {rows.map((p) => (
            <article key={p.id} className="squad-admin__row">
              <span className="squad-admin__num">#{p.num}</span>
              <div className="squad-admin__info">
                <b>{p.name}</b>
                <small>
                  {p.posName}
                  {p.age !== null && ` · ${p.age} yosh`}
                  {p.manual && " · qo'lda qo'shilgan"}
                  {p.overridden && !p.manual && " · guruh qo'lda belgilangan"}
                </small>
              </div>
              <div className="squad-admin__actions">
                <button className="mini" onClick={() => move(p)} disabled={busy === p.id}>
                  <ArrowLeftRight size={13} aria-hidden="true" />
                  {p.isAcademy ? "Asosiyga" : "Akademiyaga"}
                </button>
                {p.manual && (
                  <>
                    <button className="mini" onClick={() => startEdit(p)}>
                      <Pencil size={13} aria-hidden="true" /> Tahrirlash
                    </button>
                    <button className="mini mini--no" onClick={() => remove(p)} disabled={busy === p.id}>
                      <Trash2 size={13} aria-hidden="true" /> O&apos;chirish
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="news-admin__bar">
        <button
          className="btn btn--primary"
          onClick={() => {
            setEditingId(null);
            setDraft({ ...EMPTY });
            setOpen(true);
          }}
        >
          <Plus size={17} aria-hidden="true" /> O&apos;yinchi qo&apos;shish
        </button>
      </div>

      <p className="squad-admin__hint">
        Manba tarkibni chala berishi mumkin. Bu yerda qo&apos;shilgan o&apos;yinchini
        kunlik sinxronizatsiya o&apos;chirmaydi, guruhni qo&apos;lda belgilasangiz ham
        uni buzmaydi.
      </p>

      {error && <p className="form__msg err">{error}</p>}

      {open && (
        <form className="news-form" onSubmit={save}>
          <h3 className="form__title">
            {editingId ? "O'yinchini tahrirlash" : "Yangi o'yinchi"}
          </h3>

          <label className="field">
            <span>Ism</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="M. de Ligt"
              maxLength={80}
            />
          </label>

          <div className="news-form__row">
            <label className="field">
              <span>Raqam</span>
              <input
                type="number"
                min={0}
                max={99}
                value={draft.num}
                onChange={(e) => setDraft({ ...draft, num: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Pozitsiya</span>
              <select
                value={draft.pos}
                onChange={(e) => setDraft({ ...draft, pos: e.target.value })}
              >
                {POSITIONS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Yosh</span>
              <input
                type="number"
                min={14}
                max={50}
                value={draft.age}
                onChange={(e) => setDraft({ ...draft, age: e.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>Rasm havolasi (ixtiyoriy, https)</span>
            <input
              value={draft.photo}
              onChange={(e) => setDraft({ ...draft, photo: e.target.value })}
              placeholder="https://media.api-sports.io/football/players/532.png"
            />
          </label>

          <div className="news-form__checks">
            <label>
              <input
                type="checkbox"
                checked={draft.isAcademy}
                onChange={(e) => setDraft({ ...draft, isAcademy: e.target.checked })}
              />
              Akademiya va zaxira guruhiga
            </label>
          </div>

          <div className="news-form__actions">
            <button type="submit" className="btn btn--primary" disabled={busy === "form"}>
              {busy === "form" ? "Saqlanmoqda…" : "Saqlash"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {renderGroup("Asosiy tarkib", first)}
      {renderGroup("Akademiya va zaxira", academy)}
    </>
  );
}
