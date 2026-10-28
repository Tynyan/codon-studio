import orthologData from "../data/orthologs.json";

export interface OrthologSpecies {
  id: string;
  commonName: string;
  commonNameZh: string;
  latin: string;
  accession: string;
  group: string;
  color: string;
  note: string;
  sequence: string;
}

export const ORTHOLOGS = orthologData.species as OrthologSpecies[];
export const ORTHOLOG_META = orthologData;

const BLOSUM_ORDER = "ARNDCQEGHILKMFPSTWYV";

// NCBI BLOSUM62, rows and columns in BLOSUM_ORDER.
const BLOSUM_ROWS = [
  [4, -1, -2, -2, 0, -1, -1, 0, -2, -1, -1, -1, -1, -2, -1, 1, 0, -3, -2, 0],
  [-1, 5, 0, -2, -3, 1, 0, -2, 0, -3, -2, 2, -1, -3, -2, -1, -1, -3, -2, -3],
  [-2, 0, 6, 1, -3, 0, 0, 0, 1, -3, -3, 0, -2, -3, -2, 1, 0, -4, -2, -3],
  [-2, -2, 1, 6, -3, 0, 2, -1, -1, -3, -4, -1, -3, -3, -1, 0, -1, -4, -3, -3],
  [0, -3, -3, -3, 9, -3, -4, -3, -3, -1, -1, -3, -1, -2, -3, -1, -1, -2, -2, -1],
  [-1, 1, 0, 0, -3, 5, 2, -2, 0, -3, -2, 1, 0, -3, -1, 0, -1, -2, -1, -2],
  [-1, 0, 0, 2, -4, 2, 5, -2, 0, -3, -3, 1, -2, -3, -1, 0, -1, -3, -2, -2],
  [0, -2, 0, -1, -3, -2, -2, 6, -2, -4, -4, -2, -3, -3, -2, 0, -2, -2, -3, -3],
  [-2, 0, 1, -1, -3, 0, 0, -2, 8, -3, -3, -1, -2, -1, -2, -1, -2, -2, 2, -3],
  [-1, -3, -3, -3, -1, -3, -3, -4, -3, 4, 2, -3, 1, 0, -3, -2, -1, -3, -1, 3],
  [-1, -2, -3, -4, -1, -2, -3, -4, -3, 2, 4, -2, 2, 0, -3, -2, -1, -2, -1, 1],
  [-1, 2, 0, -1, -3, 1, 1, -2, -1, -3, -2, 5, -1, -3, -1, 0, -1, -3, -2, -2],
  [-1, -1, -2, -3, -1, 0, -2, -3, -2, 1, 2, -1, 5, 0, -2, -1, -1, -1, -1, 1],
  [-2, -3, -3, -3, -2, -3, -3, -3, -1, 0, 0, -3, 0, 6, -4, -2, -2, 1, 3, -1],
  [-1, -2, -2, -1, -3, -1, -1, -2, -2, -3, -3, -1, -2, -4, 7, -1, -1, -4, -3, -2],
  [1, -1, 1, 0, -1, 0, 0, 0, -1, -2, -2, 0, -1, -2, -1, 4, 1, -3, -2, -2],
  [0, -1, 0, -1, -1, -1, -1, -2, -2, -1, -1, -1, -1, -2, -1, 1, 5, -2, -2, 0],
  [-3, -3, -4, -4, -2, -2, -3, -2, -2, -3, -2, -3, -1, 1, -4, -3, -2, 11, 2, -3],
  [-2, -2, -2, -3, -2, -1, -2, -3, 2, -1, -1, -2, -1, 3, -3, -2, -2, 2, 7, -1],
  [0, -3, -3, -3, -1, -2, -2, -3, -3, 3, 1, -2, 1, -1, -2, -2, 0, -3, -1, 4],
];

const BLOSUM62 = new Map<string, number>();
BLOSUM_ROWS.forEach((row, rowIndex) => {
  row.forEach((score, columnIndex) => {
    BLOSUM62.set(`${BLOSUM_ORDER[rowIndex]}:${BLOSUM_ORDER[columnIndex]}`, score);
  });
});

export function blosumScore(a: string, b: string): number {
  return BLOSUM62.get(`${a}:${b}`) ?? -4;
}

export interface PairwiseAlignment {
  alignedA: string;
  alignedB: string;
  score: number;
  identity: number;
}

const GAP_PENALTY = -6;

function maxIndex(values: number[]): number {
  let index = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[index]) index = i;
  }
  return index;
}

/** Global Needleman–Wunsch alignment with BLOSUM62 and a linear gap penalty. */
export function alignPair(a: string, b: string): PairwiseAlignment {
  const n = a.length;
  const m = b.length;
  const scores = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const trace = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));

  for (let i = 1; i <= n; i += 1) {
    scores[i][0] = i * GAP_PENALTY;
    trace[i][0] = 1;
  }
  for (let j = 1; j <= m; j += 1) {
    scores[0][j] = j * GAP_PENALTY;
    trace[0][j] = 2;
  }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const candidates = [
        scores[i - 1][j - 1] + blosumScore(a[i - 1], b[j - 1]),
        scores[i - 1][j] + GAP_PENALTY,
        scores[i][j - 1] + GAP_PENALTY,
      ];
      const choice = maxIndex(candidates);
      scores[i][j] = candidates[choice];
      trace[i][j] = choice;
    }
  }

  let i = n;
  let j = m;
  const alignedA: string[] = [];
  const alignedB: string[] = [];
  while (i > 0 || j > 0) {
    const choice = trace[i][j];
    if (choice === 0 && i > 0 && j > 0) {
      alignedA.push(a[i - 1]);
      alignedB.push(b[j - 1]);
      i -= 1;
      j -= 1;
    } else if (choice === 1 && i > 0) {
      alignedA.push(a[i - 1]);
      alignedB.push("-");
      i -= 1;
    } else {
      alignedA.push("-");
      alignedB.push(b[j - 1]);
      j -= 1;
    }
  }

  const reverseA = alignedA.reverse().join("");
  const reverseB = alignedB.reverse().join("");
  let matches = 0;
  for (let index = 0; index < reverseA.length; index += 1) {
    if (reverseA[index] === reverseB[index] && reverseA[index] !== "-") matches += 1;
  }
  return {
    alignedA: reverseA,
    alignedB: reverseB,
    score: scores[n][m],
    identity: reverseA.length ? (matches / reverseA.length) * 100 : 0,
  };
}

export interface MsaColumn {
  id: number;
  chars: Record<string, string>;
  humanPosition: number | null;
  conservation: number;
  gapFraction: number;
  consensus: string;
}

export interface MsaResult {
  species: OrthologSpecies[];
  columns: MsaColumn[];
  rows: Record<string, string>;
  humanColumns: number[];
  alignmentLength: number;
  conservedColumns: number;
}

export function buildMsa(species: OrthologSpecies[], centerId = "human"): MsaResult {
  const center = species.find((item) => item.id === centerId) ?? species[0];
  if (!center) throw new Error("MSA requires at least one sequence");

  const baseColumns = center.sequence.split("").map((char, index) => ({
    chars: { [center.id]: char } as Record<string, string>,
    humanPosition: index + 1,
  }));
  const insertions = new Map<number, Array<{ chars: Record<string, string> }>>();

  for (const other of species) {
    if (other.id === center.id) continue;
    const alignment = alignPair(center.sequence, other.sequence);
    let centerPosition = 0;
    let insertionOrdinal = 0;

    for (let index = 0; index < alignment.alignedA.length; index += 1) {
      const centerChar = alignment.alignedA[index];
      const otherChar = alignment.alignedB[index];
      if (centerChar !== "-") {
        if (baseColumns[centerPosition]) {
          baseColumns[centerPosition].chars[other.id] = otherChar;
        }
        centerPosition += 1;
        insertionOrdinal = 0;
      } else if (otherChar !== "-") {
        const boundary = insertions.get(centerPosition) ?? [];
        if (!boundary[insertionOrdinal]) boundary.push({ chars: {} });
        boundary[insertionOrdinal].chars[other.id] = otherChar;
        insertionOrdinal += 1;
        insertions.set(centerPosition, boundary);
      }
    }
  }

  const ordered: Array<{ chars: Record<string, string>; humanPosition: number | null }> = [];
  for (let boundary = 0; boundary <= center.sequence.length; boundary += 1) {
    for (const insertion of insertions.get(boundary) ?? []) {
      ordered.push({ chars: insertion.chars, humanPosition: null });
    }
    if (boundary < baseColumns.length) {
      ordered.push({ chars: baseColumns[boundary].chars, humanPosition: baseColumns[boundary].humanPosition });
    }
  }

  const columns: MsaColumn[] = ordered.map((column, index) => {
    const chars: Record<string, string> = {};
    for (const item of species) {
      chars[item.id] = column.chars[item.id] ?? "-";
    }
    const residues = Object.values(chars).filter((char) => char !== "-");
    const counts = residues.reduce<Record<string, number>>((acc, char) => {
      acc[char] = (acc[char] ?? 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const modal = entries[0];
    const conservation = modal ? modal[1] / species.length : 0;
    return {
      id: index,
      chars,
      humanPosition: column.humanPosition,
      conservation,
      gapFraction: (species.length - residues.length) / species.length,
      consensus: modal && modal[1] >= Math.ceil(species.length * 0.6) ? modal[0] : "·",
    };
  });

  const rows: Record<string, string> = {};
  for (const item of species) {
    rows[item.id] = columns.map((column) => column.chars[item.id] ?? "-").join("");
  }

  const humanColumns = columns
    .filter((column) => column.humanPosition !== null)
    .map((column) => column.id);

  return {
    species,
    columns,
    rows,
    humanColumns,
    alignmentLength: columns.length,
    conservedColumns: columns.filter((column) => column.conservation >= 0.99).length,
  };
}

export interface IdentityMatrix {
  labels: string[];
  values: number[][];
}

export function identityMatrix(msa: MsaResult): IdentityMatrix {
  const labels = msa.species.map((item) => item.id);
  const values = labels.map((row) =>
    labels.map((column) => {
      if (row === column) return 100;
      let compared = 0;
      let identical = 0;
      for (const msaColumn of msa.columns) {
        const a = msaColumn.chars[row];
        const b = msaColumn.chars[column];
        if (a !== "-" && b !== "-") {
          compared += 1;
          if (a === b) identical += 1;
        }
      }
      return compared ? (identical / compared) * 100 : 0;
    }),
  );
  return { labels, values };
}

export interface TreeNode {
  id: string;
  name?: string;
  children: TreeNode[];
  length: number;
}

export function neighborJoining(labels: string[], values: number[][]): TreeNode {
  if (labels.length < 2) {
    return { id: labels[0] ?? "root", name: labels[0], children: [], length: 0 };
  }

  const distances = new Map<string, Map<string, number>>();
  for (const label of labels) {
    distances.set(label, new Map(labels.map((other) => [other, label === other ? 0 : 0])));
  }
  labels.forEach((row, rowIndex) => {
    labels.forEach((column, columnIndex) => {
      distances.get(row)?.set(column, values[rowIndex]?.[columnIndex] ?? 0);
    });
  });

  const nodes = new Map<string, TreeNode>(
    labels.map((label) => [label, { id: label, name: label, children: [], length: 0 }]),
  );
  let active = [...labels];
  let internalIndex = 1;

  while (active.length > 2) {
    const count = active.length;
    const rowSums = new Map<string, number>();
    for (const a of active) {
      rowSums.set(a, active.reduce((sum, b) => sum + (distances.get(a)?.get(b) ?? 0), 0));
    }

    let bestA = active[0];
    let bestB = active[1];
    let bestQ = Number.POSITIVE_INFINITY;
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const a = active[i];
        const b = active[j];
        const q = (count - 2) * (distances.get(a)?.get(b) ?? 0) - (rowSums.get(a) ?? 0) - (rowSums.get(b) ?? 0);
        if (q < bestQ) {
          bestQ = q;
          bestA = a;
          bestB = b;
        }
      }
    }

    const distanceAB = distances.get(bestA)?.get(bestB) ?? 0;
    const limbA = 0.5 * distanceAB + ((rowSums.get(bestA) ?? 0) - (rowSums.get(bestB) ?? 0)) / (2 * (count - 2));
    const limbB = distanceAB - limbA;
    const nodeA = nodes.get(bestA);
    const nodeB = nodes.get(bestB);
    if (nodeA) nodeA.length = Math.max(0, limbA);
    if (nodeB) nodeB.length = Math.max(0, limbB);

    const id = `internal-${internalIndex}`;
    internalIndex += 1;
    const parent: TreeNode = { id, children: [nodeA ?? { id: bestA, children: [], length: 0 }, nodeB ?? { id: bestB, children: [], length: 0 }], length: 0 };
    nodes.set(id, parent);

    const next = new Map<string, number>();
    const uDistances = new Map<string, number>();
    for (const other of active) {
      if (other === bestA || other === bestB) continue;
      const d = 0.5 * ((distances.get(bestA)?.get(other) ?? 0) + (distances.get(bestB)?.get(other) ?? 0) - distanceAB);
      next.set(other, d);
      uDistances.set(other, d);
      distances.get(other)?.set(id, d);
    }
    distances.set(id, uDistances);
    active = [...active.filter((label) => label !== bestA && label !== bestB), id];
  }

  const [a, b] = active;
  const rootDistance = distances.get(a)?.get(b) ?? 0;
  const nodeA = nodes.get(a) ?? { id: a, children: [], length: 0 };
  const nodeB = nodes.get(b) ?? { id: b, children: [], length: 0 };
  nodeA.length = Math.max(0, rootDistance / 2);
  nodeB.length = Math.max(0, rootDistance / 2);
  return { id: "root", children: [nodeA, nodeB], length: 0 };
}

export function treeLeaves(node: TreeNode): TreeNode[] {
  if (!node.children.length) return [node];
  return node.children.flatMap(treeLeaves);
}

/**
 * Root an unrooted NJ tree on the branch leading to a chosen outgroup.
 * The display root gets two children: the outgroup and the remaining clade.
 */
export function rerootAtOutgroup(root: TreeNode, outgroupId: string): TreeNode {
  type Edge = { node: TreeNode; length: number };
  const graph = new Map<string, Edge[]>();
  const index = new Map<string, TreeNode>();

  const add = (a: string, b: string, length: number) => {
    if (!graph.has(a)) graph.set(a, []);
    if (!graph.has(b)) graph.set(b, []);
    graph.get(a)?.push({ node: index.get(b)!, length });
    graph.get(b)?.push({ node: index.get(a)!, length });
  };

  const walk = (node: TreeNode) => {
    index.set(node.id, node);
    if (!graph.has(node.id)) graph.set(node.id, []);
    for (const child of node.children) {
      index.set(child.id, child);
      walk(child);
    }
  };
  walk(root);
  const register = (node: TreeNode) => {
    for (const child of node.children) {
      add(node.id, child.id, child.length);
      register(child);
    }
  };
  register(root);

  const outEdges = graph.get(outgroupId);
  if (!outEdges || outEdges.length !== 1) return root;
  const neighbor = outEdges[0];

  const build = (node: TreeNode, parentId: string, incomingLength: number): TreeNode => ({
    id: node.id,
    name: node.children.length ? undefined : node.name,
    length: incomingLength,
    children: (graph.get(node.id) ?? [])
      .filter((edge) => edge.node.id !== parentId)
      .map((edge) => build(edge.node, node.id, edge.length)),
  });

  const rest = build(neighbor.node, outgroupId, 0);
  const outgroup = index.get(outgroupId);
  if (!outgroup) return root;
  return {
    id: `rooted-${outgroupId}`,
    children: [rest, { ...outgroup, children: [], length: neighbor.length }],
    length: 0,
  };
}

export interface EvolutionAnalysis {
  msa: MsaResult;
  identity: IdentityMatrix;
  tree: TreeNode;
  distances: number[][];
}

export function buildEvolutionAnalysis(): EvolutionAnalysis {
  const msa = buildMsa(ORTHOLOGS);
  const identity = identityMatrix(msa);
  const distances = identity.values.map((row) => row.map((value) => 1 - value / 100));
  const tree = rerootAtOutgroup(neighborJoining(identity.labels, distances), "zebrafish");
  return { msa, identity, tree, distances };
}
