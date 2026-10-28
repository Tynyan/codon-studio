import { useId, useMemo, useState, type PointerEvent } from "react";
import {
  AMINO_ACIDS,
  BASE_META,
  GROUP_META,
  type AminoAcidCode,
  type GcPoint,
  type HydropathyPoint,
  type Nucleotide,
} from "../lib/genetics";
import { aminoColor, hydropathyRegions } from "../lib/analysis";
import type { DomainAnnotation } from "../types";
import { cx } from "../lib/cx";

export function GcSparkline({
  points,
  className,
  height = 92,
}: {
  points: GcPoint[];
  className?: string;
  height?: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const width = 360;
  const pad = 5;
  const values = points.map((point) => point.gc);
  const min = Math.max(0, Math.min(...values) - 7);
  const max = Math.min(100, Math.max(...values) + 7);
  const span = Math.max(1, max - min);
  const x = (index: number) => pad + (index / Math.max(1, points.length - 1)) * (width - pad * 2);
  const y = (value: number) => pad + (1 - (value - min) / span) * (height - pad * 2);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.gc).toFixed(2)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(2)},${height - pad} L${x(0).toFixed(2)},${height - pad} Z`;
  const last = points[points.length - 1];

  if (!points.length) return <div className={cx("chart-placeholder", className)}>No GC data</div>;

  return (
    <svg
      className={cx("gc-sparkline", className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`GC content along the sequence, from ${values[0]?.toFixed(1)}% to ${last?.gc.toFixed(1)}%`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8ff5e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c8ff5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={width - pad} y1={y(50)} y2={y(50)} className="chart-rule" />
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} pathLength={1} className="gc-line" />
      {last && <circle cx={x(points.length - 1)} cy={y(last.gc)} r={2.6} className="gc-dot" />}
    </svg>
  );
}

export function BaseBars({
  bases,
  total,
  compact = false,
}: {
  bases: Record<Nucleotide, number>;
  total: number;
  compact?: boolean;
}) {
  return (
    <div className={cx("base-bars", compact && "base-bars--compact")}>
      {(Object.keys(BASE_META) as Nucleotide[]).map((base) => {
        const percent = total ? (bases[base] / total) * 100 : 0;
        return (
          <div className="base-row" key={base}>
            <span className="base-letter" style={{ color: BASE_META[base].color }}>
              {base}
            </span>
            <span className="base-track">
              <span
                className="base-fill"
                style={{ width: `${percent}%`, background: BASE_META[base].color }}
              />
            </span>
            <span className="base-value">{percent.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function HydropathyChart({
  points,
  selectedPosition,
  onHover,
  height = 210,
}: {
  points: HydropathyPoint[];
  selectedPosition?: number;
  onHover?: (position: number | null) => void;
  height?: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const width = 720;
  const padding = { left: 34, right: 14, top: 14, bottom: 24 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const domain = 5;
  const x = (index: number) => padding.left + (index / Math.max(1, points.length - 1)) * plotWidth;
  const y = (value: number) =>
    padding.top + ((domain - Math.max(-domain, Math.min(domain, value))) / (domain * 2)) * plotHeight;
  const zero = y(0);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.value).toFixed(2)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(2)},${zero.toFixed(2)} L${x(0).toFixed(2)},${zero.toFixed(2)} Z`;
  const selectedIndex = selectedPosition ? selectedPosition - 1 : -1;
  const selectedPoint = points[selectedIndex];
  const regions = useMemo(() => hydropathyRegions(points, 1.6, 8), [points]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? (selectedPoint ? selectedIndex : null);

  const handleMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relative = ((event.clientX - bounds.left) / bounds.width) * width;
    const index = Math.round(((relative - padding.left) / plotWidth) * (points.length - 1));
    const clamped = Math.max(0, Math.min(points.length - 1, index));
    setHoverIndex(clamped);
    onHover?.(clamped + 1);
  };

  if (!points.length) return <div className="chart-placeholder" style={{ height }}>No protein data</div>;

  return (
    <svg
      className="hydropathy-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Kyte-Doolittle hydropathy plot with a sliding window of nine residues"
      onPointerMove={handleMove}
      onPointerLeave={() => {
        setHoverIndex(null);
        onHover?.(null);
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd36e" stopOpacity="0.32" />
          <stop offset={`${(y(0) / height) * 100}%`} stopColor="#ffd36e" stopOpacity="0.03" />
          <stop offset={`${(y(0) / height) * 100}%`} stopColor="#6ad7ff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#6ad7ff" stopOpacity="0.26" />
        </linearGradient>
      </defs>

      {[-4, -2, 0, 2, 4].map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(tick)}
            y2={y(tick)}
            className={tick === 0 ? "chart-zero" : "chart-gridline"}
          />
          <text x={padding.left - 8} y={y(tick) + 3} textAnchor="end" className="chart-axis-label">
            {tick > 0 ? `+${tick}` : tick}
          </text>
        </g>
      ))}

      {regions.map((region, index) => (
        <rect
          key={`${region.start}-${index}`}
          x={x(region.start - 1)}
          y={padding.top}
          width={Math.max(2, x(region.end - 1) - x(region.start - 1))}
          height={plotHeight}
          className="hydropathy-region"
        />
      ))}

      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} className="hydropathy-line" />

      {activeIndex !== null && points[activeIndex] && (
        <g className="hydropathy-cursor">
          <line
            x1={x(activeIndex)}
            x2={x(activeIndex)}
            y1={padding.top}
            y2={padding.top + plotHeight}
          />
          <circle cx={x(activeIndex)} cy={y(points[activeIndex].value)} r={3.2} />
        </g>
      )}

      {[1, Math.round(points.length / 2), points.length].map((position) => (
        <text
          key={position}
          x={x(Math.max(0, position - 1))}
          y={height - 7}
          textAnchor="middle"
          className="chart-axis-label"
        >
          {position}
        </text>
      ))}
    </svg>
  );
}

export function DomainTrack({
  domains,
  length,
  selectedPosition,
  onSelect,
}: {
  domains: DomainAnnotation[];
  length: number;
  selectedPosition?: number;
  onSelect?: (position: number) => void;
}) {
  return (
    <div className="domain-track-wrap">
      <div className="domain-track" role="img" aria-label="Protein domain map">
        {domains.map((domain) => {
          const left = ((domain.start - 1) / length) * 100;
          const width = Math.max(0.7, ((domain.end - domain.start + 1) / length) * 100);
          const isPoint = domain.end - domain.start < 4;
          return (
            <button
              key={`${domain.label}-${domain.start}`}
              type="button"
              className={cx("domain-segment", isPoint && "is-point")}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: domain.color,
              }}
              title={`${domain.label} · ${domain.start}${domain.end !== domain.start ? `–${domain.end}` : ""}`}
              onClick={() => onSelect?.(domain.start)}
            >
              {!isPoint && <span>{domain.short}</span>}
            </button>
          );
        })}
        {selectedPosition && (
          <span
            className="domain-cursor"
            style={{ left: `${((selectedPosition - 1) / length) * 100}%` }}
          />
        )}
      </div>
      <div className="domain-axis">
        <span>1</span>
        <span>{Math.round(length / 2)}</span>
        <span>{length} aa</span>
      </div>
      <div className="domain-legend">
        {domains.map((domain) => (
          <span key={`${domain.label}-legend-${domain.start}`} className="domain-legend-item">
            <i style={{ background: domain.color }} />
            {domain.label}
            <em>
              {domain.start}
              {domain.end !== domain.start ? `–${domain.end}` : ""}
            </em>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AminoComposition({
  counts,
  total,
  selected,
  onSelect,
}: {
  counts: Record<string, number>;
  total: number;
  selected?: string;
  onSelect?: (aa: string) => void;
}) {
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div className="aa-composition">
      {(Object.keys(AMINO_ACIDS) as AminoAcidCode[])
        .filter((code) => code !== "*")
        .map((code) => {
          const count = counts[code] ?? 0;
          const aa = AMINO_ACIDS[code];
          return (
            <button
              key={code}
              type="button"
              className={cx("aa-bar-row", selected === code && "is-active")}
              onClick={() => onSelect?.(code)}
              title={`${aa.nameZh} · ${count} residues`}
            >
              <span className="aa-bar-code" style={{ color: aminoColor(code) }}>
                {code}
              </span>
              <span className="aa-bar-name">{aa.three}</span>
              <span className="aa-bar-track">
                <span
                  className="aa-bar-fill"
                  style={{
                    width: `${(count / max) * 100}%`,
                    background: aminoColor(code),
                  }}
                />
              </span>
              <span className="aa-bar-count">{count}</span>
              <span className="aa-bar-percent">{total ? ((count / total) * 100).toFixed(1) : "0.0"}%</span>
            </button>
          );
        })}
    </div>
  );
}

export function GroupLegend({ className }: { className?: string }) {
  return (
    <div className={cx("group-legend", className)}>
      {(Object.keys(GROUP_META) as Array<keyof typeof GROUP_META>).map((group) => (
        <span key={group} className="group-legend-item">
          <i style={{ background: GROUP_META[group].color }} />
          {GROUP_META[group].labelZh}
        </span>
      ))}
    </div>
  );
}
