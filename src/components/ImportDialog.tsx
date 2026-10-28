import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Dna, LockKeyhole, Upload } from "lucide-react";
import { gcContent, normalizeSequence, proteinFromCds, proteinStats } from "../lib/genetics";
import { formatInt } from "../lib/format";
import type { CustomGeneInput } from "../types";
import { Modal } from "./Modal";
import { Badge } from "./ui";

const MAX_BP = 20_000;

export function ImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (input: CustomGeneInput) => void;
}) {
  const [name, setName] = useState("");
  const [sequence, setSequence] = useState("");
  const [touched, setTouched] = useState(false);

  const parsed = useMemo(() => {
    const normalized = normalizeSequence(sequence);
    const header = sequence
      .split(/\r?\n/)
      .find((line) => line.trim().startsWith(">"))
      ?.slice(1)
      .split(/\s+/)
      .slice(0, 3)
      .join(" ");
    const invalid = normalized.replace(/[ACGT]/g, "");
    const tooLong = normalized.length > MAX_BP;
    const validBases = normalized.length > 0 && !invalid;
    const protein = validBases ? proteinFromCds(normalized) : "";
    const stats = protein ? proteinStats(protein) : null;
    let error = "";
    if (touched && !normalized) error = "没有检测到有效的 A / T / G / C 碱基。";
    if (invalid) {
      const unique = Array.from(new Set(invalid.split(""))).slice(0, 8).join(" ");
      error = `序列包含不支持的字符：${unique}。请只使用 A / T / G / C（U 会自动转换为 T）。`;
    }
    if (tooLong) error = `序列过长（${formatInt(normalized.length)} bp），请控制在 ${formatInt(MAX_BP)} bp 以内。`;
    return {
      normalized,
      header,
      protein,
      stats,
      gc: validBases ? gcContent(normalized) : 0,
      error,
      partial: validBases && normalized.length % 3 !== 0,
    };
  }, [sequence, touched]);

  const canSubmit =
    parsed.normalized.length > 0 &&
    !parsed.error &&
    parsed.normalized.length <= MAX_BP &&
    /^[ACGT]+$/.test(parsed.normalized);

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onImport({
      name: name.trim() || parsed.header || "Imported sequence",
      sequence: parsed.normalized,
      note: parsed.header ? `FASTA · ${parsed.header}` : "Imported locally",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="IMPORT / FASTA OR RAW DNA"
      title="Bring your own sequence"
      className="import-modal"
    >
      <div className="import-layout">
        <div className="import-fields">
          <label className="field">
            <span className="field-label">Sequence name <em>optional</em></span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={parsed.header || "例如：My construct / SARS-CoV-2 ORF"}
              maxLength={80}
            />
          </label>

          <label className="field">
            <span className="field-label">
              Coding DNA sequence <em>from ATG · FASTA header optional</em>
            </span>
            <textarea
              className="sequence-input"
              value={sequence}
              onChange={(event) => {
                setSequence(event.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder={">my_sequence\nATGGTGCATCTGACTCCTGAGGAGAAGTCT..."}
              spellCheck={false}
              rows={10}
            />
          </label>

          <div className="import-hint">
            <LockKeyhole size={14} />
            <span>序列只在当前浏览器中解析和保存，不会上传到服务器。<br />建议从起始密码子 ATG 开始粘贴 CDS；若包含 UTR，翻译会从第一个碱基按 +1 框读取。</span>
          </div>
        </div>

        <aside className="import-preview">
          <div className="preview-kicker">LOCAL PREVIEW</div>
          <div className="preview-dna"><Dna size={20} /></div>
          <h3>{name.trim() || parsed.header || "Untitled sequence"}</h3>
          <p className="preview-sub">Coding sequence · standard genetic code</p>

          <div className="preview-stats">
            <div>
              <strong>{formatInt(parsed.normalized.length)}</strong>
              <span>base pairs</span>
            </div>
            <div>
              <strong>{formatInt(parsed.protein.replace(/\*/g, "").length)}</strong>
              <span>amino acids</span>
            </div>
            <div>
              <strong>{parsed.gc.toFixed(1)}%</strong>
              <span>GC content</span>
            </div>
            <div>
              <strong>{parsed.stats ? parsed.stats.pI.toFixed(1) : "—"}</strong>
              <span>theoretical pI</span>
            </div>
          </div>

          <div className="preview-flags">
            {parsed.error ? (
              <Badge tone="coral"><AlertTriangle size={12} /> {parsed.error}</Badge>
            ) : parsed.normalized ? (
              <Badge tone="lime"><CheckCircle2 size={12} /> {parsed.partial ? "末尾密码子不完整，将按部分翻译" : "可翻译的完整 CDS"}</Badge>
            ) : (
              <Badge tone="muted">等待输入序列</Badge>
            )}
          </div>

          {parsed.normalized && (
            <div className="preview-sequence" aria-label="Sequence preview">
              <span>{parsed.normalized.slice(0, 48)}</span>
              <span className="preview-ellipsis">···</span>
              <span>{parsed.normalized.slice(-24)}</span>
            </div>
          )}

          <button type="button" className="primary-button preview-submit" onClick={submit} disabled={!canSubmit}>
            <Upload size={15} />
            加入工作台
          </button>
          <p className="preview-note">最多 {formatInt(MAX_BP)} bp · 支持 FASTA 或纯序列 · U 自动转换为 T</p>
        </aside>
      </div>
    </Modal>
  );
}
