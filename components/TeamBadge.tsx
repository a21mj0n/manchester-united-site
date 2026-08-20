/**
 * Jamoa gerbi. Havola bo'lmasa nom bosh harflari ko'rsatiladi —
 * shu tariqa Premer-ligadan tashqari jamoalar ham chiroyli chiqadi.
 */
export default function TeamBadge({
  badge,
  team,
  size = 26,
}: {
  badge?: string | null;
  team: string;
  size?: number;
}) {
  if (badge) {
    return (
      /* Optimizatsiya serverni yuklamasligi uchun oddiy img */
      <img
        className="badge-img"
        src={badge}
        alt=""
        width={size}
        height={size}
        loading="lazy"
      />
    );
  }

  const initials = team
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <i className="badge-fallback" style={{ width: size, height: size }}>
      {initials}
    </i>
  );
}
