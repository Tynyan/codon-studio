import codonUsageData from "../data/codonUsage.json";

export type Nucleotide = "A" | "T" | "G" | "C";
export type AminoAcidCode =
  | "A"
  | "R"
  | "N"
  | "D"
  | "C"
  | "Q"
  | "E"
  | "G"
  | "H"
  | "I"
  | "L"
  | "K"
  | "M"
  | "F"
  | "P"
  | "S"
  | "T"
  | "W"
  | "Y"
  | "V"
  | "*";

export type AminoAcidGroup = "hydrophobic" | "polar" | "acidic" | "basic" | "special" | "stop";

export interface AminoAcid {
  code: AminoAcidCode;
  three: string;
  name: string;
  nameZh: string;
  group: AminoAcidGroup;
  hydropathy: number;
  mass: number;
  charge: -1 | 0 | 1;
}

export const AMINO_ACIDS: Record<AminoAcidCode, AminoAcid> = {
  A: { code: "A", three: "Ala", name: "Alanine", nameZh: "丙氨酸", group: "hydrophobic", hydropathy: 1.8, mass: 89.09, charge: 0 },
  R: { code: "R", three: "Arg", name: "Arginine", nameZh: "精氨酸", group: "basic", hydropathy: -4.5, mass: 174.2, charge: 1 },
  N: { code: "N", three: "Asn", name: "Asparagine", nameZh: "天冬酰胺", group: "polar", hydropathy: -3.5, mass: 132.12, charge: 0 },
  D: { code: "D", three: "Asp", name: "Aspartic acid", nameZh: "天冬氨酸", group: "acidic", hydropathy: -3.5, mass: 133.1, charge: -1 },
  C: { code: "C", three: "Cys", name: "Cysteine", nameZh: "半胱氨酸", group: "special", hydropathy: 2.5, mass: 121.15, charge: 0 },
  Q: { code: "Q", three: "Gln", name: "Glutamine", nameZh: "谷氨酰胺", group: "polar", hydropathy: -3.5, mass: 146.15, charge: 0 },
  E: { code: "E", three: "Glu", name: "Glutamic acid", nameZh: "谷氨酸", group: "acidic", hydropathy: -3.5, mass: 147.13, charge: -1 },
  G: { code: "G", three: "Gly", name: "Glycine", nameZh: "甘氨酸", group: "special", hydropathy: -0.4, mass: 75.07, charge: 0 },
  H: { code: "H", three: "His", name: "Histidine", nameZh: "组氨酸", group: "basic", hydropathy: -3.2, mass: 155.16, charge: 1 },
  I: { code: "I", three: "Ile", name: "Isoleucine", nameZh: "异亮氨酸", group: "hydrophobic", hydropathy: 4.5, mass: 131.17, charge: 0 },
  L: { code: "L", three: "Leu", name: "Leucine", nameZh: "亮氨酸", group: "hydrophobic", hydropathy: 3.8, mass: 131.17, charge: 0 },
  K: { code: "K", three: "Lys", name: "Lysine", nameZh: "赖氨酸", group: "basic", hydropathy: -3.9, mass: 146.19, charge: 1 },
  M: { code: "M", three: "Met", name: "Methionine", nameZh: "甲硫氨酸", group: "hydrophobic", hydropathy: 1.9, mass: 149.21, charge: 0 },
  F: { code: "F", three: "Phe", name: "Phenylalanine", nameZh: "苯丙氨酸", group: "hydrophobic", hydropathy: 2.8, mass: 165.19, charge: 0 },
  P: { code: "P", three: "Pro", name: "Proline", nameZh: "脯氨酸", group: "special", hydropathy: -1.6, mass: 115.13, charge: 0 },
  S: { code: "S", three: "Ser", name: "Serine", nameZh: "丝氨酸", group: "polar", hydropathy: -0.8, mass: 105.09, charge: 0 },
  T: { code: "T", three: "Thr", name: "Threonine", nameZh: "苏氨酸", group: "polar", hydropathy: -0.7, mass: 119.12, charge: 0 },
  W: { code: "W", three: "Trp", name: "Tryptophan", nameZh: "色氨酸", group: "hydrophobic", hydropathy: -0.9, mass: 204.23, charge: 0 },
  Y: { code: "Y", three: "Tyr", name: "Tyrosine", nameZh: "酪氨酸", group: "polar", hydropathy: -1.3, mass: 181.19, charge: 0 },
  V: { code: "V", three: "Val", name: "Valine", nameZh: "缬氨酸", group: "hydrophobic", hydropathy: 4.2, mass: 117.15, charge: 0 },
  "*": { code: "*", three: "Stop", name: "Stop codon", nameZh: "终止密码子", group: "stop", hydropathy: 0, mass: 0, charge: 0 },
};

export const AMINO_ACID_ORDER: AminoAcidCode[] = [
  "A", "R", "N", "D", "C", "Q", "E", "G", "H", "I",
  "L", "K", "M", "F", "P", "S", "T", "W", "Y", "V",
];

// Standard genetic code, NCBI table 1. Built in T/C/A/G order.
const CODON_TABLE: Record<string, AminoAcidCode> = (() => {
  const aas = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
  const table: Record<string, AminoAcidCode> = {};
  const bases: Nucleotide[] = ["T", "C", "A", "G"];
  let index = 0;
  for (const first of bases) {
    for (const second of bases) {
      for (const third of bases) {
        table[`${first}${second}${third}`] = aas[index] as AminoAcidCode;
        index += 1;
      }
    }
  }
  return table;
})();

export const CODON_TO_AA = CODON_TABLE;
export const CODONS = Object.keys(CODON_TABLE).sort();

export const AA_TO_CODONS = CODONS.reduce<Record<string, string[]>>((acc, codon) => {
  const aa = CODON_TABLE[codon];
  (acc[aa] ??= []).push(codon);
  return acc;
}, {});

export const STOP_CODONS = ["TAA", "TAG", "TGA"] as const;

export const BASE_META: Record<
  Nucleotide,
  { label: string; name: string; color: string; complement: Nucleotide }
> = {
  A: { label: "A", name: "Adenine", color: "#ff8ba0", complement: "T" },
  T: { label: "T", name: "Thymine", color: "#6ad7ff", complement: "A" },
  G: { label: "G", name: "Guanine", color: "#ffd36e", complement: "C" },
  C: { label: "C", name: "Cytosine", color: "#b7a4ff", complement: "G" },
};

export const COMPLEMENT: Record<Nucleotide, Nucleotide> = {
  A: "T",
  T: "A",
  G: "C",
  C: "G",
};

export const GROUP_META: Record<
  AminoAcidGroup,
  { label: string; labelZh: string; color: string }
> = {
  hydrophobic: { label: "Hydrophobic", labelZh: "疏水", color: "#ffd36e" },
  polar: { label: "Polar", labelZh: "极性", color: "#6ad7ff" },
  acidic: { label: "Acidic", labelZh: "酸性", color: "#ff8ba0" },
  basic: { label: "Basic", labelZh: "碱性", color: "#b7a4ff" },
  special: { label: "Special", labelZh: "特殊", color: "#77e6b2" },
  stop: { label: "Stop", labelZh: "终止", color: "#78857c" },
};

export interface CodonUsageEntry {
  aminoAcid: string;
  fraction: number;
  perThousand: number;
  count: number;
}

export const HUMAN_CODON_USAGE = codonUsageData.codons as Record<string, CodonUsageEntry>;
export const CODON_USAGE_META = codonUsageData;

export function isNucleotide(char: string): char is Nucleotide {
  return char === "A" || char === "T" || char === "G" || char === "C";
}

export function normalizeSequence(input: string): string {
  return input
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(">"))
    .join("")
    .toUpperCase()
    .replace(/U/g, "T")
    .replace(/\s/g, "");
}

export function isValidSequence(sequence: string): boolean {
  return sequence.length > 0 && /^[ACGT]+$/.test(sequence);
}

export function reverseComplement(sequence: string): string {
  return sequence
    .split("")
    .reverse()
    .map((base) => (isNucleotide(base) ? COMPLEMENT[base] : base))
    .join("");
}

export function toRna(sequence: string): string {
  return sequence.replace(/T/g, "U");
}

export function translateCodon(codon: string): AminoAcidCode {
  return CODON_TABLE[codon] ?? "*";
}

export function translate(sequence: string, frame = 0): string {
  let protein = "";
  for (let index = frame; index + 3 <= sequence.length; index += 3) {
    protein += translateCodon(sequence.slice(index, index + 3));
  }
  return protein;
}

export function proteinFromCds(sequence: string): string {
  const protein = translate(sequence);
  return protein.endsWith("*") ? protein.slice(0, -1) : protein;
}

export function getCodon(sequence: string, codonIndex: number): string {
  const start = codonIndex * 3;
  return sequence.slice(start, start + 3);
}

export function mutateSequence(sequence: string, position: number, alt: string): string {
  if (position < 1 || position > sequence.length) return sequence;
  return `${sequence.slice(0, position - 1)}${alt}${sequence.slice(position)}`;
}

export function gcContent(sequence: string): number {
  if (!sequence.length) return 0;
  const gc = sequence.split("").filter((base) => base === "G" || base === "C").length;
  return (gc / sequence.length) * 100;
}

export function baseComposition(sequence: string): Record<Nucleotide, number> {
  return sequence.split("").reduce(
    (acc, base) => {
      if (isNucleotide(base)) acc[base] += 1;
      return acc;
    },
    { A: 0, T: 0, G: 0, C: 0 },
  );
}

export function gc3Content(sequence: string): number {
  let gc = 0;
  let total = 0;
  for (let index = 2; index < sequence.length; index += 3) {
    const base = sequence[index];
    if (base === "G" || base === "C") gc += 1;
    total += 1;
  }
  return total ? (gc / total) * 100 : 0;
}

export function molecularWeight(protein: string): number {
  const residues = protein.split("").filter((aa) => aa !== "*" && aa in AMINO_ACIDS);
  if (!residues.length) return 0;
  const mass = residues.reduce((sum, aa) => sum + AMINO_ACIDS[aa as AminoAcidCode].mass, 0);
  return mass - 18.015 * (residues.length - 1);
}

const PKA = {
  nTerm: 9.69,
  cTerm: 2.34,
  D: 3.65,
  E: 4.25,
  C: 8.18,
  Y: 10.07,
  H: 6.0,
  K: 10.5,
  R: 12.5,
};

export function chargeAtPh(protein: string, ph: number): number {
  const residues = protein.split("");
  if (!residues.length) return 0;
  let charge = 1 / (1 + 10 ** (ph - PKA.nTerm)) - 1 / (1 + 10 ** (PKA.cTerm - ph));
  for (const aa of residues) {
    if (aa === "D") charge -= 1 / (1 + 10 ** (PKA.D - ph));
    if (aa === "E") charge -= 1 / (1 + 10 ** (PKA.E - ph));
    if (aa === "C") charge -= 1 / (1 + 10 ** (PKA.C - ph));
    if (aa === "Y") charge -= 1 / (1 + 10 ** (PKA.Y - ph));
    if (aa === "H") charge += 1 / (1 + 10 ** (ph - PKA.H));
    if (aa === "K") charge += 1 / (1 + 10 ** (ph - PKA.K));
    if (aa === "R") charge += 1 / (1 + 10 ** (ph - PKA.R));
  }
  return charge;
}

export function isoelectricPoint(protein: string): number {
  if (!protein.split("").some((aa) => aa !== "*")) return 0;
  let low = 0;
  let high = 14;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    if (chargeAtPh(protein, mid) > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function gravy(protein: string): number {
  const residues = protein.split("").filter((aa) => aa !== "*" && aa in AMINO_ACIDS);
  if (!residues.length) return 0;
  return residues.reduce((sum, aa) => sum + AMINO_ACIDS[aa as AminoAcidCode].hydropathy, 0) / residues.length;
}

export function aromaticity(protein: string): number {
  const residues = protein.split("");
  if (!residues.length) return 0;
  return (residues.filter((aa) => aa === "F" || aa === "W" || aa === "Y").length / residues.length) * 100;
}

export function aliphaticIndex(protein: string): number {
  const residues = protein.split("").filter((aa) => aa !== "*");
  if (!residues.length) return 0;
  const counts = countAminoAcids(residues.join(""));
  return (
    (100 * (counts.A + 2.9 * counts.V + 3.9 * (counts.I + counts.L))) / residues.length
  );
}

export function countAminoAcids(protein: string): Record<string, number> {
  const counts = Object.fromEntries(AMINO_ACID_ORDER.map((aa) => [aa, 0])) as Record<string, number>;
  for (const aa of protein) {
    if (aa in counts) counts[aa] += 1;
  }
  return counts;
}

export interface ProteinStats {
  length: number;
  mass: number;
  pI: number;
  gravy: number;
  charge: number;
  aromaticity: number;
  aliphaticIndex: number;
}

export function proteinStats(protein: string): ProteinStats {
  const length = protein.split("").filter((aa) => aa !== "*").length;
  return {
    length,
    mass: molecularWeight(protein),
    pI: isoelectricPoint(protein),
    gravy: gravy(protein),
    charge: chargeAtPh(protein, 7.4),
    aromaticity: aromaticity(protein),
    aliphaticIndex: aliphaticIndex(protein),
  };
}

export interface HydropathyPoint {
  index: number;
  position: number;
  value: number;
}

export function hydropathySeries(protein: string, windowSize = 9): HydropathyPoint[] {
  const residues = protein.split("");
  const half = Math.floor(windowSize / 2);
  return residues.map((aa, index) => {
    if (aa === "*") return { index, position: index + 1, value: 0 };
    let sum = 0;
    let count = 0;
    for (let offset = -half; offset <= half; offset += 1) {
      const neighbor = residues[index + offset];
      if (neighbor && neighbor !== "*" && neighbor in AMINO_ACIDS) {
        sum += AMINO_ACIDS[neighbor as AminoAcidCode].hydropathy;
        count += 1;
      }
    }
    return { index, position: index + 1, value: count ? sum / count : 0 };
  });
}

export interface GcPoint {
  position: number;
  gc: number;
}

export function gcSeries(sequence: string, points = 64): GcPoint[] {
  if (!sequence.length) return [];
  if (sequence.length < 6) return [{ position: 1, gc: gcContent(sequence) }];
  const window = Math.min(sequence.length, Math.max(6, Math.ceil(sequence.length / points)));
  const step = Math.max(1, Math.floor((sequence.length - window) / Math.max(1, points - 1)));
  const series: GcPoint[] = [];
  for (let start = 0; start + window <= sequence.length; start += step) {
    series.push({ position: start + Math.floor(window / 2), gc: gcContent(sequence.slice(start, start + window)) });
    if (series.length >= points) break;
  }
  return series;
}

export interface Orf {
  id: string;
  frame: number;
  strand: "+" | "-";
  start: number;
  end: number;
  lengthBp: number;
  lengthAa: number;
  protein: string;
  sequence: string;
}

/**
 * Find every ATG-to-stop open reading frame in all six reading frames.
 * Coordinates are 0-based, half-open, and always relative to the forward strand.
 */
export function findOrfs(sequence: string, minAa = 1): Orf[] {
  const orfs: Orf[] = [];
  const reverse = reverseComplement(sequence);
  const frames: Array<{ frame: number; strand: "+" | "-"; offset: number; seq: string }> = [
    { frame: 1, strand: "+", offset: 0, seq: sequence },
    { frame: 2, strand: "+", offset: 1, seq: sequence.slice(1) },
    { frame: 3, strand: "+", offset: 2, seq: sequence.slice(2) },
    { frame: 4, strand: "-", offset: 0, seq: reverse },
    { frame: 5, strand: "-", offset: 1, seq: reverse.slice(1) },
    { frame: 6, strand: "-", offset: 2, seq: reverse.slice(2) },
  ];

  for (const { frame, strand, offset, seq } of frames) {
    for (let start = 0; start + 3 <= seq.length; start += 3) {
      if (seq.slice(start, start + 3) !== "ATG") continue;
      for (let cursor = start + 3; cursor + 3 <= seq.length; cursor += 3) {
        const codon = seq.slice(cursor, cursor + 3);
        if (!STOP_CODONS.includes(codon as (typeof STOP_CODONS)[number])) continue;
        const end = cursor + 3;
        const protein = translate(seq.slice(start, end));
        const lengthAa = protein.length - 1;
        if (lengthAa < minAa) break;
        const forwardStart =
          strand === "+" ? offset + start : sequence.length - (offset + end);
        const forwardEnd =
          strand === "+" ? offset + end : sequence.length - (offset + start);
        orfs.push({
          id: `${frame}-${forwardStart}-${forwardEnd}`,
          frame,
          strand,
          start: forwardStart,
          end: forwardEnd,
          lengthBp: end - start,
          lengthAa,
          protein,
          sequence:
            strand === "+"
              ? sequence.slice(forwardStart, forwardEnd)
              : reverse.slice(start, end),
        });
        break;
      }
    }
  }

  const seen = new Set<string>();
  return orfs
    .filter((orf) => {
      if (seen.has(orf.id)) return false;
      seen.add(orf.id);
      return true;
    })
    .sort((a, b) => b.lengthAa - a.lengthAa || a.start - b.start);
}

export function longestOrf(orfs: Orf[]): Orf | null {
  return orfs.reduce<Orf | null>((best, orf) => (!best || orf.lengthAa > best.lengthAa ? orf : best), null);
}

export interface CodonUsageStats {
  counts: Record<string, number>;
  total: number;
  cai: number;
  gc3: number;
  rare: Array<{ codon: string; count: number; fraction: number }>;
  top: Array<{ codon: string; count: number }>;
}

export function codonUsageStats(sequence: string): CodonUsageStats {
  const counts = Object.fromEntries(CODONS.map((codon) => [codon, 0])) as Record<string, number>;
  let total = 0;
  for (let index = 0; index + 3 <= sequence.length; index += 3) {
    const codon = sequence.slice(index, index + 3);
    if (codon in counts) {
      counts[codon] += 1;
      total += 1;
    }
  }

  const logWeights: number[] = [];
  for (const [codon, count] of Object.entries(counts)) {
    if (count === 0 || codon === "TAA" || codon === "TAG" || codon === "TGA") continue;
    const aa = CODON_TO_AA[codon];
    const synonymous = AA_TO_CODONS[aa] ?? [];
    const maxFraction = Math.max(...synonymous.map((item) => HUMAN_CODON_USAGE[item]?.fraction ?? 0));
    const fraction = HUMAN_CODON_USAGE[codon]?.fraction ?? 0;
    if (maxFraction > 0 && fraction > 0) {
      logWeights.push(Math.log(fraction / maxFraction));
    }
  }
  const cai = logWeights.length
    ? Math.exp(logWeights.reduce((sum, value) => sum + value, 0) / logWeights.length)
    : 0;

  const rare = Object.entries(counts)
    .filter(
      ([codon, count]) =>
        count > 0 &&
        !STOP_CODONS.includes(codon as (typeof STOP_CODONS)[number]) &&
        (HUMAN_CODON_USAGE[codon]?.fraction ?? 1) < 0.15,
    )
    .map(([codon, count]) => ({ codon, count, fraction: HUMAN_CODON_USAGE[codon]?.fraction ?? 0 }))
    .sort((a, b) => a.fraction - b.fraction || b.count - a.count);

  const top = Object.entries(counts)
    .filter(([codon, count]) => count > 0 && !STOP_CODONS.includes(codon as (typeof STOP_CODONS)[number]))
    .map(([codon, count]) => ({ codon, count }))
    .sort((a, b) => b.count - a.count || a.codon.localeCompare(b.codon))
    .slice(0, 8);

  return {
    counts,
    total,
    cai,
    gc3: gc3Content(sequence),
    rare,
    top,
  };
}

export type MutationKind = "synonymous" | "missense" | "nonsense" | "stop-loss" | "untranslated";

export interface MutationAnalysis {
  position: number;
  ref: string;
  alt: string;
  codonIndex: number;
  codonStart: number;
  refCodon: string;
  altCodon: string;
  refAa: AminoAcidCode;
  altAa: AminoAcidCode;
  kind: MutationKind;
  refProtein: string;
  altProtein: string;
  massDelta: number;
  hydropathyDelta: number;
  chargeDelta: number;
  pIDelta: number;
}

export function analyzeMutation(sequence: string, position: number, alt: string): MutationAnalysis {
  const ref = sequence[position - 1] ?? "";
  const codonIndex = Math.floor((position - 1) / 3);
  const codonStart = codonIndex * 3;
  const refCodon = sequence.slice(codonStart, codonStart + 3);
  const altCodon = `${refCodon.slice(0, (position - 1) % 3)}${alt}${refCodon.slice(((position - 1) % 3) + 1)}`;
  const refAa = translateCodon(refCodon);
  const altAa = translateCodon(altCodon);
  const refProtein = proteinFromCds(sequence);
  const mutated = mutateSequence(sequence, position, alt);
  const altProtein = proteinFromCds(mutated);

  let kind: MutationKind = "missense";
  if (refCodon.length < 3) kind = "untranslated";
  else if (refAa === "*" && altAa !== "*") kind = "stop-loss";
  else if (altAa === "*" && refAa !== "*") kind = "nonsense";
  else if (refAa === altAa) kind = "synonymous";

  const refStats = proteinStats(refProtein);
  const altStats = proteinStats(altProtein);

  return {
    position,
    ref,
    alt,
    codonIndex,
    codonStart,
    refCodon,
    altCodon,
    refAa,
    altAa,
    kind,
    refProtein,
    altProtein,
    massDelta: altStats.mass - refStats.mass,
    hydropathyDelta: altStats.gravy - refStats.gravy,
    chargeDelta: altStats.charge - refStats.charge,
    pIDelta: altStats.pI - refStats.pI,
  };
}

export function classifyMutation(analysis: MutationAnalysis): string {
  switch (analysis.kind) {
    case "synonymous":
      return "同义突变";
    case "missense":
      return "错义突变";
    case "nonsense":
      return "无义突变";
    case "stop-loss":
      return "终止密码子丢失";
    default:
      return "非编码区";
  }
}

export function mutationTone(kind: MutationKind): "good" | "warn" | "bad" | "neutral" {
  if (kind === "synonymous") return "good";
  if (kind === "missense") return "warn";
  if (kind === "nonsense" || kind === "stop-loss") return "bad";
  return "neutral";
}

export function orfSummary(orfs: Orf[]) {
  const longest = longestOrf(orfs);
  const codingBp = orfs.reduce((sum, orf) => sum + orf.lengthBp, 0);
  return {
    count: orfs.length,
    longest,
    longestLength: longest?.lengthAa ?? 0,
    codingBp,
  };
}
