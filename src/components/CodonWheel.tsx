import { useState } from "react";
import {
  AA_TO_CODONS,
  AMINO_ACIDS,
  AMINO_ACID_ORDER,
  GROUP_META,
  HUMAN_CODON_USAGE,
  type AminoAcidCode,
} from "../lib/genetics";
import { aminoColor } from "../lib/analysis";

interface Wedge {
  codon: string;
  aa: AminoAcidCode;
  start: number;
  end: number;
  mid: number;
  fraction: number;
  count: number;
}

const SIZE = 640;
const CENTER = SIZE / 2;
const OUTER = 278;
const INNER = 142;
const LABEL_RADIUS = 262;
const AA_RADIUS = 299;

function polar(radius: number, angle: number): [number, number] {
  return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)];
}

function wedgePath(start: number, end: number): string {
  const [x1, y1] = polar(OUTER, start);
  const [x2, y2] = polar(OUTER, end);
  const [x3, y3] = polar(INNER, end);
  const [x4, y4] = polar(INNER, start);
  return `M ${x1} ${y1} A ${OUTER} ${OUTER} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${INNER} ${INNER} 0 0 0 ${x4} ${y4} Z`;
}

function ringPath(start: number, end: number, radius: number, width: number): string {
  const outer = radius + width / 2;
  const inner = radius - width / 2;
  const [x1, y1] = polar(outer, start);
  const [x2, y2] = polar(outer, end);
  const [x3, y3] = polar(inner, end);
  const [x4, y4] = polar(inner, start);
  return `M ${x1} ${y1} A ${outer} ${outer} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 0 0 ${x4} ${y4} Z`;
}

export function CodonWheel({
  selectedCodon,
  onSelect,
  counts,
}: {
  selectedCodon: string;
  onSelect: (codon: string) => void;
  counts: Record<string, number>;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const activeCodon = hovered ?? selectedCodon;
  const activeAa = AMINO_ACIDS[(HUMAN_CODON_USAGE[activeCodon]?.aminoAcid ?? "M") as AminoAcidCode];
  const activeUsage = HUMAN_CODON_USAGE[activeCodon];
  const step = (Math.PI * 2) / 64;
  const gap = 0.011;

  const wedges: Wedge[] = [];
  const aminoGroups: Array<{ aa: AminoAcidCode; codons: string[] }> = [
    ...AMINO_ACID_ORDER.map((aa) => ({ aa, codons: AA_TO_CODONS[aa] ?? [] })),
    { aa: "*" as AminoAcidCode, codons: AA_TO_CODONS["*"] ?? [] },
  ];

  let codonIndex = 0;
  for (const group of aminoGroups) {
    for (const codon of group.codons) {
      const start = -Math.PI / 2 + codonIndex * step + gap / 2;
      const end = -Math.PI / 2 + (codonIndex + 1) * step - gap / 2;
      wedges.push({
        codon,
        aa: group.aa,
        start,
        end,
        mid: (start + end) / 2,
        fraction: HUMAN_CODON_USAGE[codon]?.fraction ?? 0,
        count: counts[codon] ?? 0,
      });
      codonIndex += 1;
    }
  }

  const aaCenters = aminoGroups.map((group) => {
    const indexes = group.codons.map((codon) => wedges.find((wedge) => wedge.codon === codon)?.mid ?? 0);
    const angle =
      indexes.length === 1
        ? indexes[0]
        : Math.atan2(
            indexes.reduce((sum, value) => sum + Math.sin(value), 0),
            indexes.reduce((sum, value) => sum + Math.cos(value), 0),
          );
    return { aa: group.aa, angle };
  });

  const usedCount = Object.values(counts).filter((count) => count > 0).length;

  return (
    <div className="codon-wheel">
      <svg
        className="codon-wheel-svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="group"
        aria-label="Codon usage wheel. Each wedge is a codon; wedge opacity shows human usage, and a lime ring marks codons used by this gene."
      >
        <circle cx={CENTER} cy={CENTER} r={OUTER + 10} className="wheel-halo" />
        <circle cx={CENTER} cy={CENTER} r={OUTER + 2} className="wheel-rim" />
        <circle cx={CENTER} cy={CENTER} r={INNER - 9} className="wheel-inner-rim" />

        {wedges.map((wedge) => {
          const used = wedge.count > 0;
          const selected = selectedCodon === wedge.codon;
          const hover = hovered === wedge.codon;
          const color = aminoColor(wedge.aa);
          const aa = AMINO_ACIDS[wedge.aa];
          const labelDeg = (wedge.mid * 180) / Math.PI + 90;
          const uprightDeg = labelDeg > 90 && labelDeg < 270 ? labelDeg - 180 : labelDeg;
          const [labelX, labelY] = polar(LABEL_RADIUS, wedge.mid);
          const [dotX, dotY] = polar(INNER - 18, wedge.mid);
          return (
            <g
              key={wedge.codon}
              className={`codon-wedge ${selected ? "is-selected" : ""} ${hover ? "is-hovered" : ""} ${used ? "is-used" : ""}`}
              onClick={() => onSelect(wedge.codon)}
              onMouseEnter={() => setHovered(wedge.codon)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(wedge.codon)}
              onBlur={() => setHovered(null)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(wedge.codon);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${wedge.codon}, ${aa.nameZh}, human usage ${(wedge.fraction * 100).toFixed(0)}%, this gene ${wedge.count}`}
            >
              <path
                d={wedgePath(wedge.start, wedge.end)}
                fill={color}
                style={{ fillOpacity: 0.055 + wedge.fraction * 0.4 }}
              />
              {used && (
                <path
                  d={ringPath(wedge.start, wedge.end, INNER - 24, 5)}
                  fill="#c8ff5e"
                  style={{ opacity: Math.min(0.95, 0.32 + wedge.count * 0.09) }}
                />
              )}
              <circle cx={dotX} cy={dotY} r={used ? 2.2 : 1.2} fill={used ? "#c8ff5e" : color} opacity={used ? 1 : 0.45} />
              <text
                x={labelX}
                y={labelY}
                transform={`rotate(${uprightDeg} ${labelX} ${labelY})`}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`codon-label ${used ? "is-used" : ""} ${selected ? "is-selected" : ""}`}
              >
                {wedge.codon}
              </text>
            </g>
          );
        })}

        {aaCenters.map(({ aa, angle }) => {
          const [x, y] = polar(AA_RADIUS, angle);
          const deg = (angle * 180) / Math.PI + 90;
          const upright = deg > 90 && deg < 270 ? deg - 180 : deg;
          return (
            <text
              key={aa}
              x={x}
              y={y}
              transform={`rotate(${upright} ${x} ${y})`}
              textAnchor="middle"
              dominantBaseline="middle"
              className="wheel-aa-label"
              fill={aa === "*" ? "#78857c" : GROUP_META[AMINO_ACIDS[aa].group].color}
            >
              {aa === "*" ? "∗" : aa}
            </text>
          );
        })}

        {aminoGroups.slice(0, -1).map((group) => {
          const first = wedges.find((wedge) => wedge.codon === group.codons[0]);
          if (!first) return null;
          const [x1, y1] = polar(OUTER + 2, first.start);
          const [x2, y2] = polar(OUTER + 9, first.start);
          return <line key={`sep-${group.aa}`} x1={x1} y1={y1} x2={x2} y2={y2} className="wheel-separator" />;
        })}

        <circle cx={CENTER} cy={CENTER} r={97} className="wheel-core-bg" />
        <text x={CENTER} y={CENTER - 46} textAnchor="middle" className="wheel-core-kicker">
          HUMAN USAGE
        </text>
        <text x={CENTER} y={CENTER + 12} textAnchor="middle" className="wheel-core-codon">
          {activeCodon}
        </text>
        <text x={CENTER} y={CENTER + 38} textAnchor="middle" className="wheel-core-aa">
          {activeAa.three} · {activeAa.nameZh}
        </text>
        <text x={CENTER} y={CENTER + 60} textAnchor="middle" className="wheel-core-meta">
          {((activeUsage?.fraction ?? 0) * 100).toFixed(0)}% of {activeAa.three} codons
        </text>
        <text x={CENTER} y={CENTER + 76} textAnchor="middle" className="wheel-core-meta">
          {counts[activeCodon] ?? 0}× in this gene
        </text>

        <text x={CENTER} y={24} textAnchor="middle" className="wheel-outer-label">
          64 CODONS · 20 AMINO ACIDS · 1 STANDARD CODE
        </text>
        <text x={CENTER} y={SIZE - 12} textAnchor="middle" className="wheel-outer-label">
          {usedCount} / 64 codons used
        </text>
      </svg>
    </div>
  );
}
