import SubpageShell from "@/components/SubpageShell";

/** O'yin tafsilotlari yuklanayotganda skelet. */
export default function Loading() {
  return (
    <SubpageShell title="O'yin tafsilotlari" backHref="/matches">
      <div className="skeleton-card skeleton-card--tall" />
      <div className="skeleton-row" style={{ width: "40%" }} />
      {Array.from({ length: 4 }, (_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </SubpageShell>
  );
}
