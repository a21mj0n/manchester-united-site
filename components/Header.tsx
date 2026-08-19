"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#news", label: "Yangiliklar" },
  { href: "#matches", label: "O'yinlar" },
  { href: "#squad", label: "Tarkib" },
  { href: "#table", label: "Jadval" },
  { href: "#history", label: "Tarix" },
  { href: "#legends", label: "Afsonalar" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("section[id]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Mobil menyu ochiq bo'lganda sahifa skroli bloklanadi
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    return () => document.body.classList.remove("no-scroll");
  }, [open]);

  return (
    <header className={`header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container header__inner">
        <a href="#hero" className="logo">
          <Image
            src="/assets/crest.svg"
            alt="Red Devils Uzbekistan emblemasi"
            width={44}
            height={44}
            className="logo__img"
            style={{ height: "auto" }}
            priority
          />
          <span className="logo__text">
            <strong>RED DEVILS</strong>
            <small>Uzbekistan</small>
          </span>
        </a>

        <nav className={`nav${open ? " is-open" : ""}`}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`nav__link${active === l.href.slice(1) ? " is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#fanclub"
            className="nav__link nav__link--cta"
            onClick={() => setOpen(false)}
          >
            Fan-klub
          </a>
        </nav>

        <button
          className={`burger${open ? " is-open" : ""}`}
          aria-label="Menyu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
