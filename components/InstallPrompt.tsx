"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "rduz-install-dismissed";

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // localStorage yopiq bo'lsa ham banner ishlayveradi
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setInstallEvent(null);
    setShowIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // saqlanmasa keyingi tashrifda yana ko'rinadi
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  };

  if (!installEvent && !showIosHint) return null;

  return (
    <div className="install-banner" role="dialog" aria-label="Ilovani o'rnatish">
      <img
        className="install-banner__icon"
        src="/icons/icon-192.png"
        alt=""
        width={44}
        height={44}
      />
      <div className="install-banner__text">
        <strong>Red Devils UZ</strong>
        {installEvent ? (
          <span>Saytni telefoningizga ilova sifatida o'rnating</span>
        ) : (
          <span>Safari'da «Ulashish» → «Bosh ekranga qo'shish»</span>
        )}
      </div>
      {installEvent && (
        <button className="btn btn--primary install-banner__btn" onClick={install}>
          <Download size={16} aria-hidden="true" />
          O'rnatish
        </button>
      )}
      <button
        className="install-banner__close"
        aria-label="Yopish"
        onClick={dismiss}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
