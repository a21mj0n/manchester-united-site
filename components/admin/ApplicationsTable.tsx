"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatTashkentDate } from "@/lib/format";
import { STATUS_LABELS, type Status } from "@/lib/status";

interface Application {
  id: number;
  name: string;
  city: string;
  contact: string;
  since: number | null;
  status: string;
  createdAt: string;
}

export default function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const visible = query.trim()
    ? applications.filter((a) =>
        [a.name, a.city, a.contact].join(" ").toLowerCase().includes(query.toLowerCase()),
      )
    : applications;

  async function changeStatus(id: number, status: Status) {
    setBusyId(id);
    setError("");

    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "O'zgartirib bo'lmadi.");
        return;
      }

      startTransition(() => router.refresh());
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <input
        type="search"
        className="admin__search"
        placeholder="Ism, shahar yoki aloqa bo'yicha qidirish…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="form__msg err">{error}</p>}

      <div className="table-wrap">
        <table className="table admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="ta-left">Ism</th>
              <th className="ta-left">Shahar</th>
              <th className="ta-left">Aloqa</th>
              <th>Muxlis</th>
              <th>Sana</th>
              <th>Holat</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className={busyId === a.id || isPending ? "is-busy" : undefined}>
                <td className="rank">{a.id}</td>
                <td className="ta-left"><b>{a.name}</b></td>
                <td className="ta-left">{a.city}</td>
                <td className="ta-left">{a.contact}</td>
                <td>{a.since ?? "—"}</td>
                <td className="admin-table__date">
                  {formatTashkentDate(a.createdAt)}
                </td>
                <td>
                  <span className={`pill pill--${a.status}`}>
                    {STATUS_LABELS[a.status as Status] ?? a.status}
                  </span>
                </td>
                <td>
                  <div className="admin-table__actions">
                    {a.status !== "approved" && (
                      <button
                        className="mini mini--ok"
                        onClick={() => changeStatus(a.id, "approved")}
                        disabled={busyId === a.id}
                      >
                        Qabul
                      </button>
                    )}
                    {a.status !== "rejected" && (
                      <button
                        className="mini mini--no"
                        onClick={() => changeStatus(a.id, "rejected")}
                        disabled={busyId === a.id}
                      >
                        Rad
                      </button>
                    )}
                    {a.status !== "new" && (
                      <button
                        className="mini"
                        onClick={() => changeStatus(a.id, "new")}
                        disabled={busyId === a.id}
                      >
                        Qaytarish
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <p className="admin__empty">Qidiruv bo'yicha hech narsa topilmadi.</p>
      )}
    </>
  );
}
