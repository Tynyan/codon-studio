import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  GitBranch,
  Info,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { buildEvolutionAnalysis } from "../lib/evolution";
import type { MsaColumn } from "../lib/evolution";
import { aminoColor } from "../lib/analysis";
import { AlignmentViewer } from "./AlignmentViewer";
import { TreeView } from "./TreeView";
import { Badge, Panel, ViewIntro } from "./ui";
import { cx } from "../lib/cx";

export function EvolutionView() {
  const analysis = useMemo(() => buildEvolutionAnalysis(), []);
  const [selectedSpecies, setSelectedSpecies] = useState("human");
  const [showDifferences, setShowDifferences] = useState(true);
  const [selectedColumn, setSelectedColumn] = useState(() => {
    const column = analysis.msa.columns.find((item) => item.humanPosition === 64);
    return column?.id ?? 0;
  });

  const column = analysis.msa.columns[selectedColumn] ?? analysis.msa.columns[0];
  const humanIdentity = analysis.identity.values[0].slice(1);
  const minIdentity = Math.min(...humanIdentity);
  const maxIdentity = Math.max(...humanIdentity);
  const heme64 = humanColumn(analysis.msa.columns, 64);
  const heme93 = humanColumn(analysis.msa.columns, 93);

  const selectHumanPosition = (position: number) => {
    const target = humanColumn(analysis.msa.columns, position);
    if (target !== null) {
      setSelectedColumn(target);
      setSelectedSpecies("human");
    }
  };

  if (!column) return null;

  return (
    <div className="view view--evolution">
      <ViewIntro
        eyebrow={<>COMPARATIVE GENOMICS / HBB ORTHOLOGS</>}
        title="What survives"
        accent="the test of time."
        description="把七个物种的 β-珠蛋白放在同一张坐标纸上。序列在变，折叠在变，但有些位点几乎不允许改变——它们通常正是蛋白工作的地方。"
        tags={["BLOSUM62", "Multiple alignment", "Neighbor joining", "Heme pocket"]}
      >
        <div className="mini-stat-grid">
          <div><span>Orthologs</span><strong>{analysis.msa.species.length}</strong><em>vertebrate HBB</em></div>
          <div><span>Alignment</span><strong>{analysis.msa.alignmentLength}</strong><em>amino acid columns</em></div>
          <div><span>Conserved</span><strong>{analysis.msa.conservedColumns}</strong><em>≥ 99% identity</em></div>
          <div><span>Human identity</span><strong>{minIdentity.toFixed(0)}–{maxIdentity.toFixed(0)}%</strong><em>across orthologs</em></div>
        </div>
      </ViewIntro>

      <div className="evolution-species-strip" aria-label="Species selection">
        {analysis.msa.species.map((species) => (
          <button
            key={species.id}
            type="button"
            className={cx("species-chip", selectedSpecies === species.id && "is-active")}
            onClick={() => setSelectedSpecies(species.id)}
          >
            <i style={{ background: species.color }} />
            <strong>{species.commonNameZh}</strong>
            <span>{species.commonName}</span>
            {species.id === "human" && <em>reference</em>}
            {species.id === "zebrafish" && <em>outgroup</em>}
          </button>
        ))}
      </div>

      <Panel
        className="alignment-panel"
        kicker="MULTIPLE SEQUENCE ALIGNMENT / BLOSUM62"
        title="Seven globins, one fold"
        action={
          <div className="alignment-actions">
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={showDifferences}
                onChange={(event) => setShowDifferences(event.target.checked)}
              />
              <span className="toggle-track" />
              <span>差异高亮</span>
            </label>
            <Badge tone="lime">outgroup-rooted</Badge>
          </div>
        }
      >
        <div className="alignment-toolbar">
          <span className="alignment-toolbar-hint"><MousePointerClick size={12} /> 点击任意列或碱基查看保守性</span>
          <div className="alignment-jump">
            <span>HEME</span>
            <button type="button" onClick={() => selectHumanPosition(64)} className={selectedColumn === heme64 ? "is-active" : ""}>
              His64
            </button>
            <button type="button" onClick={() => selectHumanPosition(93)} className={selectedColumn === heme93 ? "is-active" : ""}>
              His93
            </button>
          </div>
        </div>

        <AlignmentViewer
          msa={analysis.msa}
          selectedColumn={selectedColumn}
          selectedSpecies={selectedSpecies}
          showDifferences={showDifferences}
          onSelectColumn={setSelectedColumn}
          onSelectSpecies={setSelectedSpecies}
        />

        <div className="alignment-scrubber">
          <span>column</span>
          <input
            type="range"
            min={0}
            max={analysis.msa.columns.length - 1}
            value={selectedColumn}
            onChange={(event) => setSelectedColumn(Number(event.target.value))}
            aria-label="Alignment column"
          />
          <strong>{selectedColumn + 1} / {analysis.msa.columns.length}</strong>
        </div>
      </Panel>

      <div className="evolution-grid">
        <Panel
          className="tree-panel"
          kicker="NEIGHBOR JOINING / P-DISTANCE"
          title="A gene tree, not a species tree"
          action={<Badge tone="violet"><GitBranch size={11} /> rooted on zebrafish</Badge>}
        >
          <TreeView
            tree={analysis.tree}
            species={analysis.msa.species}
            selectedSpecies={selectedSpecies}
            onSelectSpecies={setSelectedSpecies}
          />
          <p className="tree-note">
            分支长度表示每位点的 p-distance。单基因树可能与物种树不一致；这里展示的是 HBB 自身的演化历史。
          </p>
        </Panel>

        <Panel
          className="column-panel"
          kicker={column.humanPosition ? `HBB POSITION ${column.humanPosition}` : "INSERTION COLUMN"}
          title={column.humanPosition ? `Column ${column.id + 1}` : "Insertion relative to human"}
          action={
            column.humanPosition === 64 || column.humanPosition === 93 ? (
              <Badge tone="amber"><Sparkles size={11} /> heme ligand</Badge>
            ) : (
              <Badge tone="muted">{Math.round(column.conservation * 100)}% conserved</Badge>
            )
          }
        >
          <div className="column-hero">
            <div className="column-hero-residue" style={{ color: column.chars.human === "-" ? "var(--dim)" : aminoColor(column.chars.human) }}>
              {column.chars.human === "-" ? "·" : column.chars.human}
            </div>
            <div className="column-hero-meta">
              <span>HUMAN RESIDUE</span>
              <strong>{column.humanPosition ? `HBB ${column.humanPosition}` : "insertion"}</strong>
              <em>{column.consensus === "·" ? "no consensus" : `consensus ${column.consensus}`}</em>
            </div>
          </div>

          <div className="column-stats">
            <div><span>conservation</span><strong>{Math.round(column.conservation * 100)}%</strong></div>
            <div><span>gap fraction</span><strong>{Math.round(column.gapFraction * 100)}%</strong></div>
            <div><span>modal count</span><strong>{Math.round(column.conservation * analysis.msa.species.length)}/{analysis.msa.species.length}</strong></div>
          </div>

          <div className="species-distribution">
            {analysis.msa.species.map((species) => {
              const residue = column.chars[species.id] ?? "-";
              return (
                <div className={cx("distribution-row", selectedSpecies === species.id && "is-active")} key={species.id}>
                  <span className="distribution-dot" style={{ background: species.color }} />
                  <span>{species.commonNameZh}</span>
                  <strong style={{ color: residue === "-" ? "var(--dim)" : aminoColor(residue) }}>{residue === "-" ? "·" : residue}</strong>
                </div>
              );
            })}
          </div>

          <div className="column-nav">
            <button type="button" onClick={() => setSelectedColumn(Math.max(0, selectedColumn - 1))} disabled={selectedColumn === 0}>
              <ArrowLeft size={13} /> prev
            </button>
            <button type="button" onClick={() => setSelectedColumn(Math.min(analysis.msa.columns.length - 1, selectedColumn + 1))} disabled={selectedColumn === analysis.msa.columns.length - 1}>
              next <ArrowRight size={13} />
            </button>
          </div>
        </Panel>
      </div>

      <div className="evolution-lower">
        <Panel
          className="identity-panel"
          kicker="PAIRWISE IDENTITY"
          title="How close is close?"
          action={<Badge tone="lime">% identity</Badge>}
        >
          <IdentityMatrix
            labels={analysis.identity.labels}
            values={analysis.identity.values}
            selectedSpecies={selectedSpecies}
            onSelectSpecies={setSelectedSpecies}
          />
          <div className="identity-legend">
            <span>50%</span>
            <i />
            <span>100%</span>
            <em>gaps excluded</em>
          </div>
        </Panel>

        <Panel
          className="heme-panel"
          kicker="WHY CONSERVATION MATTERS"
          title="The histidine clamp"
          action={<Badge tone="amber">7 / 7</Badge>}
        >
          <div className="heme-visual" aria-hidden="true">
            <div className="heme-ring"><span>heme</span><strong>Fe</strong></div>
            <div className="heme-his heme-his--64"><span>His64</span><em>distal</em></div>
            <div className="heme-his heme-his--93"><span>His93</span><em>proximal</em></div>
          </div>
          <div className="heme-copy">
            <p>
              His93 直接配位血红素铁，His64 在远端帮助稳定氧结合。七个物种中这两个位点全部保持为 His。
            </p>
            <p>
              这就是“保守性”最有用的地方：它不告诉你某个位点一定重要，但当一个位点在数亿年里拒绝改变，它通常有理由。
            </p>
          </div>
          <button type="button" className="text-button" onClick={() => selectHumanPosition(64)}>
            查看 His64 的比对列 <ArrowRight size={13} />
          </button>
        </Panel>
      </div>

      <div className="insight-banner evolution-insight">
        <div className="insight-icon"><Info size={18} /></div>
        <div>
          <strong>方法边界：这是一棵基因树，不是物种树</strong>
          <p>
            比对使用 BLOSUM62 全局比对、线性空位罚分和中心星近似；树使用 p-distance + Neighbor-Joining，并以斑马鱼为外群。
            单基因树可能受到基因复制、长枝吸引和比对误差影响，不能直接当作物种分类结论。
          </p>
        </div>
        <div className="insight-chips">
          <span>BLOSUM62</span>
          <span>NJ</span>
          <span>7 taxa</span>
        </div>
      </div>
    </div>
  );
}

function humanColumn(columns: MsaColumn[], position: number): number | null {
  return columns.find((column) => column.humanPosition === position)?.id ?? null;
}

function IdentityMatrix({
  labels,
  values,
  selectedSpecies,
  onSelectSpecies,
}: {
  labels: string[];
  values: number[][];
  selectedSpecies: string;
  onSelectSpecies: (id: string) => void;
}) {
  return (
    <div className="identity-matrix-wrap">
      <table className="identity-matrix">
        <thead>
          <tr>
            <th />
            {labels.map((label) => (
              <th key={label} title={label}>{label.slice(0, 3)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((row, rowIndex) => (
            <tr key={row} className={selectedSpecies === row ? "is-active" : ""}>
              <th>
                <button type="button" onClick={() => onSelectSpecies(row)}>{row.slice(0, 3)}</button>
              </th>
              {values[rowIndex].map((value, columnIndex) => {
                const alpha = value === 100 ? 0.26 : Math.max(0.025, ((value - 45) / 55) * 0.17);
                return (
                  <td
                    key={`${row}-${labels[columnIndex]}`}
                    style={{ background: `rgba(200, 255, 94, ${alpha})` }}
                    title={`${labels[rowIndex]} vs ${labels[columnIndex]}: ${value.toFixed(1)}%`}
                  >
                    {value.toFixed(0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
