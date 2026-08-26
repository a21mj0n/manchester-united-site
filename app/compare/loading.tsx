import SubpageShell from "@/components/SubpageShell";

/** Taqqoslash sahifasi yuklanayotganda skelet. */
export default function Loading() {
  return (
    <SubpageShell
      title="O'yinchilarni taqqoslash"
      sub="Ikki futbolchini tanlang — mavsum statistikasi yonma-yon"
      backHref="/squad"
    >
      <div className="skeleton-row" style={{ width: "60%" }} />
      <div className="skeleton-card skeleton-card--tall" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
    </SubpageShell>
  );
}
