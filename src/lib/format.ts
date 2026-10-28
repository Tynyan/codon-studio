const integer = new Intl.NumberFormat("zh-CN");

export function formatInt(value: number): string {
  return integer.format(Math.round(value));
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function formatSigned(value: number, digits = 2): string {
  const rounded = Math.abs(value) < 10 ** -digits ? 0 : value;
  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(digits)}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatMass(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} kDa`;
  return `${value.toFixed(1)} Da`;
}

export function formatPosition(position: number): string {
  return `c.${position}`;
}

export function formatCodonIndex(index: number): string {
  return `C${index + 1}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function truncateMiddle(value: string, max = 18): string {
  if (value.length <= max) return value;
  const half = Math.floor((max - 1) / 2);
  return `${value.slice(0, half)}…${value.slice(-half)}`;
}

export function downloadText(filename: string, content: string, type = "text/plain"): void {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
