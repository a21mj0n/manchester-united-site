import type { RadarAxis } from "@/lib/football/compare";

interface Props {
  axes: RadarAxis[];
  nameA: string;
  nameB: string;
}

const W = 560;
const H = 430;
const CX = W / 2;
const CY = 215;
const R = 140;
/** Yorliqlar radiusdan qancha tashqarida turadi */
const LABEL_GAP = 26;

function point(index: number, total: number, radius: number): [number, number] {
  // Birinchi o'q tepada, soat yo'nalishida
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius];
}

function polygonPoints(values: number[], radius: number): string {
  return values
    .map((v, i) => point(i, values.length, radius * Math.max(v, 0.03)).map((n) => n.toFixed(1)).join(","))
    .join(" ");
}

/**
 * Ikki futbolchining olti o'qli radar diagrammasi.
 * Sof SVG — client JS talab qilmaydi, server tomonda render bo'ladi.
 */
export default function RadarChart({ axes, nameA, nameB }: Props) {
  const n = axes.length;
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <figure className="radar-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${nameA} va ${nameB} taqqoslash diagrammasi`}
      >
        {/* To'r halqalari */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={polygonPoints(Array(n).fill(r), R)}
            fill="none"
            stroke="rgba(255,255,255,.09)"
            strokeWidth={1}
          />
        ))}

        {/* Markazdan o'qlar */}
        {axes.map((_, i) => {
          const [x, y] = point(i, n, R);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,.09)"
              strokeWidth={1}
            />
          );
        })}

        {/* Futbolchi poligonlari */}
        <polygon
          points={polygonPoints(axes.map((a) => a.a), R)}
          fill="rgba(218,41,28,.30)"
          stroke="#DA291C"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polygon
          points={polygonPoints(axes.map((a) => a.b), R)}
          fill="rgba(251,225,34,.18)"
          stroke="#FBE122"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* O'q yorliqlari va qiymatlar */}
        {axes.map((a, i) => {
          const [x, y] = point(i, n, R + LABEL_GAP);
          const anchor = Math.abs(x - CX) < 8 ? "middle" : x > CX ? "start" : "end";
          return (
            <text key={a.label} x={x} y={y} textAnchor={anchor} className="radar-label">
              <tspan x={x}>{a.label}</tspan>
              <tspan x={x} dy={15}>
                <tspan className="radar-val radar-val--a">{a.aText}</tspan>
                <tspan className="radar-vs"> · </tspan>
                <tspan className="radar-val radar-val--b">{a.bText}</tspan>
              </tspan>
            </text>
          );
        })}
      </svg>

      <figcaption className="radar-legend">
        <span>
          <i className="radar-dot radar-dot--a" /> {nameA}
        </span>
        <span>
          <i className="radar-dot radar-dot--b" /> {nameB}
        </span>
      </figcaption>
    </figure>
  );
}
