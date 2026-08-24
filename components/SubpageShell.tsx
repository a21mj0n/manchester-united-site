import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  title: string;
  sub?: string;
  /** Bosh sahifadagi tegishli bo'lim (masalan "/#matches") */
  backHref?: string;
  children: React.ReactNode;
}

/** Ichki sahifalar uchun umumiy qobiq: orqaga havola + sarlavha. */
export default function SubpageShell({ title, sub, backHref = "/", children }: Props) {
  return (
    <main className="subpage">
      <div className="container">
        <Link href={backHref} className="watch__back">
          <ArrowLeft size={16} aria-hidden="true" />
          Bosh sahifaga qaytish
        </Link>

        <div className="section__head">
          <h1 className="section__title">{title}</h1>
          {sub && <p className="section__sub">{sub}</p>}
        </div>

        {children}
      </div>
    </main>
  );
}
