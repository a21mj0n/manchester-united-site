"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatTashkentDate } from "@/lib/format";

interface LogRow {
  id: number;
  startedAt: string;
  ok: boolean;
  finished: boolean;
  details: string;
}

interface Section {
  section: string;
  ok: boolean;
  count: number;
  message: string;
}

function parseSections(details: string): Section[] {
  try {
    const parsed = JSON.parse(details);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SyncPanel({ logs }: { logs: LogRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function runNow() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      if (!res.ok && res.status !== 207) {
        setError("Sinxronizatsiya ishga tushmadi.");
        return;
      }
      router.refresh();
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="news-admin__bar">
        <button className="btn btn--primary" onClick={runNow} disabled={pending}>
          {pending ? "Yangilanmoqda… (1 daqiqagacha)" : "Hozir yangilash"}
        </button>
        {error && <p className="form__msg err">{error}</p>}
      </div>

      {logs.length === 0 ? (
        <p className="admin__empty">
          Hali sinxronizatsiya bo&apos;lmagan. Har kuni ertalab avtomatik ishga tushadi.
        </p>
      ) : (
        <div className="sync-logs">
          {logs.map((log) => {
            const sections = parseSections(log.details);
            return (
              <article key={log.id} className={`sync-log${log.ok ? "" : " is-partial"}`}>
                <div className="sync-log__head">
                  <span className={`pill ${log.ok ? "pill--w" : "pill--l"}`}>
                    {log.finished ? (log.ok ? "Muvaffaqiyatli" : "Qisman") : "Tugallanmagan"}
                  </span>
                  <span className="sync-log__time">
                    {formatTashkentDate(log.startedAt)}
                  </span>
                </div>
                {sections.length > 0 && (
                  <ul className="sync-log__sections">
                    {sections.map((s) => (
                      <li key={s.section} className={s.ok ? "" : "is-failed"}>
                        <b>{s.section}</b>
                        <span>{s.count}</span>
                        {s.message && <small>{s.message}</small>}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
