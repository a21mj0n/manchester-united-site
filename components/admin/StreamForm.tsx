"use client";

import { Save } from "lucide-react";
import { useState } from "react";

export default function StreamForm({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/stream", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ ok: false, text: data?.error ?? "Saqlab bo'lmadi." });
        return;
      }
      setMsg({ ok: true, text: "Saqlandi. Tomosha sahifasida yangilandi." });
    } catch {
      setMsg({ ok: false, text: "Serverga ulanib bo'lmadi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="news-form" onSubmit={save}>
      <label className="field">
        <span>Efir havolasi</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://liveball.sx/match/…"
          required
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
