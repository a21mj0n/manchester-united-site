"use client";

import { Megaphone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatTashkentDate } from "@/lib/format";

interface Post {
  key: string;
  at: string;
  text: string;
}

interface Props {
  channel: string | null;
  configured: boolean;
  posts: Post[];
}

/** HTML teglarini olib tashlab, matnni oddiy ko'rinishda chiqaradi */
function plain(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

function kindOf(key: string): string {
  if (key.includes(":matchday:")) return "O'yin kuni";
  if (key.includes(":result:")) return "Natija";
  if (key.includes(":news:")) return "Yangilik";
  return "Post";
}

export default function ChannelPanel({ channel, configured, posts }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<"test" | "run" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(action: "test" | "run") {
    setPending(action);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        sent?: string[];
        skipped?: string[];
        scoresUpdated?: number;
      };

      if (action === "test") {
        setMsg(
          res.ok
            ? { ok: true, text: "Sinov xabari kanalga yuborildi." }
            : { ok: false, text: data.error ?? "Yuborilmadi." },
        );
        return;
      }

      const sent = data.sent?.length ?? 0;
      const parts = [
        sent > 0 ? `${sent} ta post yuborildi` : "yangi post yo'q",
        data.scoresUpdated ? `${data.scoresUpdated} ta hisob yangilandi` : null,
        ...(data.skipped ?? []),
      ].filter(Boolean);
      setMsg({ ok: res.ok, text: parts.join(" · ") });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Serverga ulanib bo'lmadi." });
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="channel-panel">
      <div className="channel-panel__head">
        <div>
          <h2 className="admin__h2">
            <Megaphone size={18} aria-hidden="true" /> Telegram kanal
          </h2>
          <p className="admin__sub">
            {channel ? (
              <>
                Kanal: <b>{channel}</b> ·{" "}
                {configured ? "bot ulangan" : "bot tokeni yo'q (TELEGRAM_BOT_TOKEN)"}
              </>
            ) : (
              "Kanal belgilanmagan (config/social.ts yoki TELEGRAM_CHANNEL)"
            )}
          </p>
        </div>
        <div className="admin__actions">
          <button
            className="btn btn--ghost"
            onClick={() => call("test")}
            disabled={pending !== null || !configured}
          >
            <Send size={15} aria-hidden="true" />
            {pending === "test" ? "Yuborilmoqda…" : "Sinov xabari"}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => call("run")}
            disabled={pending !== null}
          >
            {pending === "run" ? "Tekshirilmoqda…" : "Postlarni hozir tekshirish"}
          </button>
        </div>
      </div>

      {msg && <p className={`form__msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</p>}

      <p className="note">
        Timer har 30 daqiqada tekshiradi: o&apos;yin kuni soat 08:00 dan keyin e&apos;lon,
        o&apos;yin tugagach natija va jadvaldagi o&apos;rin. Bot kanalda administrator
        bo&apos;lishi kerak.
      </p>

      {posts.length > 0 && (
        <ul className="channel-posts">
          {posts.map((p) => (
            <li key={p.key}>
              <div className="channel-posts__meta">
                <span className="pill pill--w">{kindOf(p.key)}</span>
                {p.at && <small>{formatTashkentDate(p.at)}</small>}
              </div>
              <pre>{plain(p.text)}</pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
