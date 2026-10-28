export type ViewId = "workbench" | "frames" | "protein" | "variants" | "codons" | "evolution" | "methods";

export type SequenceEdit =
  | { type: "substitution"; position: number; alt: string }
  | { type: "deletion"; position: number; length: number; deleted?: string }
  | { type: "insertion"; position: number; inserted: string };

export interface SequenceRecord {
  accession: string;
  proteinAccession: string;
  region: string;
  cds: string;
}

export interface GeneVariant {
  id: string;
  name: string;
  position: number;
  alt: string;
  proteinChange: string;
  legacyName?: string;
  phenotype: string;
  note: string;
  source: string;
  rsid?: string;
  edit?: SequenceEdit;
}

export interface DomainAnnotation {
  start: number;
  end: number;
  label: string;
  short: string;
  color: string;
  approximate?: boolean;
}

export interface GeneMeta {
  id: string;
  symbol: string;
  displayName: string;
  proteinName: string;
  organism: string;
  locus: string;
  accession: string;
  proteinAccession: string;
  region: string;
  description: string;
  headline: string;
  fact: string;
  tags: string[];
  accent: string;
  domains: DomainAnnotation[];
  variants: GeneVariant[];
  sourceUrl: string;
}

export interface Gene extends GeneMeta {
  sequence: string;
  protein: string;
  isCustom?: boolean;
}

export interface CustomGeneInput {
  name: string;
  sequence: string;
  note?: string;
}

export type MutationFilter = "all" | "synonymous" | "missense" | "nonsense";
