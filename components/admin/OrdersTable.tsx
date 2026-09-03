"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatTashkentDate } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/shop-constants";

interface OrderRow {
  id: number;
  productName: string;
  price: number;
  size: string;
  qty: number;
  name: string;
  contact: string;
  city: string;
  note: string;
  status: string;
  createdAt: string;
}

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Har holatdan keyingi mantiqiy qadamlar */
const NEXT: Record<string, OrderStatus[]> = {
  new: ["contacted", "cancelled"],
  contacted: ["paid", "cancelled"],
  paid: ["delivered", "cancelled"],
  delivered: [],
  cancelled: ["new"],
};

export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);

  async function changeStatus(id: number, status: OrderStatus) {
    setBusy(id);
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="table-wrap">
      <table className="table admin-table orders-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="orders-table__left">Mahsulot</th>
            <th className="orders-table__left">Mijoz</th>
            <th>Summa</th>
            <th>Holat</th>
            <th>Sana</th>
            <th>Amal</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={busy === o.id ? "is-busy" : ""}>
              <td>{o.id}</td>
              <td className="orders-table__left">
                <strong>{o.productName}</strong>
                <div className="orders-table__meta">
                  {o.size && <span>{o.size} · </span>}
                  {o.qty} dona
                </div>
              </td>
              <td className="orders-table__left">
                <strong>{o.name}</strong>
                <div className="orders-table__meta">{o.contact} · {o.city}</div>
                {o.note && <div className="orders-table__note">{o.note}</div>}
              </td>
              <td>{fmt(o.price * o.qty)}</td>
              <td>
                <span className={`pill pill--order-${o.status}`}>
                  {ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                </span>
              </td>
              <td className="admin-table__date">{formatTashkentDate(o.createdAt)}</td>
              <td>
                <div className="admin-table__actions">
                  {(NEXT[o.status] ?? ORDER_STATUSES).map((s) => (
                    <button
                      key={s}
                      className={`mini${s === "cancelled" ? " mini--no" : " mini--ok"}`}
                      disabled={busy === o.id}
                      onClick={() => changeStatus(o.id, s)}
                    >
                      {ORDER_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
