"use client";

import { useEffect, useRef, useState } from "react";

/** Ko'rinish maydoniga kirganda 0 dan `to` gacha sanaydi. */
export default function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const duration = 1400;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();

        let start: number | null = null;
        const step = (ts: number) => {
          if (start === null) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          setValue(Math.floor((1 - Math.pow(1 - p, 3)) * to));
          if (p < 1) raf = requestAnimationFrame(step);
          else setValue(to);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return <b ref={ref}>{value}</b>;
}
