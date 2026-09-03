import type { Metadata } from "next";
import Link from "next/link";

import AdminNav from "@/components/admin/AdminNav";
import OrdersTable from "@/components/admin/OrdersTable";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, getOrderStats, getOrders } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Buyurtmalar — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const [orders, counts] = await Promise.all([getOrders(status), getOrderStats()]);

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Buyurtmalar</h1>
          <p className="admin__sub">
            Jami {counts.all} ta · {counts.new} tasi yangi
          </p>
        </div>
        <AdminNav current="/admin/orders" />
      </header>

      <nav className="filters">
        <Link href="/admin/orders" className={`chip${status === "all" ? " is-active" : ""}`}>
          Barchasi<span className="chip__count">{counts.all}</span>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`chip${status === s ? " is-active" : ""}`}
          >
            {ORDER_STATUS_LABELS[s]}
            <span className="chip__count">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="admin__empty">
          {status === "all" ? "Hali buyurtma kelmagan." : "Bu holatda buyurtma yo'q."}
        </p>
      ) : (
        <OrdersTable
          orders={orders.map((o) => ({
            id: o.id,
            productName: o.productName,
            price: o.price,
            size: o.size,
            qty: o.qty,
            name: o.name,
            contact: o.contact,
            city: o.city,
            note: o.note,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
          }))}
        />
      )}
    </main>
  );
}
