"use client";

import { ImagePlus, Megaphone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
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
  if (key.includes(":custom:")) return "Erkin post";
  return "Post";
}

export default function ChannelPanel({ channel, configured, posts }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<"test" | "run" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [postText, setPostText] = useState("");
  const [postHtml, setPostHtml] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submitPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!postText.trim() && !file) {
      setPostMsg({ ok: false, text: "Matn yoki rasm kiriting." });
      return;
    }
    if (!window.confirm("Post kanalga yuborilsinmi? Buni qaytarib bo'lmaydi.")) return;

    setPosting(true);
    setPostMsg(null);
    try {
      const fd = new FormData();
      fd.set("text", postText);
      if (postHtml) fd.set("html", "1");
      if (file) fd.set("image", file);
      const res = await fetch("/api/channel/post", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok) {
        setPostMsg({ ok: true, text: "Post kanalga yuborildi." });
        setPostText("");
        setPostHtml(false);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        setPostMsg({ ok: false, text: data.error ?? "Yuborilmadi." });
      }
    } catch {
      setPostMsg({ ok: false, text: "Serverga ulanib bo'lmadi." });
    } finally {
      setPosting(false);
    }
  }

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

      <form className="channel-compose" onSubmit={submitPost}>
        <h3 className="channel-compose__title">
          <ImagePlus size={16} aria-hidden="true" /> Erkin post
        </h3>
        <label className="field">
          <span>Matn</span>
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={6}
            maxLength={4096}
            placeholder={"🔴 Sarlavha\n\nMatn…\n\n#MUFC #ManUtd\n👉 @red_devils_uzb"}
            disabled={posting || !configured}
          />
        </label>
        <div className="channel-compose__row">
          <label className="field channel-compose__file">
            <span>Rasm (ixtiyoriy, 5 MB gacha)</span>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" disabled={posting || !configured} />
          </label>
          <label className="channel-compose__check">
            <input
              type="checkbox"
              checked={postHtml}
              onChange={(e) => setPostHtml(e.target.checked)}
              disabled={posting || !configured}
            />
            Matnda HTML teglar bor (&lt;b&gt;, &lt;a&gt;)
          </label>
          <button type="submit" className="btn btn--primary" disabled={posting || !configured}>
            <Send size={15} aria-hidden="true" />
            {posting ? "Yuborilmoqda…" : "Kanalga yuborish"}
          </button>
        </div>
        {postMsg && <p className={`form__msg ${postMsg.ok ? "ok" : "err"}`}>{postMsg.text}</p>}
      </form>

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
