"use client";

import { HandHeart, Send, Shirt, Ticket, Trophy } from "lucide-react";
import { useState } from "react";

const CITIES = ["Toshkent","Samarqand","Buxoro","Farg'ona","Namangan","Andijon","Nukus","Qarshi","Boshqa"];

const PERKS = [
  { Icon: Ticket, title: "Birgalikda tomosha", text: "Toshkent, Samarqand, Farg'ona va boshqa shaharlarda" },
  { Icon: Shirt, title: "Klub atributikasi", text: "Sharf, futbolka va fan-klub kartasi" },
  { Icon: Trophy, title: "Mini-futbol turnirlari", text: "Har oyda muxlislar o'rtasida musobaqa" },
  { Icon: HandHeart, title: "Xayriya", text: "Bolalar uyiga sport anjomlari yetkazish" },
];

type Status = { type: "ok" | "err"; text: string } | null;

export default function FanClub() {
  const [status, setStatus] = useState<Status>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      contact: String(fd.get("contact") ?? "").trim(),
      since: fd.get("since") ? Number(fd.get("since")) : undefined,
    };

    const nextErrors: Record<string, boolean> = {
      name: !payload.name,
      city: !payload.city,
      contact: !payload.contact,
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setStatus({ type: "err", text: "Iltimos, majburiy maydonlarni to'ldiring." });
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setStatus({ type: "err", text: data.error ?? "Xatolik yuz berdi. Qayta urinib ko'ring." });
        return;
      }

      setStatus({ type: "ok", text: data.message ?? "Arizangiz qabul qilindi!" });
      form.reset();
    } catch {
      setStatus({ type: "err", text: "Serverga ulanib bo'lmadi. Internetni tekshiring." });
    } finally {
      setPending(false);
    }
  }

  const fieldClass = (name: string) => `field${errors[name] ? " has-error" : ""}`;

  return (
    <section className="section" id="fanclub">
      <div className="container fanclub">
        <div className="fanclub__info reveal">
          <h2 className="section__title">Fan-klubga qo'shiling</h2>
          <p className="section__sub">
            Red Devils Uzbekistan — bu rasmiy bo'lmagan muxlislar jamoasi. Biz
            birgalikda o'yin ko'ramiz, futbol o'ynaymiz va xayriya aksiyalarini
            tashkil qilamiz.
          </p>
          <ul className="perks">
            {PERKS.map((p) => (
              <li key={p.title}>
                <span className="perks__icon">
                  <p.Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <b>{p.title}</b>
                  <small>{p.text}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form className="form reveal" onSubmit={onSubmit} noValidate>
          <h3 className="form__title">Ariza qoldiring</h3>

          <label className={fieldClass("name")}>
            <span>Ism familiya</span>
            <input type="text" name="name" placeholder="Azimjon Toirov" />
          </label>

          <label className={fieldClass("city")}>
            <span>Shahar</span>
            <select name="city" defaultValue="">
              <option value="">Tanlang…</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className={fieldClass("contact")}>
            <span>Telegram yoki telefon</span>
            <input type="text" name="contact" placeholder="@username / +998 90 123 45 67" />
          </label>

          <label className="field">
            <span>Nechanchi yildan beri muxlissiz?</span>
            <input type="number" name="since" min={1878} max={2030} placeholder="2010" />
          </label>

          <button type="submit" className="btn btn--primary btn--full" disabled={pending}>
            <Send size={17} aria-hidden="true" />
            {pending ? "Yuborilmoqda…" : "Arizani yuborish"}
          </button>

          <p className={`form__msg${status ? ` ${status.type}` : ""}`} role="status">
            {status?.text}
          </p>
          <p className="form__hint">
            Ariza /api/join route handler ga yuboriladi — hozircha baza ulanmagan.
          </p>
        </form>
      </div>
    </section>
  );
}
