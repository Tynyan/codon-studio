import { BookOpen, ChevronDown, Share2, ShieldCheck, Upload } from "lucide-react";
import type { Gene, ViewId } from "../types";
import { Brand } from "./ui";
import { cx } from "../lib/cx";
import { NAV_ITEMS, VIEW_TITLES } from "../lib/navigation";

export function Sidebar({
  gene,
  view,
  onViewChange,
  onOpenLibrary,
  onOpenMethod,
}: {
  gene: Gene;
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  onOpenLibrary: () => void;
  onOpenMethod: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <button
          type="button"
          className="brand-button"
          onClick={() => onViewChange("workbench")}
          aria-label="Codon Studio home"
        >
          <Brand />
        </button>
        <span className="sidebar-edition">LAB / 01</span>
      </div>

      <div className="sidebar-scroll">
        <div className="nav-label">Workspace</div>
        <nav className="side-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cx("side-nav-item", view === item.id && "is-active")}
                onClick={() => onViewChange(item.id)}
                aria-current={view === item.id ? "page" : undefined}
              >
                <span className="nav-index">{item.index}</span>
                <Icon size={17} strokeWidth={1.6} />
                <span className="nav-copy">
                  <strong>{item.label}</strong>
                  <em>{item.english}</em>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="nav-label nav-label--spaced">Reference</div>
        <button
          type="button"
          className={cx("side-nav-item side-nav-item--compact", view === "methods" && "is-active")}
          onClick={onOpenMethod}
        >
          <span className="nav-index">06</span>
          <BookOpen size={17} strokeWidth={1.6} />
          <span className="nav-copy">
            <strong>方法与数据</strong>
            <em>Methods &amp; data</em>
          </span>
        </button>

        <div className="sample-card">
          <div className="sample-card-top">
            <span>Active sample</span>
            <span className="sample-live"><i /> live</span>
          </div>
          <div className="sample-main">
            <div className="sample-glyph" style={{ borderColor: `${gene.accent}55`, color: gene.accent }}>
              {gene.id === "S" ? "S" : gene.symbol}
            </div>
            <div>
              <strong>{gene.displayName}</strong>
              <span>{gene.organism}</span>
            </div>
          </div>
          <div className="sample-meta">
            <span>{gene.sequence.length.toLocaleString("zh-CN")} bp</span>
            <span>{gene.protein.length.toLocaleString("zh-CN")} aa</span>
            <span>{gene.variants.length} variants</span>
          </div>
          <button type="button" className="sample-switch" onClick={onOpenLibrary}>
            切换样本 <ChevronDown size={13} />
          </button>
        </div>

        <div className="local-note">
          <ShieldCheck size={15} />
          <div>
            <strong>Local by design</strong>
            <span>所有计算在浏览器内完成，序列不上传。</span>
          </div>
        </div>
      </div>

      <div className="sidebar-foot">
        <span>CODON STUDIO</span>
        <span>v1.0 · MIT</span>
      </div>
    </aside>
  );
}

export function Topbar({
  gene,
  view,
  onOpenLibrary,
  onOpenImport,
  onShare,
}: {
  gene: Gene;
  view: ViewId;
  onOpenLibrary: () => void;
  onOpenImport: () => void;
  onShare: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-context">
        <span className="topbar-root">CODON STUDIO</span>
        <span className="topbar-slash">/</span>
        <span className="topbar-current">{VIEW_TITLES[view]}</span>
        <span className="topbar-status"><i /> analysis ready</span>
      </div>
      <div className="topbar-actions">
        <button type="button" className="ghost-button gene-button" onClick={onOpenLibrary}>
          <span className="gene-button-dot" style={{ background: gene.accent }} />
          <span>{gene.symbol}</span>
          <span className="gene-button-name">{gene.displayName}</span>
          <ChevronDown size={14} />
        </button>
        <button type="button" className="icon-button" onClick={onShare} aria-label="分享当前视图链接" title="分享链接">
          <Share2 size={17} />
        </button>
        <button type="button" className="primary-button" onClick={onOpenImport}>
          <Upload size={15} />
          <span>导入 FASTA</span>
        </button>
      </div>
    </header>
  );
}

export function MobileNav({
  gene,
  view,
  onViewChange,
  onOpenLibrary,
  onOpenImport,
  onShare,
}: {
  gene: Gene;
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  onOpenLibrary: () => void;
  onOpenImport: () => void;
  onShare: () => void;
}) {
  return (
    <div className="mobile-shell">
      <div className="mobile-bar">
        <button type="button" className="brand-button" onClick={() => onViewChange("workbench")}>
          <Brand compact />
        </button>
        <div className="mobile-actions">
          <button type="button" className="ghost-button gene-button" onClick={onOpenLibrary}>
            <span className="gene-button-dot" style={{ background: gene.accent }} />
            {gene.symbol}
            <ChevronDown size={13} />
          </button>
          <button type="button" className="icon-button" onClick={onShare} aria-label="分享当前视图链接">
            <Share2 size={16} />
          </button>
          <button type="button" className="icon-button" onClick={onOpenImport} aria-label="导入 FASTA">
            <Upload size={17} />
          </button>
        </div>
      </div>
      <div className="mobile-tabs" aria-label="Views">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx("mobile-tab", view === item.id && "is-active")}
            onClick={() => onViewChange(item.id)}
          >
            <span>{item.index}</span>
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className={cx("mobile-tab", view === "methods" && "is-active")}
          onClick={() => onViewChange("methods")}
        >
          <span>06</span>
          方法
        </button>
      </div>
    </div>
  );
}
