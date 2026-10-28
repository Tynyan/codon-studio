import { normalizeSequence, proteinFromCds, gcContent, isValidSequence } from "./genetics";
import type { CustomGeneInput, Gene } from "../types";

export const CUSTOM_GENE_STORAGE_KEY = "codon-studio:custom-genes";

export function createCustomGene(input: CustomGeneInput): Gene {
  const sequence = normalizeSequence(input.sequence);
  if (!isValidSequence(sequence)) {
    throw new Error("Sequence must contain only A, T, G and C bases.");
  }
  const name = input.name.trim() || "Untitled sequence";
  const id = `CUSTOM-${Date.now().toString(36).toUpperCase()}`;
  const protein = proteinFromCds(sequence);
  const gc = gcContent(sequence);

  return {
    id,
    symbol: "CUSTOM",
    displayName: name,
    proteinName: "User-provided coding sequence",
    organism: "Custom sequence",
    locus: input.note?.trim() || "Imported locally",
    accession: "USER",
    proteinAccession: "—",
    region: sequence.length % 3 === 0 ? "Complete codons" : "Partial final codon",
    headline: "Your sequence, decoded.",
    description:
      "这是一条在浏览器本地导入的自定义序列。所有翻译、ORF、密码子偏好和突变分析都在客户端完成，序列不会离开你的设备。",
    fact: `${sequence.length.toLocaleString("zh-CN")} bp · ${gc.toFixed(1)}% GC · ${protein.length.toLocaleString("zh-CN")} aa`,
    tags: ["Custom sequence", "Local only", "Client-side"],
    accent: "#c8ff5e",
    domains: [],
    variants: [],
    sourceUrl: "",
    sequence,
    protein,
    isCustom: true,
  };
}

export function loadCustomGenes(): Gene[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_GENE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Gene[];
    return Array.isArray(parsed)
      ? parsed.filter((gene) => gene?.isCustom && typeof gene.sequence === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveCustomGenes(genes: Gene[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOM_GENE_STORAGE_KEY, JSON.stringify(genes));
  } catch {
    // A full or disabled localStorage should not break the app.
  }
}

export function getGeneInitials(gene: Gene): string {
  if (gene.id === "S") return "S";
  return gene.symbol.slice(0, 3);
}
