import { useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, Crosshair, MoveDown } from "lucide-react";
import type { Gene } from "../types";
import type { GeneAnalysis } from "../lib/analysis";
import { AMINO_ACIDS, countAminoAcids, type AminoAcidCode } from "../lib/genetics";
import { aminoColor } from "../lib/analysis";
import { formatInt, formatMass } from "../lib/format";
import { AminoComposition, DomainTrack, GroupLegend, HydropathyChart } from "./charts";
import { Badge, Panel, ViewIntro } from "./ui";
import { cx } from "../lib/cx";

export function ProteinView({
  gene,
  analysis,
  selectedResidue,
  onSelectResidue,
  onOpenCodon,
}: {
  gene: Gene;
  analysis: GeneAnalysis;
  selectedResidue: number;
  onSelectResidue: (position: number) => void;
  onOpenCodon: (codonIndex: number) => void;
}) {
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const safePosition = Math.max(1, Math.min(gene.protein.length, selectedResidue));
  const selectedAa = gene.protein[safePosition - 1] ?? "M";
  const aa = AMINO_ACIDS[selectedAa as AminoAcidCode] ?? AMINO_ACIDS.M;
  const codonIndex = safePosition - 1;
  const codon = gene.sequence.slice(codonIndex * 3, codonIndex * 3 + 3);
  const counts = useMemo(() => countAminoAcids(gene.protein), [gene.protein]);
  const blocks = useMemo(() => {
    const residues = gene.protein.split("");
    const result: Array<{ start: number; residues: string[] }> = [];
    for (let index = 0; index < residues.length; index += 10) {
      result.push({ start: index, residues: residues.slice(index, index + 10) });
    }
    return result;
  }, [gene.protein]);
  const activePosition = hoverPosition ?? safePosition;
  const activePoint = analysis.hydropathy[activePosition - 1];

  return (
    <div className="view view--protein">
      <ViewIntro
        eyebrow={<>PROTEIN / {gene.proteinAccession} / {gene.organism}</>}
        title="The folded message"
        accent="becomes a machine."
        description="翻译只是开始。氨基酸的疏水性、电荷与空间排布，决定蛋白如何折叠、在哪里停靠、和谁结合。点击任意残基，查看它的化学性格。"
        tags={["Amino acid chemistry", "Hydropathy", "Domains"]}
      >
        <div className="mini-stat-grid">
          <div><span>Residues</span><strong>{formatInt(gene.protein.length)}</strong><em>amino acids</em></div>
          <div><span>Mass</span><strong>{formatMass(analysis.protein.mass)}</strong><em>theoretical</em></div>
          <div><span>pI</span><strong>{analysis.protein.pI.toFixed(2)}</strong><em>isoelectric point</em></div>
          <div><span>GRAVY</span><strong>{analysis.protein.gravy.toFixed(2)}</strong><em>{analysis.protein.gravy > 0 ? "hydrophobic" : "hydrophilic"}</em></div>
        </div>
      </ViewIntro>

      <Panel
        className="domain-panel"
        kicker="ANNOTATED ARCHITECTURE"
        title="Domain map"
        action={<Badge tone="muted">{formatInt(gene.protein.length)} aa</Badge>}
      >
        <DomainTrack
          domains={gene.domains}
          length={gene.protein.length}
          selectedPosition={safePosition}
          onSelect={onSelectResidue}
        />
      </Panel>

      <div className="protein-grid">
        <Panel
          className="sequence-panel-card"
          kicker="PRIMARY STRUCTURE"
          title="Amino acid chain"
          action={
            <span className="panel-hint"><MoveDown size={12} /> scroll</span>
          }
        >
          <div className="protein-sequence" aria-label="Protein sequence">
            {blocks.map((block) => (
              <div className="protein-block" key={block.start}>
                <span className="protein-position">{block.start + 1}</span>
                <div className="protein-residues">
                  {block.residues.map((residue, offset) => {
                    const position = block.start + offset + 1;
                    const residueAa = AMINO_ACIDS[residue as AminoAcidCode] ?? AMINO_ACIDS.M;
                    return (
                      <button
                        key={position}
                        type="button"
                        className={cx(
                          "residue",
                          position === safePosition && "is-selected",
                          residue === "*" && "is-stop",
                        )}
                        style={{ "--residue-color": aminoColor(residue) } as CSSProperties}
                        onClick={() => onSelectResidue(position)}
                        title={`${position} · ${residueAa.three} (${residueAa.nameZh})`}
                        aria-label={`Residue ${position}, ${residueAa.nameZh}`}
                      >
                        {residue}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="sequence-scroll-hint">
            <span>1</span>
            <span><i /> 点击残基查看侧链性质</span>
            <span>{gene.protein.length}</span>
          </div>
        </Panel>

        <div className="protein-side">
          <Panel
            className="residue-card"
            kicker={`RESIDUE ${String(safePosition).padStart(4, "0")}`}
            title={`${aa.three} · ${aa.nameZh}`}
            action={<div className="residue-badge" style={{ background: `${GROUP_COLOR[aa.group]}18`, color: GROUP_COLOR[aa.group] }}>{selectedAa}</div>}
          >
            <div className="residue-body">
              <div className="residue-big" style={{ color: GROUP_COLOR[aa.group] }}>{selectedAa}</div>
              <div className="residue-facts">
                <div><span>One-letter</span><strong>{selectedAa}</strong></div>
                <div><span>Three-letter</span><strong>{aa.three}</strong></div>
                <div><span>Property</span><strong>{GROUP_LABEL[aa.group]}</strong></div>
                <div><span>Hydropathy</span><strong>{aa.hydropathy > 0 ? "+" : ""}{aa.hydropathy.toFixed(1)}</strong></div>
              </div>
            </div>
            <div className="residue-codon">
              <div>
                <span>ENCODED BY</span>
                <strong>{codon || "—"}</strong>
              </div>
              <div>
                <span>CHARGE @7.4</span>
                <strong>{aa.charge > 0 ? `+${aa.charge}` : aa.charge}</strong>
              </div>
              <button type="button" className="mini-action mini-action--lime" onClick={() => onOpenCodon(codonIndex)}>
                在工作台定位 <ArrowUpRight size={12} />
              </button>
            </div>
            <p className="residue-note">
              {aa.group === "hydrophobic" && "疏水侧链倾向于藏在蛋白内部，或嵌入脂双层。"}
              {aa.group === "polar" && "极性但不带电，常参与氢键网络和特异性识别。"}
              {aa.group === "acidic" && "生理 pH 下通常带负电，常见于活性位点和金属配位。"}
              {aa.group === "basic" && "生理 pH 下通常带正电，常与 DNA、RNA 或磷酸基团结合。"}
              {aa.group === "special" && "具有独特的构象或化学反应性，例如 Pro 的环状骨架、Cys 的二硫键。"}
              {aa.group === "stop" && "终止密码子不由 tRNA 识别，而由释放因子触发翻译终止。"}
            </p>
          </Panel>

          <Panel
            className="hydropathy-panel"
            kicker="HYDROPATHY PROFILE"
            title="Where the chain hides"
            action={<Badge tone="amber">window 9</Badge>}
          >
            <div className="chart-readout">
              <span><Crosshair size={12} /> residue {activePosition}</span>
              <strong>{activePoint ? `${activePoint.value > 0 ? "+" : ""}${activePoint.value.toFixed(2)}` : "—"}</strong>
            </div>
            <HydropathyChart
              points={analysis.hydropathy}
              selectedPosition={safePosition}
              onHover={setHoverPosition}
              height={170}
            />
            <div className="chart-caption">
              <span>← hydrophilic</span>
              <span>hydrophobic →</span>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        className="composition-panel"
        kicker="AMINO ACID COMPOSITION"
        title="The alphabet of this protein"
        action={<GroupLegend />}
      >
        <AminoComposition
          counts={counts}
          total={gene.protein.length}
          selected={selectedAa}
          onSelect={(code) => {
            const position = gene.protein.indexOf(code);
            if (position >= 0) onSelectResidue(position + 1);
          }}
        />
      </Panel>
    </div>
  );
}

const GROUP_COLOR: Record<string, string> = {
  hydrophobic: "#ffd36e",
  polar: "#6ad7ff",
  acidic: "#ff8ba0",
  basic: "#b7a4ff",
  special: "#77e6b2",
  stop: "#78857c",
};

const GROUP_LABEL: Record<string, string> = {
  hydrophobic: "疏水",
  polar: "极性",
  acidic: "酸性",
  basic: "碱性",
  special: "特殊",
  stop: "终止",
};
