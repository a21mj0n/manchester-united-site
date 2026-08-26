interface Props {
  label: string;
  a: number;
  b: number;
  /** Raqam o'rniga ko'rsatiladigan matn (masalan "78%") */
  aText?: string;
  bText?: string;
  /** true — kam bo'lgani yaxshi (kartochkalar, o'tkazilgan gollar) */
  lowerIsBetter?: boolean;
}

/**
 * "Arqon tortish" ko'rinishidagi ikki tomonlama taqqoslash chizig'i:
 * markazdan chapga A, o'ngga B cho'ziladi, yetakchi tomon yorqin.
 */
export default function StatBar({ label, a, b, aText, bText, lowerIsBetter }: Props) {
  const total = a + b;
  const shareA = total > 0 ? (a / total) * 100 : 0;
  const shareB = total > 0 ? (b / total) * 100 : 0;

  const aWins = lowerIsBetter ? a < b : a > b;
  const bWins = lowerIsBetter ? b < a : b > a;

  return (
    <div className="statbar">
      <b className={`statbar__val${aWins ? " is-win" : ""}`}>{aText ?? a}</b>
      <div className="statbar__track statbar__track--a">
        <span
          className={aWins ? "is-win" : undefined}
          style={{ width: `${shareA}%` }}
        />
      </div>
      <span className="statbar__label">{label}</span>
      <div className="statbar__track statbar__track--b">
        <span
          className={bWins ? "is-win" : undefined}
          style={{ width: `${shareB}%` }}
        />
      </div>
      <b className={`statbar__val${bWins ? " is-win" : ""}`}>{bText ?? b}</b>
    </div>
  );
}
