import Link from "next/link";

import LogoutButton from "./LogoutButton";

const ITEMS = [
  { href: "/admin", label: "Arizalar" },
  { href: "/admin/squad", label: "Tarkib" },
  { href: "/admin/news", label: "Yangiliklar" },
  { href: "/admin/sync", label: "Sinxronizatsiya" },
  { href: "/admin/stream", label: "Efir" },
  { href: "/admin/support", label: "Donat" },
  { href: "/admin/stats", label: "Statistika" },
  { href: "/admin/shop", label: "Do'kon" },
  { href: "/admin/orders", label: "Buyurtmalar" },
];

/** Admin sahifalari sarlavhasidagi bo'limlar ro'yxati. Joriy sahifa ko'rsatilmaydi. */
export default function AdminNav({ current }: { current: string }) {
  return (
    <div className="admin__actions">
      {ITEMS.filter((i) => i.href !== current).map((i) => (
        <Link key={i.href} href={i.href} className="btn btn--ghost">
          {i.label}
        </Link>
      ))}
      <Link href="/" className="btn btn--ghost">Saytga</Link>
      <LogoutButton />
    </div>
  );
}
