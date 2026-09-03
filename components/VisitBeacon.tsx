"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Har sahifa ochilganda /api/hit ga kichik signal yuboradi.
 * sendBeacon sahifa yuklanishini kutmaydi va uni sekinlashtirmaydi.
 * Admin va login sahifalari sanalmaydi.
 */
// Dev rejimida React effektni ikki marta chaqiradi, bir sahifa ikki marta sanalmasin
let lastSent = "";

export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /^\/(admin|login)(\/|$)/.test(pathname)) return;
    if (pathname === lastSent) return;
    lastSent = pathname;

    const body = JSON.stringify({ path: pathname });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/hit", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // pastdagi fetch'ga o'tamiz
    }
    fetch("/api/hit", { method: "POST", body, keepalive: true }).catch(() => {});
  }, [pathname]);

  return null;
}
