import { useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, Dna, Search, Trash2, Upload } from "lucide-react";
import type { Gene } from "../types";
import { Badge, EmptyState } from "./ui";
import { cx } from "../lib/cx";
import { Modal } from "./Modal";

export function GeneLibrary({
  open,
  onClose,
  genes,
  currentId,
  onSelect,
  onOpenImport,
  onDeleteCustom,
}: {
  open: boolean;
  onClose: () => void;
  genes: Gene[];
  currentId: string;
  onSelect: (id: string) => void;
  onOpenImport: () => void;
  onDeleteCustom: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return genes;
    return genes.filter((gene) =>
      [gene.symbol, gene.displayName, gene.proteinName, gene.organism, ...gene.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [genes, query]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="SAMPLE LIBRARY / 04 BUILT-IN + YOURS"
      title="Choose a sequence"
      wide
    >
      <div className="library-toolbar">
        <label className="search-field">
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索基因、蛋白、物种或标签"
            aria-label="搜索基因"
          />
        </label>
        <span className="library-count">{filtered.length} sequences</span>
        <button type="button" className="primary-button" onClick={onOpenImport}>
          <Upload size={15} />
          导入自己的序列
        </button>
      </div>

      {filtered.length ? (
        <div className="gene-grid">
          {filtered.map((gene) => (
            <article
              key={gene.id}
              className={cx("gene-card", currentId === gene.id && "is-current")}
              style={{ "--gene-accent": gene.accent } as CSSProperties}
            >
              <button
                type="button"
                className="gene-card-main"
                onClick={() => {
                  onSelect(gene.id);
                  onClose();
                }}
              >
                <div className="gene-card-top">
                  <span className="gene-symbol">{gene.symbol}</span>
                  {currentId === gene.id && <Badge tone="lime" dot>当前</Badge>}
                </div>
                <h3>{gene.displayName}</h3>
                <p>{gene.description}</p>
                <div className="gene-card-meta">
                  <span>{gene.sequence.length.toLocaleString("zh-CN")} bp</span>
                  <span>{gene.protein.length.toLocaleString("zh-CN")} aa</span>
                  <span>{gene.variants.length} variants</span>
                </div>
                <div className="gene-card-foot">
                  <span>{gene.organism}</span>
                  <span className="gene-open">Open <ArrowRight size={13} /></span>
                </div>
              </button>
              {gene.isCustom && (
                <button
                  type="button"
                  className="gene-delete"
                  aria-label={`删除 ${gene.displayName}`}
                  title="删除自定义序列"
                  onClick={() => {
                    if (window.confirm(`删除本地序列“${gene.displayName}”？`)) onDeleteCustom(gene.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Dna size={24} />} title="没有匹配的序列">
          试试基因名、物种，或者直接导入一条 FASTA 序列。
        </EmptyState>
      )}

      <div className="library-foot">
        <span>内置样本来自 NCBI RefSeq / GenBank，序列已随项目离线打包。</span>
        <span>自定义序列仅保存在当前浏览器。</span>
      </div>
    </Modal>
  );
}
