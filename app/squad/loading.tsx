import SubpageShell from "@/components/SubpageShell";

/** Tarkib yuklanayotganda skelet. */
export default function Loading() {
  return (
    <SubpageShell title="Jamoa tarkibi" backHref="/#squad">
      <div className="skeleton-row" style={{ width: "50%" }} />
      <div className="squad-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="skeleton-card skeleton-card--player" key={i} />
        ))}
      </div>
    </SubpageShell>
  );
}
