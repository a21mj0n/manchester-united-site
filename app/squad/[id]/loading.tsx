import SubpageShell from "@/components/SubpageShell";

/** Futbolchi statistikasi yuklanayotganda skelet. */
export default function Loading() {
  return (
    <SubpageShell title="Futbolchi statistikasi" backHref="/squad">
      <div className="skeleton-card" />
      <div className="skeleton-card skeleton-card--tall" />
    </SubpageShell>
  );
}
