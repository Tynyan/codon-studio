import type { Orf } from "../lib/genetics";
import { cx } from "../lib/cx";

const FRAME_COLORS: Record<number, string> = {
  1: "#c8ff5e",
  2: "#77e6b2",
  3: "#6ad7ff",
  4: "#b7a4ff",
  5: "#ff8ba0",
  6: "#ffd36e",
};

export function OrfMap({
  orfs,
  sequenceLength,
  selectedId,
  onSelect,
}: {
  orfs: Orf[];
  sequenceLength: number;
  selectedId: string | null;
  onSelect: (orf: Orf) => void;
}) {
  const width = 1000;
  const height = 380;
  const left = 68;
  const right = 20;
  const laneHeight = 52;
  const top = 26;
  const plotWidth = width - left - right;
  const x = (position: number) => left + (position / Math.max(1, sequenceLength)) * plotWidth;
  const tickStep = niceTick(sequenceLength);

  return (
    <div className="orf-map">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Open reading frames across six reading frames">
        {Array.from({ length: 4 }, (_, index) => {
          const position = Math.round((sequenceLength / 3) * index);
          return (
            <g key={position}>
              <line x1={x(position)} x2={x(position)} y1={top - 8} y2={height - 30} className="orf-gridline" />
              <text x={x(position)} y={height - 12} textAnchor="middle" className="orf-axis-label">
                {position.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        {[1, 2, 3, 4, 5, 6].map((frame, laneIndex) => {
          const y = top + laneIndex * laneHeight + laneHeight / 2;
          const laneOrfs = orfs.filter((orf) => orf.frame === frame);
          const color = FRAME_COLORS[frame];
          return (
            <g key={frame}>
              <text x={12} y={y - 2} className="orf-frame-label" fill={color}>
                {frame <= 3 ? "+" : "−"}{((frame - 1) % 3) + 1}
              </text>
              <text x={12} y={y + 10} className="orf-strand-label">
                {frame <= 3 ? "forward" : "reverse"}
              </text>
              <line x1={left} x2={width - right} y1={y} y2={y} className="orf-baseline" />
              {laneOrfs.map((orf) => {
                const selected = orf.id === selectedId;
                const barX = x(orf.start);
                const barWidth = Math.max(2, x(orf.end) - barX);
                return (
                  <g
                    key={orf.id}
                    className={cx("orf-hit", selected && "is-selected")}
                    onClick={() => onSelect(orf)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(orf);
                      }
                    }}
                    aria-label={`Frame ${frame}, ${orf.lengthAa} amino acids, ${orf.start + 1} to ${orf.end}`}
                  >
                    <title>{`Frame ${frame} · ${orf.lengthAa} aa · ${orf.start + 1}–${orf.end}`}</title>
                    <rect
                      x={barX}
                      y={y - (selected ? 7 : 4)}
                      width={barWidth}
                      height={selected ? 14 : 8}
                      rx={3}
                      fill={color}
                      opacity={selected ? 1 : 0.56}
                    />
                    <path
                      d={`M${barX} ${y - 10} l5 0 l-2.5 -5 z`}
                      fill={color}
                      opacity={selected ? 1 : 0.7}
                    />
                    <line
                      x1={x(orf.end)}
                      x2={x(orf.end)}
                      y1={y - 8}
                      y2={y + 8}
                      stroke={color}
                      opacity={selected ? 1 : 0.55}
                      strokeWidth={1.4}
                    />
                    {selected && (
                      <text x={barX + 5} y={y - 12} className="orf-hover-label" fill={color}>
                        {orf.lengthAa} aa
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {Array.from({ length: Math.floor(sequenceLength / tickStep) + 1 }, (_, index) => {
          const position = index * tickStep;
          if (position === 0) return null;
          return (
            <line
              key={`tick-${position}`}
              x1={x(position)}
              x2={x(position)}
              y1={height - 32}
              y2={height - 27}
              className="orf-axis-tick"
            />
          );
        })}
      </svg>
      <div className="orf-legend">
        {[1, 2, 3, 4, 5, 6].map((frame) => (
          <span key={frame}>
            <i style={{ background: FRAME_COLORS[frame] }} />
            {frame <= 3 ? "+" : "−"}{((frame - 1) % 3) + 1}
          </span>
        ))}
        <span className="orf-legend-note">start codon → stop codon</span>
      </div>
    </div>
  );
}

function niceTick(length: number): number {
  if (length > 3000) return 1000;
  if (length > 1000) return 500;
  if (length > 500) return 150;
  if (length > 200) return 100;
  return 50;
}
