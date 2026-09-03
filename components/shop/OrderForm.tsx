"use client";

import { Send } from "lucide-react";
import { useState } from "react";

import { MAX_QTY } from "@/lib/shop-constants";

const CITIES = ["Toshkent","Samarqand","Buxoro","Farg'ona","Namangan","Andijon","Nukus","Qarshi","Boshqa"];

interface Props {
  productId: number;
  sizes: string[];
}

type Status = { type: "ok" | "err"; text: string } | null;

export default function OrderForm({ productId, sizes }: Props) {
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      productId,
      size: String(fd.get("size") ?? ""),
      qty: Number(fd.get("qty") ?? 1),
      name: String(fd.get("name") ?? "").trim(),
      contact: String(fd.get("contact") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      note: String(fd.get("note") ?? "").trim(),
    };

    if (!payload.name || !payload.contact || !payload.city) {
      setStatus({ type: "err", text: "Ism, aloqa va shahar majburiy." });
      return;
    }
    if (sizes.length && !payload.size) {
      setStatus({ type: "err", text: "O'lchamni tanlang." });
      return;
    }

    setPending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (!res.ok) {
        setStatus({ type: "err", text: data?.error ?? "Yuborib bo'lmadi." });
        return;
      }
      setDone(true);
      setStatus({ type: "ok", text: data?.message ?? "Buyurtma qabul qilindi." });
    } catch {
      setStatus({ type: "err", text: "Serverga ulanib bo'lmadi." });
    } finally {
      setPending(false);
    }
  }

  if (done && status) {
    return (
      <div className="order-form order-form--done">
        <h3 className="form__title">Buyurtma qabul qilindi</h3>
        <p className="form__msg ok">{status.text}</p>
        <p className="form__hint">
          To'lov va yetkazish tafsilotlarini bog'langanda kelishamiz. Toshkentda
          uchrashuvda qo'lma-qo'l, viloyatlarga pochta orqali.
        </p>
      </div>
    );
  }

  return (
    <form className="order-form" onSubmit={onSubmit} noValidate>
      <h3 className="form__title">Buyurtma berish</h3>

      <div className="order-form__row">
        {sizes.length > 0 && (
          <label className="field">
            <span>O'lcham</span>
            <select name="size" defaultValue="">
              <option value="" disabled>Tanlang</option>
              {sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Soni</span>
          <select name="qty" defaultValue="1">
            {Array.from({ length: MAX_QTY }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Ismingiz</span>
        <input name="name" maxLength={100} placeholder="Ism Familiya" required />
      </label>

      <div className="order-form__row">
        <label className="field">
          <span>Telefon yoki Telegram</span>
          <input name="contact" maxLength={100} placeholder="+998 90 123 45 67 yoki @username" required />
        </label>
        <label className="field">
          <span>Shahar</span>
          <select name="city" defaultValue="">
            <option value="" disabled>Tanlang</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Izoh (ixtiyoriy)</span>
        <input name="note" maxLength={500} placeholder="Masalan: ikkita turli o'lcham kerak" />
      </label>

      {status && <p className={`form__msg ${status.type}`}>{status.text}</p>}

      <button type="submit" className="btn btn--primary" disabled={pending}>
        <Send size={16} aria-hidden="true" />
        {pending ? "Yuborilmoqda…" : "Buyurtma berish"}
      </button>
      <p className="form__hint">
        Onlayn to'lov yo'q: buyurtmadan keyin bog'lanib to'lovni kelishamiz.
      </p>
    </form>
  );
}
