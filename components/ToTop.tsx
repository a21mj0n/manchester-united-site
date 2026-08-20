"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      className={`to-top${visible ? " is-visible" : ""}`}
      aria-label="Yuqoriga"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  );
}
