import {
  AMINO_ACIDS,
  analyzeMutation,
  baseComposition,
  classifyMutation,
  codonUsageStats,
  findOrfs,
  gc3Content,
  gcContent,
  gcSeries,
  hydropathySeries,
  longestOrf,
  mutationTone,
  proteinStats,
  reverseComplement,
  translate,
  type AminoAcidCode,
  type MutationAnalysis,
} from "./genetics";
import type { Gene, GeneVariant, MutationFilter } from "../types";

export interface GeneAnalysis {
  length: number;
  proteinLength: number;
  gc: number;
  gc3: number;
  bases: ReturnType<typeof baseComposition>;
  protein: ReturnType<typeof proteinStats>;
  orfs: ReturnType<typeof findOrfs>;
  longest: ReturnType<typeof longestOrf>;
  codon: ReturnType<typeof codonUsageStats>;
  gcSeries: ReturnType<typeof gcSeries>;
  hydropathy: ReturnType<typeof hydropathySeries>;
}

export function analyzeGene(gene: Gene): GeneAnalysis {
  const protein = proteinStats(gene.protein);
  const orfs = findOrfs(gene.sequence, 20);
  return {
    length: gene.sequence.length,
    proteinLength: gene.protein.replace(/\*/g, "").length,
    gc: gcContent(gene.sequence),
    gc3: gc3Content(gene.sequence),
    bases: baseComposition(gene.sequence),
    protein,
    orfs,
    longest: longestOrf(orfs),
    codon: codonUsageStats(gene.sequence),
    gcSeries: gcSeries(gene.sequence, 72),
    hydropathy: hydropathySeries(gene.protein, 9),
  };
}

export interface VariantResult {
  variant: GeneVariant | null;
  analysis: MutationAnalysis;
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
  radical: boolean;
  impact: string;
}

export function analyzeVariant(gene: Gene, variant: GeneVariant): VariantResult {
  return buildVariantResult(gene, variant.position, variant.alt, variant);
}

export function buildVariantResult(
  gene: Gene,
  position: number,
  alt: string,
  variant: GeneVariant | null = null,
): VariantResult {
  const analysis = analyzeMutation(gene.sequence, position, alt);
  const radical =
    Math.abs(analysis.hydropathyDelta) >= 1.5 ||
    Math.abs(analysis.chargeDelta) >= 0.8 ||
    analysis.kind === "nonsense" ||
    analysis.kind === "stop-loss";
  return {
    variant,
    analysis,
    label: classifyMutation(analysis),
    tone: mutationTone(analysis.kind),
    radical,
    impact: describeImpact(analysis, radical),
  };
}

function describeImpact(analysis: MutationAnalysis, radical: boolean): string {
  if (analysis.kind === "synonymous") {
    return "氨基酸没有改变，但密码子使用频率和翻译动力学仍可能受影响。";
  }
  if (analysis.kind === "nonsense") {
    return "提前出现终止密码子，蛋白可能被截短，通常具有强烈破坏性。";
  }
  if (analysis.kind === "stop-loss") {
    return "终止密码子被替换，翻译会继续延伸到下一个终止信号。";
  }
  if (radical) {
    return "侧链性质变化明显：疏水性或电荷差异可能影响折叠、结合或稳定性。";
  }
  return "侧链性质相近，属于较保守的替换；但仍需结构或实验证据判断功能影响。";
}

export interface PropertyImpact {
  label: string;
  before: string;
  after: string;
  delta: string;
  tone: "up" | "down" | "flat";
}

export function getPropertyImpacts(analysis: MutationAnalysis): PropertyImpact[] {
  const beforeStats = proteinStats(analysis.refProtein);
  const afterStats = proteinStats(analysis.altProtein);
  return [
    makeImpact("分子量", beforeStats.mass, afterStats.mass, " Da", 1),
    makeImpact("理论 pI", beforeStats.pI, afterStats.pI, "", 2),
    makeImpact("GRAVY", beforeStats.gravy, afterStats.gravy, "", 3),
    makeImpact("净电荷 @7.4", beforeStats.charge, afterStats.charge, "", 2),
  ];
}

function makeImpact(
  label: string,
  before: number,
  after: number,
  suffix: string,
  digits: number,
): PropertyImpact {
  const delta = after - before;
  return {
    label,
    before: `${before.toFixed(digits)}${suffix}`,
    after: `${after.toFixed(digits)}${suffix}`,
    delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(digits)}${suffix}`,
    tone: Math.abs(delta) < 10 ** -digits ? "flat" : delta > 0 ? "up" : "down",
  };
}

export function filterVariants(gene: Gene, filter: MutationFilter): GeneVariant[] {
  if (filter === "all") return gene.variants;
  return gene.variants.filter((variant) => {
    const result = analyzeVariant(gene, variant);
    return result.analysis.kind === filter;
  });
}

export function aminoColor(code: string): string {
  const aa = AMINO_ACIDS[code as AminoAcidCode];
  if (!aa) return "#78857c";
  switch (aa.group) {
    case "hydrophobic":
      return "#ffd36e";
    case "polar":
      return "#6ad7ff";
    case "acidic":
      return "#ff8ba0";
    case "basic":
      return "#b7a4ff";
    case "special":
      return "#77e6b2";
    default:
      return "#78857c";
  }
}

export function hydropathyRegions(
  points: Array<{ position: number; value: number }>,
  threshold = 1.6,
  minLength = 8,
): Array<{ start: number; end: number }> {
  const regions: Array<{ start: number; end: number }> = [];
  let start: number | null = null;
  for (const point of points) {
    if (point.value > threshold) {
      start ??= point.position;
    } else if (start !== null) {
      if (point.position - start >= minLength) regions.push({ start, end: point.position - 1 });
      start = null;
    }
  }
  if (start !== null && points.length && points[points.length - 1].position - start >= minLength) {
    regions.push({ start, end: points[points.length - 1].position });
  }
  return regions;
}

export function sixFrameTranslation(sequence: string): Array<{ frame: number; label: string; protein: string }> {
  const plus = [0, 1, 2].map((offset) => ({
    frame: offset + 1,
    label: `+${offset + 1}`,
    protein: translate(sequence, offset),
  }));
  const reverse = reverseComplement(sequence);
  const minus = [0, 1, 2].map((offset) => ({
    frame: offset + 4,
    label: `-${offset + 1}`,
    protein: translate(reverse, offset),
  }));
  return [...plus, ...minus];
}

export function percentOf(value: number, total: number): number {
  return total ? (value / total) * 100 : 0;
}

export function positionToCodon(position: number): number {
  return Math.floor((Math.max(1, position) - 1) / 3);
}

export function codonToPosition(codonIndex: number): number {
  return codonIndex * 3 + 1;
}
