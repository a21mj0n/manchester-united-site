import SubpageShell from "@/components/SubpageShell";

/** O'yinlar ro'yxati yuklanayotganda skelet. */
export default function Loading() {
  return (
    <SubpageShell title="O'yinlar" backHref="/#matches">
      <div className="skeleton-row" style={{ width: "60%" }} />
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </SubpageShell>
  );
}
