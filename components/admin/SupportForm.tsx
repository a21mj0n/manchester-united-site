"use client";

import { Save } from "lucide-react";
import { useState } from "react";

import type { DonateSettings } from "@/lib/donate";

export default function SupportForm({ initial }: { initial: DonateSettings }) {
  const [form, setForm] = useState<DonateSettings>(initial);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof DonateSettings>(key: K, value: DonateSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ ok: false, text: data?.error ?? "Saqlab bo'lmadi." });
        return;
      }
      setForm(data);
      setMsg({ ok: true, text: "Saqlandi. /support sahifasida yangilandi." });
    } catch {
      setMsg({ ok: false, text: "Serverga ulanib bo'lmadi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="news-form" onSubmit={save}>
      <h2 className="form__title">Oylik maqsad</h2>
      <div className="news-form__row news-form__row--2">
        <label className="field">
          <span>Maqsad (so'm)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={form.goal || ""}
            onChange={(e) => set("goal", Number(e.target.value))}
            placeholder="masalan 1500000"
          />
        </label>
        <label className="field">
          <span>Shu oyda yig'ildi (so'm)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={form.collected || ""}
            onChange={(e) => set("collected", Number(e.target.value))}
            placeholder="0"
          />
        </label>
      </div>
      <p className="form__hint">
        Maqsad 0 bo'lsa progress-bar ko'rsatilmaydi. Yangi oy boshida yig'ilganni 0 ga qaytaring.
      </p>

      <h2 className="form__title" style={{ marginTop: 26 }}>To'lov usullari</h2>
      <p className="form__hint" style={{ marginBottom: 16 }}>
        Bo'sh qoldirilgan usul sahifada chiqmaydi.
      </p>

      <div className="news-form__row news-form__row--2">
        <label className="field">
          <span>Payme havolasi</span>
          <input
            type="url"
            value={form.paymeUrl}
            onChange={(e) => set("paymeUrl", e.target.value)}
            placeholder="https://payme.uz/…"
          />
        </label>
        <label className="field">
          <span>Click havolasi</span>
          <input
            type="url"
            value={form.clickUrl}
            onChange={(e) => set("clickUrl", e.target.value)}
            placeholder="https://my.click.uz/…"
          />
        </label>
      </div>

      <div className="news-form__row news-form__row--2">
        <label className="field">
          <span>Karta raqami (Uzcard / Humo)</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.cardNumber}
            onChange={(e) => set("cardNumber", e.target.value)}
            placeholder="8600 0000 0000 0000"
          />
        </label>
        <label className="field">
          <span>Karta egasi</span>
          <input
            type="text"
            value={form.cardOwner}
            onChange={(e) => set("cardOwner", e.target.value)}
            placeholder="ISM FAMILIYA"
          />
        </label>
      </div>

      <label className="field">
        <span>Telegram havolasi</span>
        <input
          type="url"
          value={form.telegramUrl}
          onChange={(e) => set("telegramUrl", e.target.value)}
          placeholder="https://t.me/username"
        />
      </label>

      {msg && <p className={`form__msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</p>}

      <div className="news-form__actions">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          <Save size={17} aria-hidden="true" />
          {pending ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>
    </form>
  );
}
