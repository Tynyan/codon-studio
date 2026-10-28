import { useEffect, type CSSProperties, type PointerEvent } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eraser,
  FlaskConical,
  MousePointerClick,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import {
  AMINO_ACIDS,
  BASE_META,
  GROUP_META,
  analyzeMutation,
  classifyMutation,
  mutationTone,
  translate,
  type AminoAcidCode,
  type Nucleotide,
} from "../lib/genetics";
import { clamp } from "../lib/format";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { Gene } from "../types";
import { Badge, Segmented } from "./ui";
import { cx } from "../lib/cx";

export interface DraftMutation {
  position: number;
  alt: string;
  frame?: number;
}

type BadgeTone = "lime" | "muted" | "coral" | "violet" | "cyan" | "amber";

function toneToBadge(tone: ReturnType<typeof mutationTone>): BadgeTone {
  if (tone === "good") return "lime";
  if (tone === "warn") return "amber";
  if (tone === "bad") return "coral";
  return "muted";
}

export function SequenceStage({
  gene,
  frame,
  onFrameChange,
  selectedCodon,
  selectedBase,
  onSelectCodon,
  onSelectBase,
  draft,
  onDraftChange,
  onOpenVariantLab,
  onCopy,
}: {
  gene: Gene;
  frame: number;
  onFrameChange: (frame: number) => void;
  selectedCodon: number;
  selectedBase: number;
  onSelectCodon: (index: number) => void;
  onSelectBase: (position: number) => void;
  draft: DraftMutation | null;
  onDraftChange: (draft: DraftMutation | null) => void;
  onOpenVariantLab: () => void;
  onCopy: () => void;
}) {
  const isNarrow = useMediaQuery("(max-width: 1270px)");
  const isMobile = useMediaQuery("(max-width: 720px)");
  const visibleCount = isMobile ? 5 : isNarrow ? 9 : 11;
  const frameSequence = gene.sequence.slice(frame);
  const totalCodons = Math.ceil(frameSequence.length / 3);
  const frameProtein = translate(frameSequence);
  const safeCodon = clamp(selectedCodon, 0, Math.max(0, totalCodons - 1));
  const windowStart = clamp(
    safeCodon - Math.floor(visibleCount / 2),
    0,
    Math.max(0, totalCodons - visibleCount),
  );
  const indices = Array.from(
    { length: Math.min(visibleCount, Math.max(0, totalCodons - windowStart)) },
    (_, index) => windowStart + index,
  );

  useEffect(() => {
    if (selectedCodon !== safeCodon) onSelectCodon(safeCodon);
  }, [onSelectCodon, safeCodon, selectedCodon]);

  const selectCodon = (index: number) => {
    const next = clamp(index, 0, Math.max(0, totalCodons - 1));
    onSelectCodon(next);
    onSelectBase(frame + next * 3 + 1);
  };

  const randomMutation = () => {
    const position = frame + safeCodon * 3 + Math.floor(Math.random() * 3) + 1;
    const ref = gene.sequence[position - 1];
    const choices = (["A", "T", "G", "C"] as const).filter((base) => base !== ref);
    const alt = choices[Math.floor(Math.random() * choices.length)];
    onSelectBase(position);
    onDraftChange({ position, alt, frame });
  };

  return (
    <section className="stage">
      <header className="stage-head">
        <div className="stage-title">
          <div className="stage-kicker">
            <span className="live-dot" />
            CENTRAL DOGMA / LIVE
          </div>
          <h2>
            Transcription <span className="stage-arrow">→</span> translation
          </h2>
        </div>
        <div className="stage-tools">
          <div className="frame-control">
            <span>Reading frame</span>
            <Segmented
              value={String(frame + 1)}
              options={["1", "2", "3"].map((value) => ({ value, label: `+${value}` }))}
              onChange={(value) => onFrameChange(Number(value) - 1)}
              label="Reading frame"
              className="segmented--small"
            />
          </div>
          <button type="button" className="icon-button icon-button--soft" onClick={onCopy} title="复制 CDS" aria-label="复制 CDS">
            <Copy size={16} />
          </button>
          <button type="button" className="stage-lab-button" onClick={onOpenVariantLab}>
            <FlaskConical size={14} />
            Variant lab
            <ArrowUpRight size={13} />
          </button>
        </div>
      </header>

      <div className="stage-body">
        <div className="sequence-panel">
          <div className="strand-caption">
            <span className="strand-caption-label">CODING DNA</span>
            <span className="strand-caption-direction">5′ → 3′</span>
            <span className="strand-caption-legend">
              {(["A", "T", "G", "C"] as Nucleotide[]).map((base) => (
                <span key={base} style={{ color: BASE_META[base].color }}>{base}</span>
              ))}
            </span>
          </div>

          <div
            className="codon-grid"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, indices.length)}, minmax(0, 1fr))` }}
          >
            {indices.map((index) => {
              const codon = frameSequence.slice(index * 3, index * 3 + 3);
              const aaCode = (translate(codon)[0] ?? "*") as AminoAcidCode;
              const aa = AMINO_ACIDS[aaCode];
              const selected = index === safeCodon;
              const codonPositions = [0, 1, 2].map((offset) => frame + index * 3 + offset + 1);
              const hasDraft = draft ? codonPositions.includes(draft.position) : false;
              return (
                <div className={cx("codon-column", selected && "is-selected", hasDraft && "has-draft")} key={index}>
                  {selected && (
                    <div className="codon-float-label">
                      C{index + 1}
                      {hasDraft && <span>mutated</span>}
                    </div>
                  )}
                  <div className="dna-triplet" aria-label={`Codon ${index + 1}: ${codon}`}>
                    {[0, 1, 2].map((offset) => {
                      const position = codonPositions[offset];
                      const original = (codon[offset] ?? "A") as Nucleotide;
                      const changed = draft?.position === position;
                      const base = (changed ? draft.alt : original) as Nucleotide;
                      return (
                        <button
                          key={offset}
                          type="button"
                          className={cx(
                            "base-tile",
                            changed && "is-mutated",
                            selected && selectedBase === position && "is-cursor",
                          )}
                          style={{
                            "--base-color": BASE_META[original].color,
                            "--base-bg": `${BASE_META[original].color}12`,
                          } as CSSProperties}
                          onClick={() => {
                            onSelectCodon(index);
                            onSelectBase(position);
                          }}
                          aria-label={`Base ${position}, ${BASE_META[original].name}${changed ? `, simulated mutation to ${draft.alt}` : ""}`}
                          title={`c.${position} · ${original}${changed ? ` → ${draft.alt}` : ""}`}
                        >
                          <span>{base}</span>
                          {changed && <i className="base-change-mark" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rna-triplet" aria-hidden="true">
                    {codon.split("").map((base, offset) => (
                      <span key={offset} style={{ color: BASE_META[base as Nucleotide]?.color ?? "#89978d" }}>
                        {base === "T" ? "U" : base}
                      </span>
                    ))}
                  </div>

                  <div className="peptide-link" aria-hidden="true"><i /></div>
                  <div
                    className={cx("amino-node", aaCode === "*" && "is-stop")}
                    style={{ "--aa-color": GROUP_META[aa.group].color } as CSSProperties}
                    title={`${aa.three} · ${aa.nameZh}`}
                  >
                    <span>{aaCode === "*" ? "■" : aaCode}</span>
                    <em>{aa.three}</em>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stage-readout">
            <div className="readout-position">
              <span>CODON</span>
              <strong>{String(safeCodon + 1).padStart(3, "0")} <i>/ {totalCodons}</i></strong>
            </div>
            <div className="readout-protein">
              <span>PEPTIDE</span>
              <strong>{frameProtein.slice(0, 24)}{frameProtein.length > 24 ? "…" : ""}</strong>
            </div>
            <div className="readout-window">
              <span>WINDOW</span>
              <strong>c.{frame + windowStart * 3 + 1}–{Math.min(gene.sequence.length, frame + (windowStart + indices.length) * 3)}</strong>
            </div>
          </div>

          <div className="stage-nav">
            <button type="button" className="nav-arrow" onClick={() => selectCodon(safeCodon - 1)} disabled={safeCodon === 0} aria-label="上一个密码子">
              <ChevronLeft size={17} />
            </button>
            <CodonMinimap
              total={totalCodons}
              selected={safeCodon}
              variants={frame === 0 ? gene.variants.map((variant) => Math.floor((variant.position - 1) / 3)) : []}
              onSelect={selectCodon}
            />
            <button type="button" className="nav-arrow" onClick={() => selectCodon(safeCodon + 1)} disabled={safeCodon >= totalCodons - 1} aria-label="下一个密码子">
              <ChevronRight size={17} />
            </button>
            <button type="button" className="nav-shuffle" onClick={randomMutation} title="随机模拟一个点突变">
              <Shuffle size={14} />
            </button>
          </div>
        </div>

        <CodonInspector
          gene={gene}
          frame={frame}
          codonIndex={safeCodon}
          selectedBase={selectedBase}
          onSelectBase={onSelectBase}
          draft={draft}
          onDraftChange={onDraftChange}
          onOpenVariantLab={onOpenVariantLab}
        />
      </div>
    </section>
  );
}

function CodonInspector({
  gene,
  frame,
  codonIndex,
  selectedBase,
  onSelectBase,
  draft,
  onDraftChange,
  onOpenVariantLab,
}: {
  gene: Gene;
  frame: number;
  codonIndex: number;
  selectedBase: number;
  onSelectBase: (position: number) => void;
  draft: DraftMutation | null;
  onDraftChange: (draft: DraftMutation | null) => void;
  onOpenVariantLab: () => void;
}) {
  const codonStart = frame + codonIndex * 3;
  const codon = gene.sequence.slice(codonStart, codonStart + 3);
  const refAa = (translate(codon)[0] ?? "*") as AminoAcidCode;
  const aa = AMINO_ACIDS[refAa];
  const positions = [0, 1, 2].map((offset) => codonStart + offset + 1);
  const activeOffset = Math.max(0, positions.indexOf(selectedBase));
  const draftResult =
    draft && positions.includes(draft.position)
      ? analyzeMutation(gene.sequence, draft.position, draft.alt, frame)
      : null;
  const curated = frame === 0
    ? gene.variants.filter((variant) => Math.floor((variant.position - 1) / 3) === codonIndex)
    : [];

  const setAlt = (position: number, alt: string) => {
    onSelectBase(position);
    onDraftChange({ position, alt, frame });
  };

  return (
    <aside className={cx("codon-inspector", draftResult && "has-preview")}>
      <div className="inspector-head">
        <div>
          <div className="panel-kicker">SELECTED CODON</div>
          <span className="inspector-coord">C{codonIndex + 1} · c.{codonStart + 1}–{codonStart + 3}</span>
        </div>
        {draftResult ? (
          <button type="button" className="mini-action" onClick={() => onDraftChange(null)}>
            <Eraser size={12} /> reset
          </button>
        ) : (
          <Badge tone="muted">frame +{frame + 1}</Badge>
        )}
      </div>

      <div className="codon-hero">
        <div className="codon-hero-string" aria-label={`Codon ${codon}`}>
          {codon.split("").map((base, index) => (
            <span
              key={index}
              className={cx(
                "codon-hero-base",
                index === activeOffset && "is-active",
                draftResult?.position === positions[index] && "is-mutated",
              )}
              style={{ color: BASE_META[base as Nucleotide]?.color ?? "#eef4e8" }}
            >
              {draftResult?.position === positions[index] ? draftResult.alt : base}
            </span>
          ))}
        </div>
        <span className="codon-hero-arrow">→</span>
        <div className="codon-aa" style={{ borderColor: `${GROUP_META[aa.group].color}55`, background: `${GROUP_META[aa.group].color}12` }}>
          <strong style={{ color: GROUP_META[aa.group].color }}>{refAa === "*" ? "■" : refAa}</strong>
          <span>{aa.three}<em>{aa.nameZh}</em></span>
        </div>
      </div>

      <div className="inspector-label">
        <span>POINT MUTATION</span>
        <span className="inspector-hint"><MousePointerClick size={11} /> pick a base</span>
      </div>

      <div className="mutation-options">
        {[0, 1, 2].map((offset) => {
          const position = positions[offset];
          const ref = gene.sequence[position - 1] ?? "A";
          return (
            <div className={cx("mutation-row", activeOffset === offset && "is-active")} key={offset}>
              <button
                type="button"
                className="mutation-ref"
                onClick={() => onSelectBase(position)}
                title={`选择第 ${offset + 1} 个碱基`}
              >
                <span>{offset + 1}</span>
                <strong style={{ color: BASE_META[ref as Nucleotide]?.color }}>{ref}</strong>
              </button>
              <div className="mutation-alts">
                {(["A", "T", "G", "C"] as const)
                  .filter((base) => base !== ref)
                  .map((base) => {
                    const active = draft?.position === position && draft.alt === base;
                    return (
                      <button
                        key={base}
                        type="button"
                        className={cx("alt-base", active && "is-active")}
                        style={{ color: BASE_META[base].color }}
                        onClick={() => setAlt(position, base)}
                        aria-label={`将 c.${position} 的 ${ref} 变为 ${base}`}
                      >
                        {base}
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {draftResult ? (
        <div className={cx("mutation-preview", `tone-${mutationTone(draftResult.kind)}`)}>
          <div className="preview-diff-line">
            <span className="preview-code">{draftResult.refCodon}</span>
            <span className="preview-arrow">→</span>
            <span className="preview-code preview-code--alt">{draftResult.altCodon}</span>
            <Badge tone={toneToBadge(mutationTone(draftResult.kind))}>{classifyMutation(draftResult)}</Badge>
          </div>
          <div className="preview-aa-line">
            <span>{AMINO_ACIDS[draftResult.refAa].three}</span>
            <span>→</span>
            <strong>{draftResult.altAa === "*" ? "Stop" : AMINO_ACIDS[draftResult.altAa].three}</strong>
            <em>ΔGRAVY {draftResult.hydropathyDelta >= 0 ? "+" : ""}{draftResult.hydropathyDelta.toFixed(2)}</em>
          </div>
          <div className="preview-actions">
            <button type="button" className="mini-action mini-action--lime" onClick={onOpenVariantLab}>
              <FlaskConical size={12} /> 在变异实验室中打开
            </button>
            <button type="button" className="mini-action" onClick={() => onDraftChange(null)}>
              <RotateCcw size={12} /> 清除
            </button>
          </div>
        </div>
      ) : (
        <div className="mutation-empty">
          <Sparkles size={14} />
          <p>点击任意碱基或替换选项，模拟一个点突变。实时查看密码子、氨基酸与蛋白性质如何改变。</p>
        </div>
      )}

      {curated.length > 0 && (
        <div className="curated-row">
          <span>KNOWN IN THIS CODON</span>
          {curated.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className="curated-chip"
              onClick={() => {
                onSelectBase(variant.position);
                onDraftChange({ position: variant.position, alt: variant.alt, frame: 0 });
              }}
            >
              {variant.name}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

function CodonMinimap({
  total,
  selected,
  variants,
  onSelect,
}: {
  total: number;
  selected: number;
  variants: number[];
  onSelect: (index: number) => void;
}) {
  const width = 600;
  const height = 26;
  const ticks = Math.min(180, total);
  const handleClick = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    onSelect(Math.round(ratio * (total - 1)));
  };

  return (
    <div className="codon-minimap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onClick={handleClick}
        role="slider"
        aria-label="Codon position"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={selected + 1}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") onSelect(Math.max(0, selected - 1));
          if (event.key === "ArrowRight") onSelect(Math.min(total - 1, selected + 1));
        }}
      >
        {Array.from({ length: ticks }, (_, index) => {
          const ratio = ticks === 1 ? 0 : index / (ticks - 1);
          return (
            <line
              key={index}
              x1={ratio * width}
              x2={ratio * width}
              y1={height / 2 - 4}
              y2={height / 2 + 4}
              className="minimap-tick"
            />
          );
        })}
        {variants.map((index, variantIndex) => (
          <line
            key={`variant-${index}-${variantIndex}`}
            x1={(index / Math.max(1, total - 1)) * width}
            x2={(index / Math.max(1, total - 1)) * width}
            y1={2}
            y2={height - 2}
            className="minimap-variant"
          />
        ))}
        <line
          x1={(selected / Math.max(1, total - 1)) * width}
          x2={(selected / Math.max(1, total - 1)) * width}
          y1={0}
          y2={height}
          className="minimap-cursor"
        />
      </svg>
    </div>
  );
}
