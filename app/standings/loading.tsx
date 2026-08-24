import SubpageShell from "@/components/SubpageShell";

/** Turnir jadvali yuklanayotganda skelet. */
export default function Loading() {
  return (
    <SubpageShell title="Turnir jadvali" backHref="/#table">
      <div className="skeleton-row" style={{ width: "45%" }} />
      <div className="skeleton-card skeleton-card--tall" />
    </SubpageShell>
  );
}
