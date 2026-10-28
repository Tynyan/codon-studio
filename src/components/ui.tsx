import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cx } from "../lib/cx";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cx("brand", compact && "brand--compact")}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M11 7c9.5 0 9.5 26 19 26" />
          <path d="M30 7c-9.5 0-9.5 26-19 26" />
          <path className="brand-rung" d="M14.2 13h12.1M12.5 20h15M14.2 27h12.1" />
          <circle cx="31.4" cy="8.5" r="1.8" />
          <circle cx="8.6" cy="31.5" r="1.8" />
        </svg>
      </span>
      <span className="brand-type">
        <strong>CODON</strong>
        <em>STUDIO</em>
      </span>
    </span>
  );
}

export function Badge({
  children,
  tone = "muted",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: "lime" | "muted" | "coral" | "violet" | "cyan" | "amber";
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cx("badge", `badge--${tone}`, className)}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function Panel({
  children,
  className,
  kicker,
  title,
  action,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  kicker?: string;
  title?: ReactNode;
  action?: ReactNode;
  as?: "section" | "article" | "div";
}) {
  return (
    <Tag className={cx("panel", className)}>
      {(kicker || title || action) && (
        <header className="panel-head">
          <div>
            {kicker && <div className="panel-kicker">{kicker}</div>}
            {title && <h2 className="panel-title">{title}</h2>}
          </div>
          {action && <div className="panel-action">{action}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cx("stat", className)}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cx("segmented", className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx("segmented-option", value === option.value && "is-active")}
          aria-pressed={value === option.value}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ArrowLink({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button type="button" className={cx("arrow-link", className)} onClick={onClick}>
      {children}
      <ArrowUpRight size={14} strokeWidth={1.8} />
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function ViewIntro({
  eyebrow,
  title,
  accent,
  description,
  tags,
  children,
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  description: ReactNode;
  tags?: string[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("view-intro", className)}>
      <div className="view-intro-copy">
        <div className="eyebrow">
          <span className="eyebrow-mark" />
          {eyebrow}
        </div>
        <h1 className="view-title">
          <span>{title}</span>
          {accent && <em>{accent}</em>}
        </h1>
        <p className="view-description">{description}</p>
        {tags && tags.length > 0 && (
          <div className="tag-row">
            {tags.map((tag) => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      {children && <div className="view-intro-side">{children}</div>}
    </header>
  );
}

