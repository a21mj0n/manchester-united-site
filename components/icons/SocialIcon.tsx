import { Instagram, Telegram, YouTube } from "./Brands";
import type { SocialKey } from "@/config/social";

const ICONS = { telegram: Telegram, instagram: Instagram, youtube: YouTube } as const;

/** Tarmoq kalitiga mos brend logotipi */
export default function SocialIcon({ network, size = 18 }: { network: SocialKey; size?: number }) {
  const Icon = ICONS[network];
  return <Icon size={size} />;
}
