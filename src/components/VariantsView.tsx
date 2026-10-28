import { useState } from "react";
import {
  ArrowUpRight,
  Beaker,
  Dna,
  FlaskConical,
  Info,
  MoveRight,
  Shuffle,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { Gene, GeneVariant, SequenceEdit } from "../types";
import type { GeneAnalysis, VariantResult } from "../lib/analysis";
import { analyzeVariant, buildEditResult, getPropertyImpacts } from "../lib/analysis";
import { AMINO_ACIDS, BASE_META, normalizeSequence } from "../lib/genetics";
import { clamp, formatInt } from "../lib/format";
import type { DraftMutation } from "./SequenceStage";
import { Badge, EmptyState, Panel, Segmented, ViewIntro } from "./ui";
import { cx } from "../lib/cx";

type Tone = "good" | "warn" | "bad" | "neutral";
type EditMode = SequenceEdit["type"];

function badgeTone(tone: Tone): "lime" | "amber" | "coral" | "muted" {
  if (tone === "good") return "lime";
  if (tone === "warn") return "amber";
  if (tone === "bad") return "coral";
  return "muted";
}

export function VariantsView({
  gene,
  analysis,
  selectedVariantId,
  draft,
  onSelectVariant,
  onDraftChange,
  onOpenCodon,
}: {
  gene: Gene;
  analysis: GeneAnalysis;
  selectedVariantId: string | null;
  draft: DraftMutation | null;
  onSelectVariant: (id: string | null) => void;
  onDraftChange: (draft: DraftMutation | null) => void;
  onOpenCodon: (codonIndex: number, frame?: number) => void;
}) {
  const selectedVariant = gene.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const [customPosition, setCustomPosition] = useState(selectedVariant?.position ?? draft?.position ?? 1);
  const [editMode, setEditMode] = useState<EditMode>(selectedVariant?.edit?.type ?? "substitution");
  const [customEdit, setCustomEdit] = useState<SequenceEdit | null>(null);
  const [inserted, setInserted] = useState("G");

  const activeResult: VariantResult | null = customEdit
    ? buildEditResult(gene, customEdit)
    : draft
      ? buildEditResult(gene, { type: "substitution", position: draft.position, alt: draft.alt }, null, draft.frame ?? 0)
      : selectedVariant
        ? analyzeVariant(gene, selectedVariant)
        : null;

  const safePosition = clamp(customPosition, 1, gene.sequence.length);
  const refBase = gene.sequence[safePosition - 1] ?? "A";
  const altOptions = (["A", "T", "G", "C"] as const).filter((base) => base !== refBase);
  const previewStart = Math.floor((safePosition - 1) / 3) * 3;
  const previewRef = gene.sequence.slice(previewStart, previewStart + 3);
  const previewAlt = draft
    ? `${previewRef.slice(0, (safePosition - 1) % 3)}${draft.alt}${previewRef.slice(((safePosition - 1) % 3) + 1)}`
    : "—";

  const chooseVariant = (variant: GeneVariant) => {
    onDraftChange(null);
    setCustomEdit(null);
    onSelectVariant(variant.id);
    setCustomPosition(variant.position);
    setEditMode(variant.edit?.type ?? "substitution");
  };

  const chooseCustom = (position: number, alt: string) => {
    setCustomEdit(null);
    onSelectVariant(null);
    onDraftChange({ position, alt, frame: draft?.frame ?? 0 });
    setCustomPosition(position);
  };

  const chooseEdit = (edit: SequenceEdit) => {
    onDraftChange(null);
    onSelectVariant(null);
    setCustomEdit(edit);
    setCustomPosition(edit.position);
    setEditMode(edit.type);
  };

  const randomise = () => {
    if (editMode === "deletion") {
      chooseEdit({
        type: "deletion",
        position: Math.floor(Math.random() * Math.max(1, gene.sequence.length - 9)) + 1,
        length: 3,
      });
      return;
    }
    if (editMode === "insertion") {
      const bases = Array.from({ length: 3 }, () => "ATGC"[Math.floor(Math.random() * 4)]).join("");
      chooseEdit({
        type: "insertion",
        position: Math.floor(Math.random() * Math.max(1, gene.sequence.length - 1)) + 1,
        inserted: bases,
      });
      return;
    }
    const position = Math.floor(Math.random() * gene.sequence.length) + 1;
    const ref = gene.sequence[position - 1];
    const choices = (["A", "T", "G", "C"] as const).filter((base) => base !== ref);
    chooseCustom(position, choices[Math.floor(Math.random() * choices.length)]);
  };

  const result = activeResult;
  const analysisResult = result?.analysis ?? null;
  const impacts = analysisResult ? getPropertyImpacts(analysisResult) : [];
  const changeLabel = selectedVariant?.proteinChange
    ?? (analysisResult
      ? analysisResult.editType === "substitution"
        ? `p.${AMINO_ACIDS[analysisResult.refAa].three}${analysisResult.codonIndex + 1}${analysisResult.altAa === "*" ? "*" : AMINO_ACIDS[analysisResult.altAa].three}`
        : analysisResult.editType === "deletion"
          ? `p.${AMINO_ACIDS[analysisResult.refAa].three}${analysisResult.codonIndex + 1}del`
          : `p.${AMINO_ACIDS[analysisResult.refAa].three}${analysisResult.codonIndex + 1}ins`
      : "");

  return (
    <div className="view view--variants">
      <ViewIntro
        eyebrow={<>VARIANT LAB / {gene.accession}</>}
        title="A tiny edit"
        accent="can change everything."
        description="选择一个真实变异，或亲手改写、删除、插入一段序列。Codon Studio 会即时重算密码子、氨基酸、蛋白长度和理化性质，并标出它为何可能重要。"
        tags={["SNV", "In-frame deletion", "Frameshift", "Protein impact"]}
      >
        <div className="mini-stat-grid">
          <div><span>Curated</span><strong>{gene.variants.length}</strong><em>known variants</em></div>
          <div><span>Hotspot codon</span><strong>{selectedVariant ? Math.floor((selectedVariant.position - 1) / 3) + 1 : "—"}</strong><em>{selectedVariant?.name ?? "choose one"}</em></div>
          <div><span>Protein</span><strong>{formatInt(analysis.proteinLength)}</strong><em>amino acids</em></div>
          <div><span>Simulation</span><strong>Live</strong><em>client-side</em></div>
        </div>
      </ViewIntro>

      <Panel
        className="variant-map-panel"
        kicker="MUTATION MAP"
        title="Where the change lands"
        action={result ? <Badge tone={badgeTone(result.tone)}>{result.label}</Badge> : <Badge tone="muted">no selection</Badge>}
      >
        <VariantMap
          gene={gene}
          selectedVariant={selectedVariant}
          draft={draft}
          onSelectVariant={chooseVariant}
          onOpenCodon={onOpenCodon}
        />
      </Panel>

      <div className="variant-grid">
        <div className="variant-side">
          <Panel
            kicker="CURATED LIBRARY"
            title="Known variants"
            action={<Badge tone="muted">{gene.variants.length}</Badge>}
          >
            {gene.variants.length ? (
              <div className="variant-list">
                {gene.variants.map((variant) => {
                  const variantResult = analyzeVariant(gene, variant);
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className={cx(
                        "variant-list-item",
                        selectedVariant?.id === variant.id && !draft && !customEdit && "is-active",
                      )}
                      onClick={() => chooseVariant(variant)}
                    >
                      <div className="variant-list-top">
                        <strong>{variant.name}</strong>
                        <span className={cx("variant-kind", `kind-${variantResult.tone}`)}>{variantResult.label}</span>
                      </div>
                      <span className="variant-list-phenotype">{variant.phenotype}</span>
                      <div className="variant-list-meta">
                        <span>{variant.proteinChange}</span>
                        <span>
                          {variant.edit?.type === "deletion"
                            ? variant.legacyName ?? `c.${variant.position}del`
                            : variant.edit?.type === "insertion"
                              ? `c.${variant.position}ins${variant.edit.inserted}`
                              : `c.${variant.position}${gene.sequence[variant.position - 1]}→${variant.alt}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<Beaker size={22} />} title="没有预置变异">
                这个样本适合用来练习自定义突变。选一个位置，改写它。
              </EmptyState>
            )}
          </Panel>

          <Panel
            kicker="FREEHAND EDITOR"
            title="Write your own"
            action={
              <button type="button" className="icon-link" onClick={randomise} title="随机突变">
                <Shuffle size={15} />
              </button>
            }
          >
            <div className="custom-editor">
              <Segmented
                value={editMode}
                options={[
                  { value: "substitution", label: "SNV" },
                  { value: "deletion", label: "DEL" },
                  { value: "insertion", label: "INS" },
                ]}
                onChange={(mode) => {
                  setEditMode(mode);
                  setCustomEdit(null);
                  onSelectVariant(null);
                  onDraftChange(null);
                }}
                label="Edit type"
                className="segmented--small"
              />
              <label className="field field--compact">
                <span className="field-label">Coding position <em>1–{gene.sequence.length}</em></span>
                <div className="position-row">
                  <input
                    type="number"
                    min={1}
                    max={gene.sequence.length}
                    value={safePosition}
                    onChange={(event) => {
                      const next = clamp(Number(event.target.value) || 1, 1, gene.sequence.length);
                      setCustomPosition(next);
                      if (draft) {
                        const nextRef = gene.sequence[next - 1];
                        const nextAlt =
                          draft.alt !== nextRef
                            ? draft.alt
                            : (["A", "T", "G", "C"] as const).find((base) => base !== nextRef)!;
                        onDraftChange({ position: next, alt: nextAlt, frame: draft.frame });
                      }
                    }}
                  />
                  <div className="ref-base">
                    <span>REF</span>
                    <strong style={{ color: BASE_META[refBase as keyof typeof BASE_META]?.color }}>{refBase}</strong>
                  </div>
                </div>
              </label>
              <input
                className="position-range"
                type="range"
                min={1}
                max={gene.sequence.length}
                value={safePosition}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setCustomPosition(next);
                  if (draft) {
                    const nextRef = gene.sequence[next - 1];
                    const nextAlt =
                      draft.alt !== nextRef
                        ? draft.alt
                        : (["A", "T", "G", "C"] as const).find((base) => base !== nextRef)!;
                    onDraftChange({ position: next, alt: nextAlt, frame: draft.frame });
                  }
                }}
                aria-label="Mutation position"
              />
              {editMode === "substitution" && (
                <div className="alt-row">
                  <span className="alt-row-label">MUTATE TO</span>
                  {altOptions.map((alt) => {
                    const active = draft?.position === safePosition && draft.alt === alt;
                    return (
                      <button
                        key={alt}
                        type="button"
                        className={cx("alt-base alt-base--large", active && "is-active")}
                        style={{ color: BASE_META[alt].color }}
                        onClick={() => chooseCustom(safePosition, alt)}
                      >
                        {alt}
                      </button>
                    );
                  })}
                </div>
              )}

              {editMode === "deletion" && (
                <div className="indel-control">
                  <span className="alt-row-label">DELETE</span>
                  {[1, 3, 6, 9].map((length) => (
                    <button
                      key={length}
                      type="button"
                      className={cx(
                        "indel-chip",
                        customEdit?.type === "deletion" && customEdit.position === safePosition && customEdit.length === length && "is-active",
                      )}
                      onClick={() => chooseEdit({ type: "deletion", position: safePosition, length })}
                    >
                      {length} bp
                    </button>
                  ))}
                </div>
              )}

              {editMode === "insertion" && (
                <div className="indel-control indel-control--insert">
                  <span className="alt-row-label">INSERT</span>
                  <input
                    type="text"
                    value={inserted}
                    onChange={(event) => setInserted(event.target.value.toUpperCase().replace(/[^ACGTU]/g, "").slice(0, 9))}
                    placeholder="ACGT"
                    aria-label="Inserted bases"
                  />
                  <button
                    type="button"
                    className="indel-chip indel-chip--apply"
                    disabled={!normalizeSequence(inserted)}
                    onClick={() => chooseEdit({ type: "insertion", position: safePosition, inserted: normalizeSequence(inserted) })}
                  >
                    apply
                  </button>
                </div>
              )}

              <div className="custom-preview">
                <span>
                  {customEdit?.type === "deletion"
                    ? gene.sequence.slice(customEdit.position - 1, customEdit.position - 1 + customEdit.length)
                    : previewRef}
                </span>
                <MoveRight size={14} />
                <strong>
                  {customEdit?.type === "deletion"
                    ? "—"
                    : customEdit?.type === "insertion"
                      ? customEdit.inserted
                      : previewAlt}
                </strong>
              </div>
            </div>
          </Panel>
        </div>

        <div className="variant-main">
          {result && analysisResult ? (
            <Panel className={cx("variant-detail", `tone-${result.tone}`)}>
              <div className="variant-detail-head">
                <div>
                  <div className="panel-kicker">{selectedVariant ? "CURATED VARIANT" : "CUSTOM EDIT"}</div>
                  <h2>{selectedVariant?.name ?? changeLabel}</h2>
                  <p>{selectedVariant?.phenotype ?? "用户自定义序列编辑"}</p>
                </div>
                <div className="variant-detail-badges">
                  {analysisResult.frame !== 0 && <Badge tone="violet">frame +{analysisResult.frame + 1}</Badge>}
                  <Badge tone={badgeTone(result.tone)}>{result.label}</Badge>
                </div>
              </div>

              {analysisResult.editType !== "substitution" && (
                <div className="edit-summary">
                  <Badge tone={analysisResult.kind === "frameshift" ? "coral" : "amber"}>
                    {analysisResult.kind === "frameshift" ? "frameshift" : analysisResult.kind === "in-frame-deletion" ? "in-frame deletion" : "in-frame insertion"}
                  </Badge>
                  <span>
                    {analysisResult.editType === "deletion"
                      ? `deleted ${analysisResult.deleted ?? "—"}`
                      : `inserted ${analysisResult.inserted ?? "—"}`}
                  </span>
                  <em>{analysisResult.refProteinLength} → {analysisResult.altProteinLength} aa</em>
                </div>
              )}

              <div className="allele-stage">
                <div className="allele-card allele-card--ref">
                  <span className="allele-kicker">REFERENCE</span>
                  <div className="allele-codon">
                    {analysisResult.refCodon.split("").map((base, index) => (
                      <span key={index} style={{ color: BASE_META[base as keyof typeof BASE_META]?.color }}>{base}</span>
                    ))}
                  </div>
                  <div className="allele-aa">{analysisResult.refAa === "*" ? "Stop" : `${AMINO_ACIDS[analysisResult.refAa].three} · ${AMINO_ACIDS[analysisResult.refAa].nameZh}`}</div>
                  <div className="allele-coord">c.{analysisResult.codonStart + 1}–{analysisResult.codonStart + 3}</div>
                </div>
                <div className="allele-arrow"><ArrowUpRight size={20} /></div>
                <div className="allele-card allele-card--alt">
                  <span className="allele-kicker">VARIANT</span>
                  <div className={cx("allele-codon", analysisResult.editType !== "substitution" && "allele-codon--indel")}>
                    {analysisResult.editType === "deletion" ? (
                      <span>—</span>
                    ) : analysisResult.editType === "insertion" ? (
                      <span>+{analysisResult.inserted}</span>
                    ) : (
                      analysisResult.altCodon.split("").map((base, index) => (
                        <span
                          key={index}
                          className={cx(index === (analysisResult.position - 1) % 3 && "is-changed")}
                          style={{ color: BASE_META[base as keyof typeof BASE_META]?.color }}
                        >
                          {base}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="allele-aa">
                    {analysisResult.editType === "deletion"
                      ? "residue removed"
                      : analysisResult.editType === "insertion"
                        ? `${analysisResult.inserted?.length ?? 0} bp inserted`
                        : analysisResult.altAa === "*"
                          ? "Stop"
                          : `${AMINO_ACIDS[analysisResult.altAa].three} · ${AMINO_ACIDS[analysisResult.altAa].nameZh}`}
                  </div>
                  <div className="allele-coord">
                    {analysisResult.editType === "substitution"
                      ? `${changeLabel} · c.${analysisResult.position}${analysisResult.ref}→${analysisResult.alt}`
                      : analysisResult.editType === "deletion"
                        ? `${changeLabel} · del ${analysisResult.deleted ?? ""}`
                        : `${changeLabel} · ins ${analysisResult.inserted ?? ""}`}
                  </div>
                </div>
              </div>

              <div className={cx("mutation-verdict", `verdict-${result.tone}`)}>
                <div className="verdict-icon">
                  {result.tone === "bad" ? <TriangleAlert size={18} /> : result.tone === "good" ? <Sparkles size={18} /> : <Info size={18} />}
                </div>
                <div>
                  <strong>
                    {analysisResult.kind === "frameshift"
                      ? "The reading frame is broken"
                      : analysisResult.kind === "in-frame-deletion" || analysisResult.kind === "in-frame-insertion"
                        ? "The frame is intact, but the protein is changed"
                        : result.radical
                          ? "Side-chain properties change sharply"
                          : "A more conservative substitution"}
                  </strong>
                  <p>{result.impact}</p>
                </div>
              </div>

              <div className="impact-grid">
                {impacts.map((impact) => (
                  <div className="impact-card" key={impact.label}>
                    <span>{impact.label}</span>
                    <strong>{impact.after}</strong>
                    <em>{impact.before} → <b className={`delta-${impact.tone}`}>{impact.delta}</b></em>
                  </div>
                ))}
              </div>

              <div className="variant-story">
                <div className="variant-story-label">WHY IT MATTERS</div>
                <p>{selectedVariant?.note ?? result.impact}</p>
                {selectedVariant?.source && <span className="variant-source">Source · {selectedVariant.source}</span>}
              </div>

              <div className="variant-actions">
                <button type="button" className="text-button" onClick={() => onOpenCodon(analysisResult.codonIndex, analysisResult.frame)}>
                  在工作台中查看这个密码子 <ArrowUpRight size={14} />
                </button>
                {(!selectedVariant || customEdit || draft) && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      setCustomEdit(null);
                      onDraftChange(null);
                      if (!selectedVariant) onSelectVariant(null);
                    }}
                  >
                    清除模拟
                  </button>
                )}
              </div>
              <p className="disclaimer">
                <Info size={12} /> 教学演示：突变影响判断基于序列与理化性质启发式，不构成临床解释。
              </p>
            </Panel>
          ) : (
            <Panel className="variant-empty-panel">
              <EmptyState
                icon={<FlaskConical size={26} />}
                title="Choose a variant to begin"
                action={
                  <button type="button" className="primary-button" onClick={randomise}>
                    <Shuffle size={15} /> 随机来一个
                  </button>
                }
              >
                从左侧选择一个已知变异，或使用自定义编辑器改写任意碱基。
              </EmptyState>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function VariantMap({
  gene,
  selectedVariant,
  draft,
  onSelectVariant,
  onOpenCodon,
}: {
  gene: Gene;
  selectedVariant: GeneVariant | null;
  draft: DraftMutation | null;
  onSelectVariant: (variant: GeneVariant) => void;
  onOpenCodon: (codonIndex: number, frame?: number) => void;
}) {
  const customFrame = draft?.frame ?? 0;
  const customCodon = draft
    ? Math.max(0, Math.floor((draft.position - 1 - customFrame) / 3))
    : null;
  return (
    <div className="variant-map">
      <div className="variant-map-track">
        {gene.domains.map((domain) => (
          <span
            key={`${domain.label}-${domain.start}`}
            className="variant-map-domain"
            style={{
              left: `${((domain.start - 1) / gene.protein.length) * 100}%`,
              width: `${Math.max(0.5, ((domain.end - domain.start + 1) / gene.protein.length) * 100)}%`,
              background: `${domain.color}22`,
              borderColor: `${domain.color}66`,
            }}
            title={domain.label}
          />
        ))}
        {gene.variants.map((variant, index) => {
          const position = (Math.floor((variant.position - 1) / 3) / gene.protein.length) * 100;
          return (
            <button
              key={variant.id}
              type="button"
              className={cx("variant-marker", selectedVariant?.id === variant.id && !draft && "is-active")}
              style={{ left: `${position}%`, top: `${5 + (index % 2) * 11}px` }}
              onClick={() => onSelectVariant(variant)}
              title={`${variant.name} · ${variant.proteinChange}`}
            >
              <span />
              <em>{variant.name}</em>
            </button>
          );
        })}
        {customCodon !== null && (
          <button
            type="button"
            className="variant-marker variant-marker--custom is-active"
            style={{ left: `${(customCodon / gene.protein.length) * 100}%` }}
            onClick={() => onOpenCodon(customCodon, customFrame)}
            title="自定义突变"
          >
            <span />
            <em>custom</em>
          </button>
        )}
        <div className="variant-map-ruler">
          <span>1</span>
          <span>{Math.round(gene.protein.length / 2)}</span>
          <span>{gene.protein.length} aa</span>
        </div>
      </div>
      <div className="variant-map-key">
        <span><i className="key-known" /> curated variant</span>
        <span><i className="key-custom" /> custom</span>
        <span><Dna size={12} /> click a marker to inspect</span>
      </div>
    </div>
  );
}
