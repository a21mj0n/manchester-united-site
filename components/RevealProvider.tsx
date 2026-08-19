"use client";

import { useEffect } from "react";

/**
 * Sahifadagi barcha `.reveal` bloklarini kuzatadi va ko'rinish
 * maydoniga kirganda `.is-visible` klassini qo'shadi.
 * MutationObserver — filtrdan keyin qo'shilgan yangi bloklar uchun.
 */
export default function RevealProvider() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );

    const observeAll = () =>
      document
        .querySelectorAll(".reveal:not(.is-visible)")
        .forEach((el) => io.observe(el));

    observeAll();

    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
