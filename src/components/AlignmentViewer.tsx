import type { CSSProperties } from "react";
import { aminoColor } from "../lib/analysis";
import type { MsaResult, OrthologSpecies } from "../lib/evolution";
import { cx } from "../lib/cx";

const CELL = 6.5;

export function AlignmentViewer({
  msa,
  selectedColumn,
  selectedSpecies,
  showDifferences,
  onSelectColumn,
  onSelectSpecies,
}: {
  msa: MsaResult;
  selectedColumn: number;
  selectedSpecies: string;
  showDifferences: boolean;
  onSelectColumn: (index: number) => void;
  onSelectSpecies: (id: string) => void;
}) {
  const count = msa.columns.length;
  const humanRow = msa.rows.human;
  const gridTemplateColumns = `92px repeat(${count}, ${CELL}px)`;
  const rulerStyle = { width: count * CELL, marginLeft: 92 } as CSSProperties;

  return (
    <div className="alignment-wrap">
      <div className="alignment-scale" style={rulerStyle} aria-hidden="true">
        {[1, 25, 50, 75, 100, 125, 147].map((position) => {
          const column = msa.columns.find((item) => item.humanPosition === position);
          if (!column) return null;
          return (
            <span key={position} style={{ left: `${(column.id / Math.max(1, count - 1)) * 100}%` }}>
              {position}
            </span>
          );
        })}
      </div>

      <div className="alignment-scroller">
        <div className="alignment-table">
          <div className="alignment-row alignment-conservation-row" style={{ gridTemplateColumns }}>
            <div className="alignment-label alignment-label--head">
              <span>CONSERVATION</span>
              <em>modal residue</em>
            </div>
            <div className="alignment-conservation-cells">
              {msa.columns.map((column) => (
                <button
                  key={column.id}
                  type="button"
                  className={cx("conservation-bar", column.id === selectedColumn && "is-selected")}
                  style={{ height: `${4 + column.conservation * 11}px` }}
                  onClick={() => onSelectColumn(column.id)}
                  title={`Column ${column.id + 1} · ${(column.conservation * 100).toFixed(0)}% conserved`}
                  aria-label={`Column ${column.id + 1}, ${(column.conservation * 100).toFixed(0)} percent conserved`}
                  tabIndex={-1}
                />
              ))}
            </div>
          </div>

          {msa.species.map((species) => (
            <AlignmentRow
              key={species.id}
              species={species}
              row={msa.rows[species.id]}
              humanRow={humanRow}
              columns={msa.columns}
              selectedColumn={selectedColumn}
              selected={selectedSpecies === species.id}
              showDifferences={showDifferences}
              gridTemplateColumns={gridTemplateColumns}
              onSelectColumn={onSelectColumn}
              onSelectSpecies={onSelectSpecies}
            />
          ))}
        </div>
      </div>

      <div className="alignment-caption">
        <span><i className="alignment-swatch alignment-swatch--diff" /> differs from human</span>
        <span><i className="alignment-swatch alignment-swatch--gap" /> gap / insertion</span>
        <span className="alignment-caption-end">HBB reference · 147 aa</span>
      </div>
    </div>
  );
}

function AlignmentRow({
  species,
  row,
  humanRow,
  columns,
  selectedColumn,
  selected,
  showDifferences,
  gridTemplateColumns,
  onSelectColumn,
  onSelectSpecies,
}: {
  species: OrthologSpecies;
  row: string;
  humanRow: string;
  columns: MsaResult["columns"];
  selectedColumn: number;
  selected: boolean;
  showDifferences: boolean;
  gridTemplateColumns: string;
  onSelectColumn: (index: number) => void;
  onSelectSpecies: (id: string) => void;
}) {
  return (
    <div className={cx("alignment-row", selected && "is-species-selected")} style={{ gridTemplateColumns }}>
      <button
        type="button"
        className="alignment-label"
        onClick={() => onSelectSpecies(species.id)}
        title={`${species.commonNameZh} · ${species.latin}`}
      >
        <span className="alignment-label-dot" style={{ background: species.color }} />
        <span>
          <strong>{species.commonNameZh}</strong>
          <em>{species.commonName}</em>
        </span>
      </button>
      <div className="alignment-cells">
        {columns.map((column, index) => {
          const residue = row[index] ?? "-";
          const humanResidue = humanRow[index] ?? "-";
          const differs = residue !== "-" && humanResidue !== "-" && residue !== humanResidue;
          return (
            <span
              key={column.id}
              className={cx(
                "alignment-residue",
                residue === "-" && "is-gap",
                differs && showDifferences && "is-diff",
                index === selectedColumn && "is-column-selected",
              )}
              style={{ "--residue-color": residue === "-" ? "#4c5a50" : aminoColor(residue) } as CSSProperties}
              title={`${species.commonNameZh} · HBB ${column.humanPosition ?? "insertion"} · ${residue}`}
              onClick={() => {
                onSelectColumn(index);
                onSelectSpecies(species.id);
              }}
            >
              {residue === "-" ? "·" : residue}
            </span>
          );
        })}
      </div>
    </div>
  );
}
