import { ArrowUpRight, FlaskConical, Quote, Sparkles } from "lucide-react";
import type { Gene } from "../types";
import type { GeneAnalysis } from "../lib/analysis";
import { analyzeVariant } from "../lib/analysis";
import { AMINO_ACIDS, BASE_META, classifyMutation, mutationTone } from "../lib/genetics";
import { formatInt, formatMass, formatSigned } from "../lib/format";
import { HydropathyChart, BaseBars, GcSparkline } from "./charts";
import { SequenceStage, type DraftMutation } from "./SequenceStage";
import { Badge, Panel, ViewIntro } from "./ui";
import { cx } from "../lib/cx";

export function WorkbenchView({
  gene,
  analysis,
  frame,
  onFrameChange,
  selectedCodon,
  selectedBase,
  onSelectCodon,
  onSelectBase,
  draft,
  onDraftChange,
  onOpenVariantLab,
  onCopySequence,
  onOpenVariant,
}: {
  gene: Gene;
  analysis: GeneAnalysis;
  frame: number;
  onFrameChange: (frame: number) => void;
  selectedCodon: number;
  selectedBase: number;
  onSelectCodon: (index: number) => void;
  onSelectBase: (position: number) => void;
  draft: DraftMutation | null;
  onDraftChange: (draft: DraftMutation | null) => void;
  onOpenVariantLab: () => void;
  onCopySequence: () => void;
  onOpenVariant: (id: string) => void;
}) {
  const featured = gene.variants[0];
  const featuredResult = featured ? analyzeVariant(gene, featured) : null;
  const tabClass = featured && featuredResult ? mutationTone(featuredResult.analysis.kind) : "neutral";

  return (
    <div className="view view--workbench">
      <ViewIntro
        eyebrow={
          <>
            SAMPLE {gene.id === "S" ? "04" : gene.id === "TP53" ? "03" : gene.id === "INS" ? "02" : "01"}
            <span className="eyebrow-divider">/</span>
            {gene.organism}
            <span className="eyebrow-divider">/</span>
            {gene.accession}
          </>
        }
        title={gene.displayName}
        accent={gene.headline}
        description={gene.description}
        tags={gene.tags}
      >
        <div className="intro-metrics">
          <div className="intro-metric">
            <span>CODING SEQUENCE</span>
            <strong>{formatInt(gene.sequence.length)}<i>bp</i></strong>
          </div>
          <div className="intro-metric">
            <span>PROTEIN</span>
            <strong>{formatInt(gene.protein.length)}<i>aa</i></strong>
          </div>
          <div className="intro-metric">
            <span>GC CONTENT</span>
            <strong>{analysis.gc.toFixed(1)}<i>%</i></strong>
          </div>
          <div className="intro-metric">
            <span>ORFs · ≥20 aa</span>
            <strong>{analysis.orfs.length}</strong>
          </div>
        </div>
      </ViewIntro>

      <SequenceStage
        gene={gene}
        frame={frame}
        onFrameChange={onFrameChange}
        selectedCodon={selectedCodon}
        selectedBase={selectedBase}
        onSelectCodon={onSelectCodon}
        onSelectBase={onSelectBase}
        draft={draft}
        onDraftChange={onDraftChange}
        onOpenVariantLab={onOpenVariantLab}
        onCopy={onCopySequence}
      />

      <div className="overview-grid">
        <Panel
          className="gc-panel"
          kicker="SEQUENCE SIGNATURE"
          title="GC landscape"
          action={<Badge tone="lime">{analysis.gc.toFixed(1)}%</Badge>}
        >
          <div className="gc-big">
            <strong>{analysis.gc.toFixed(1)}<span>%</span></strong>
            <p>GC content across {formatInt(gene.sequence.length)} bp</p>
          </div>
          <GcSparkline points={analysis.gcSeries} height={94} />
          <div className="base-composition">
            <BaseBars bases={analysis.bases} total={gene.sequence.length} compact />
          </div>
          <div className="panel-footnote">
            <span>GC3</span>
            <strong>{analysis.gc3.toFixed(1)}%</strong>
            <span>第三位碱基的 GC 含量</span>
          </div>
        </Panel>

        <Panel
          className="protein-panel"
          kicker="PROTEIN SNAPSHOT"
          title="A chain of consequences"
          action={<Badge tone="violet">{formatMass(analysis.protein.mass)}</Badge>}
        >
          <div className="protein-mini-stats">
            <div><span>pI</span><strong>{analysis.protein.pI.toFixed(2)}</strong></div>
            <div><span>GRAVY</span><strong>{analysis.protein.gravy.toFixed(2)}</strong></div>
            <div><span>Net charge</span><strong>{analysis.protein.charge.toFixed(1)}</strong></div>
          </div>
          <div className="mini-chart-head">
            <span>KYTE–DOOLITTLE HYDROPATHY</span>
            <span>window 9</span>
          </div>
          <HydropathyChart points={analysis.hydropathy} height={118} />
          <div className="panel-footnote panel-footnote--between">
            <span>疏水峰</span>
            <strong>{analysis.protein.length} aa</strong>
            <span>越靠上越疏水</span>
          </div>
        </Panel>

        <Panel
          className={cx("spotlight-panel", `spotlight-panel--${tabClass}`)}
          kicker={featured ? "VARIANT SPOTLIGHT" : "VARIANT PLAYGROUND"}
          title={featured ? "One letter changes the story" : "Make your own mutation"}
          action={
            <button type="button" className="icon-link" onClick={onOpenVariantLab} aria-label="打开变异实验室">
              <ArrowUpRight size={16} />
            </button>
          }
        >
          {featured && featuredResult ? (
            <div className="spotlight-body">
              <div className="spotlight-name-row">
                <span className="spotlight-name">{featured.name}</span>
                <Badge tone={featuredResult.tone === "bad" ? "coral" : featuredResult.tone === "good" ? "lime" : "amber"}>
                  {classifyMutation(featuredResult.analysis)}
                </Badge>
              </div>
              <div className="dna-diff" aria-label={`${featuredResult.analysis.refCodon} becomes ${featuredResult.analysis.altCodon}`}>
                <div className="dna-diff-code">
                  {featuredResult.analysis.refCodon.split("").map((base, index) => (
                    <span
                      key={index}
                      className={cx(index === (featured.position - 1) % 3 && "is-changed")}
                      style={{ color: index === (featured.position - 1) % 3 ? "#ff8ba0" : BASE_META[base as keyof typeof BASE_META]?.color }}
                    >
                      {base}
                    </span>
                  ))}
                </div>
                <span className="dna-diff-arrow">→</span>
                <div className="dna-diff-code dna-diff-code--alt">
                  {featuredResult.analysis.altCodon.split("").map((base, index) => (
                    <span
                      key={index}
                      className={cx(index === (featured.position - 1) % 3 && "is-changed")}
                      style={{ color: index === (featured.position - 1) % 3 ? "#c8ff5e" : BASE_META[base as keyof typeof BASE_META]?.color }}
                    >
                      {base}
                    </span>
                  ))}
                </div>
              </div>
              <div className="aa-diff">
                <span>{AMINO_ACIDS[featuredResult.analysis.refAa].three}</span>
                <span className="aa-diff-arrow">→</span>
                <strong>{featuredResult.analysis.altAa === "*" ? "Stop" : AMINO_ACIDS[featuredResult.analysis.altAa].three}</strong>
                <em>{featured.proteinChange}</em>
              </div>
              <div className="spotlight-phenotype">{featured.phenotype}</div>
              <p className="spotlight-note">{featured.note}</p>
              <div className="spotlight-deltas">
                <span><em>Δ mass</em><strong>{formatSigned(featuredResult.analysis.massDelta, 1)} Da</strong></span>
                <span><em>Δ pI</em><strong>{formatSigned(featuredResult.analysis.pIDelta, 2)}</strong></span>
                <span><em>Δ GRAVY</em><strong>{formatSigned(featuredResult.analysis.hydropathyDelta, 2)}</strong></span>
              </div>
              <button type="button" className="text-button" onClick={() => onOpenVariant(featured.id)}>
                打开变异档案 <ArrowUpRight size={14} />
              </button>
            </div>
          ) : (
            <div className="spotlight-empty">
              <div className="empty-orbit"><FlaskConical size={22} /></div>
              <p>这个样本没有预置的临床变异，但你可以任意选择一个碱基，观察同义、错义或无义突变。</p>
              <button type="button" className="text-button" onClick={onOpenVariantLab}>
                开始自定义突变 <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          <div className="spotlight-glow" aria-hidden="true" />
        </Panel>
      </div>

      <div className="gene-fact">
        <Quote size={18} />
        <p>{gene.fact}</p>
        <span><Sparkles size={13} /> FIELD NOTE</span>
      </div>
    </div>
  );
}
