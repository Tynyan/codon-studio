import { describe, expect, it } from "vitest";
import { GENE_BY_ID } from "../data/catalog";
import {
  analyzeEdit,
  analyzeMutation,
  chargeAtPh,
  codonUsageStats,
  findOrfs,
  gc3Content,
  gcContent,
  isoelectricPoint,
  molecularWeight,
  normalizeSequence,
  proteinFromCds,
  proteinStats,
  reverseComplement,
  translate,
} from "./genetics";
import { analyzeVariant } from "./analysis";

describe("sequence primitives", () => {
  it("normalizes FASTA, RNA and whitespace", () => {
    expect(normalizeSequence(">demo gene\natg gcu\n")).toBe("ATGGCT");
  });

  it("translates the standard genetic code and strips a terminal stop", () => {
    expect(translate("ATGGCTTAA")).toBe("MA*");
    expect(proteinFromCds("ATGGCTTAA")).toBe("MA");
  });

  it("builds the reverse complement", () => {
    expect(reverseComplement("ATGC")).toBe("GCAT");
  });

  it("computes GC and GC3", () => {
    expect(gcContent("GGCC")).toBe(100);
    expect(gc3Content("GGAGCC")).toBe(50);
  });
});

describe("real gene catalog", () => {
  it("keeps the HBB CDS and protein intact", () => {
    const hbb = GENE_BY_ID.HBB;
    expect(hbb.sequence).toHaveLength(444);
    expect(hbb.sequence.startsWith("ATGGTGCAT")).toBe(true);
    expect(hbb.protein).toHaveLength(147);
    expect(hbb.protein.startsWith("MVHLTPEEK")).toBe(true);
    expect(hbb.protein.endsWith("KYH")).toBe(true);
  });

  it("finds the full-length HBB ORF", () => {
    const orfs = findOrfs(GENE_BY_ID.HBB.sequence, 100);
    const full = orfs.find((orf) => orf.start === 0 && orf.end === 444);
    expect(full).toBeDefined();
    expect(full?.frame).toBe(1);
    expect(full?.lengthAa).toBe(147);
  });

  it("maps a reverse-strand ORF back to forward coordinates", () => {
    const orfs = findOrfs("TTAAAACAT", 1);
    const reverse = orfs.find((orf) => orf.frame === 4);
    expect(reverse).toMatchObject({ start: 0, end: 9, strand: "-", lengthAa: 2 });
  });

  it("analyzes a mutation in an alternate reading frame", () => {
    const result = analyzeMutation("CATGAAATAG", 4, "C", 1);
    expect(result.frame).toBe(1);
    expect(result.codonStart).toBe(1);
    expect(result.refCodon).toBe("ATG");
    expect(result.altCodon).toBe("ATC");
    expect([result.refAa, result.altAa]).toEqual(["M", "I"]);
    expect(result.kind).toBe("missense");
  });
});

describe("curated variant positions", () => {
  it("classifies HbS as a GAG to GTG missense change", () => {
    const result = analyzeMutation(GENE_BY_ID.HBB.sequence, 20, "T");
    expect(result.refCodon).toBe("GAG");
    expect(result.altCodon).toBe("GTG");
    expect(result.refAa).toBe("E");
    expect(result.altAa).toBe("V");
    expect(result.kind).toBe("missense");
  });

  it("classifies HbC as Glu7Lys", () => {
    const result = analyzeMutation(GENE_BY_ID.HBB.sequence, 19, "A");
    expect(result.altCodon).toBe("AAG");
    expect(result.altAa).toBe("K");
  });

  it("reproduces the TP53 R175H and R248Q hotspots", () => {
    const r175 = analyzeMutation(GENE_BY_ID.TP53.sequence, 524, "A");
    const r248 = analyzeMutation(GENE_BY_ID.TP53.sequence, 743, "A");
    expect([r175.refCodon, r175.altCodon, r175.refAa, r175.altAa]).toEqual(["CGC", "CAC", "R", "H"]);
    expect([r248.refCodon, r248.altCodon, r248.refAa, r248.altAa]).toEqual(["CGG", "CAG", "R", "Q"]);
  });

  it("reproduces the Spike D614G and N501Y substitutions", () => {
    const d614 = analyzeMutation(GENE_BY_ID.S.sequence, 1841, "G");
    const n501 = analyzeMutation(GENE_BY_ID.S.sequence, 1501, "T");
    expect([d614.refCodon, d614.altCodon, d614.refAa, d614.altAa]).toEqual(["GAT", "GGT", "D", "G"]);
    expect([n501.refCodon, n501.altCodon, n501.refAa, n501.altAa]).toEqual(["AAT", "TAT", "N", "Y"]);
  });
});

describe("indel editing", () => {
  const cftr = GENE_BY_ID.CFTR;

  it("keeps the CFTR CDS and identifies F508del as an in-frame deletion", () => {
    expect(cftr.sequence).toHaveLength(4443);
    expect(cftr.protein).toHaveLength(1480);
    const result = analyzeVariant(cftr, cftr.variants[0]);
    expect(result.analysis.editType).toBe("deletion");
    expect(result.analysis.kind).toBe("in-frame-deletion");
    expect(result.analysis.deleted).toBe("TTT");
    expect(result.analysis.refCodon).toBe("TTT");
    expect(result.analysis.refProteinLength).toBe(1480);
    expect(result.analysis.altProteinLength).toBe(1479);
    expect(result.analysis.codonIndex).toBe(507);
  });

  it("classifies a 1 bp deletion as a frameshift", () => {
    const result = analyzeEdit(cftr.sequence, { type: "deletion", position: 1522, length: 1 });
    expect(result.kind).toBe("frameshift");
    expect(result.altProteinLength).not.toBe(result.refProteinLength);
  });

  it("classifies a 3 bp insertion as in-frame", () => {
    const result = analyzeEdit("ATGGCCGCCGCCGCCGCCGCCGCCGCCGCCGCCGCCGCCGCCGCCGCCGCC", {
      type: "insertion",
      position: 3,
      inserted: "AAA",
    });
    expect(result.kind).toBe("in-frame-insertion");
    expect(result.altProteinLength).toBe(result.refProteinLength + 1);
  });
});

describe("protein properties", () => {
  it("uses residue masses minus one water per peptide bond", () => {
    expect(molecularWeight("A")).toBeCloseTo(89.09, 2);
    expect(molecularWeight("AA")).toBeCloseTo(160.165, 2);
  });

  it("returns a pI where the net charge is close to zero", () => {
    const protein = GENE_BY_ID.HBB.protein;
    const pI = isoelectricPoint(protein);
    expect(pI).toBeGreaterThan(0);
    expect(pI).toBeLessThan(14);
    expect(Math.abs(chargeAtPh(protein, pI))).toBeLessThan(0.001);
  });

  it("puts basic and acidic peptides on the expected sides of neutral", () => {
    expect(isoelectricPoint("KKKK")).toBeGreaterThan(9);
    expect(isoelectricPoint("DDDD")).toBeLessThan(4);
  });

  it("produces a bounded CAI and a complete codon table", () => {
    const stats = codonUsageStats(GENE_BY_ID.HBB.sequence);
    expect(stats.total).toBe(148);
    expect(stats.cai).toBeGreaterThan(0);
    expect(stats.cai).toBeLessThanOrEqual(1);
    expect(Object.keys(stats.counts)).toHaveLength(64);
  });

  it("reports a plausible protein snapshot", () => {
    const stats = proteinStats(GENE_BY_ID.HBB.protein);
    expect(stats.length).toBe(147);
    expect(stats.mass).toBeGreaterThan(15_000);
    expect(stats.mass).toBeLessThan(17_000);
    expect(stats.pI).toBeGreaterThan(6);
    expect(stats.pI).toBeLessThan(8);
  });
});
