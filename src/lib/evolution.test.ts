import { describe, expect, it } from "vitest";
import {
  ORTHOLOGS,
  alignPair,
  buildEvolutionAnalysis,
  buildMsa,
  neighborJoining,
  treeLeaves,
} from "./evolution";

describe("pairwise protein alignment", () => {
  it("aligns identical sequences without gaps", () => {
    const result = alignPair("MVHL", "MVHL");
    expect(result.alignedA).toBe("MVHL");
    expect(result.alignedB).toBe("MVHL");
    expect(result.identity).toBe(100);
  });

  it("uses gaps to align an insertion", () => {
    const base = "MVHLTPEEKSAVTALWGK";
    const insertion = `${base.slice(0, 8)}GGGG${base.slice(8)}`;
    const result = alignPair(base, insertion);
    expect(result.alignedA).toContain("-");
    expect(result.alignedA.replace(/-/g, "")).toBe(base);
    expect(result.alignedB.replace(/-/g, "")).toBe(insertion);
    expect(result.identity).toBeGreaterThan(70);
  });
});

describe("center-star multiple alignment", () => {
  const msa = buildMsa(ORTHOLOGS);

  it("keeps every row the same length", () => {
    expect(msa.species).toHaveLength(7);
    expect(new Set(Object.values(msa.rows).map((row) => row.length))).toEqual(new Set([msa.alignmentLength]));
    expect(msa.humanColumns).toHaveLength(147);
  });

  it("rows match the input residues after gaps are removed", () => {
    for (const species of ORTHOLOGS) {
      expect(msa.rows[species.id].replace(/-/g, "")).toBe(species.sequence);
    }
  });

  it("keeps reference columns anchored to the human sequence", () => {
    for (const column of msa.columns) {
      if (column.humanPosition !== null) {
        expect(column.chars.human).not.toBe("-");
      }
    }
  });
});

describe("neighbor joining", () => {
  it("groups the two closest pairs", () => {
    const labels = ["A", "B", "C", "D"];
    const distances = [
      [0, 0.1, 0.5, 0.5],
      [0.1, 0, 0.5, 0.5],
      [0.5, 0.5, 0, 0.1],
      [0.5, 0.5, 0.1, 0],
    ];
    const tree = neighborJoining(labels, distances);
    const leaves = treeLeaves(tree);
    expect(leaves.map((leaf) => leaf.name).sort()).toEqual(labels);
    expect(tree.children).toHaveLength(2);
    expect(tree.children.every((child) => child.children.length === 2)).toBe(true);
  });

  it("produces a seven-leaf tree for HBB orthologs", () => {
    const analysis = buildEvolutionAnalysis();
    expect(treeLeaves(analysis.tree)).toHaveLength(7);
    expect(analysis.identity.labels).toHaveLength(7);
    expect(analysis.msa.alignmentLength).toBeGreaterThan(145);
    expect(analysis.msa.conservedColumns).toBeGreaterThan(10);
  });

  it("roots the tree on the zebrafish outgroup", () => {
    const analysis = buildEvolutionAnalysis();
    expect(analysis.tree.children.some((child) => child.name === "zebrafish")).toBe(true);
    expect(analysis.tree.children).toHaveLength(2);
  });

  it("keeps both heme-coordinating histidines conserved", () => {
    const analysis = buildEvolutionAnalysis();
    for (const position of [64, 93]) {
      const column = analysis.msa.columns.find((item) => item.humanPosition === position);
      expect(column).toBeDefined();
      expect(Object.values(column?.chars ?? {}).every((residue) => residue === "H")).toBe(true);
    }
  });
});
