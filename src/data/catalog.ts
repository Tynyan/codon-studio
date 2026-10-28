import sequencesData from "./sequences.json";
import { proteinFromCds } from "../lib/genetics";
import type { Gene, GeneMeta, SequenceRecord } from "../types";

const records = sequencesData.sequences as Record<string, SequenceRecord>;

interface CatalogEntry extends GeneMeta {
  recordKey: keyof typeof records;
}

const CATALOG: CatalogEntry[] = [
  {
    id: "HBB",
    recordKey: "HBB",
    symbol: "HBB",
    displayName: "β-globin",
    proteinName: "Hemoglobin subunit beta",
    organism: "Homo sapiens",
    locus: "11p15.4",
    accession: "NM_000518.5",
    proteinAccession: "NP_000509.1",
    region: "CDS 51..494",
    headline: "The oxygen carrier.",
    description:
      "β-珠蛋白是成人血红蛋白 HbA 的两个 β 亚基之一。每个亚基包裹一分子血红素，在肺部结合氧气，并把氧气送到全身组织。",
    fact: "HBB 编码区的一个 A→T 改变，就足以让红细胞从柔软圆盘变成镰刀形。",
    tags: ["Oxygen transport", "Heme pocket", "Sickle cell"],
    accent: "#ff8ba0",
    domains: [
      { start: 2, end: 147, label: "Globin fold", short: "Globin", color: "#77e6b2" },
      { start: 64, end: 64, label: "Distal heme histidine", short: "His64", color: "#ffd36e" },
      { start: 93, end: 93, label: "Proximal heme histidine", short: "His93", color: "#ffd36e" },
    ],
    variants: [
      {
        id: "HbS",
        name: "HbS",
        position: 20,
        alt: "T",
        proteinChange: "p.Glu7Val",
        legacyName: "p.Glu6Val (legacy)",
        phenotype: "镰状细胞贫血",
        note: "带电的 Glu 被疏水的 Val 取代。脱氧状态下 HbS 分子容易聚合，把红细胞拉成镰刀形，导致血管阻塞和溶血。",
        source: "OMIM #603903 · rs334",
        rsid: "rs334",
      },
      {
        id: "HbC",
        name: "HbC",
        position: 19,
        alt: "A",
        proteinChange: "p.Glu7Lys",
        phenotype: "HbC 性状 / 轻度溶血",
        note: "Glu→Lys 改变 β 链表面电荷，促进晶体形成与红细胞脱水。纯合 HbC 通常症状较轻。",
        source: "OMIM #141900 · rs33930165",
        rsid: "rs33930165",
      },
    ],
    sourceUrl: "https://www.ncbi.nlm.nih.gov/nuccore/NM_000518.5",
  },
  {
    id: "INS",
    recordKey: "INS",
    symbol: "INS",
    displayName: "insulin",
    proteinName: "Insulin preproprotein",
    organism: "Homo sapiens",
    locus: "11p15.5",
    accession: "NM_000207.3",
    proteinAccession: "NP_000198.1",
    region: "CDS 60..392",
    headline: "One gene, three chains.",
    description:
      "胰岛素由胰岛 β 细胞分泌，是调节血糖的核心激素。新合成的前胰岛素原经过信号肽切除与 C 肽释放，最终形成由 A、B 链组成的成熟蛋白。",
    fact: "同一段 333 bp 的编码序列，先被切成信号肽、B 链、C 肽和 A 链，再重新组合成有活性的激素。",
    tags: ["Glucose homeostasis", "Hormone", "Proteolytic processing"],
    accent: "#ffd36e",
    domains: [
      { start: 1, end: 24, label: "Signal peptide", short: "Signal", color: "#6ad7ff" },
      { start: 25, end: 54, label: "B chain", short: "B chain", color: "#ffd36e" },
      { start: 55, end: 89, label: "C peptide", short: "C peptide", color: "#b7a4ff" },
      { start: 90, end: 110, label: "A chain", short: "A chain", color: "#77e6b2" },
    ],
    variants: [],
    sourceUrl: "https://www.ncbi.nlm.nih.gov/nuccore/NM_000207.3",
  },
  {
    id: "TP53",
    recordKey: "TP53",
    symbol: "TP53",
    displayName: "p53",
    proteinName: "Cellular tumor antigen p53",
    organism: "Homo sapiens",
    locus: "17p13.1",
    accession: "NM_000546.6",
    proteinAccession: "NP_000537.3",
    region: "CDS 143..1324",
    headline: "The guardian of the genome.",
    description:
      "TP53 编码的 p53 蛋白在 DNA 损伤时决定细胞命运：暂停细胞周期、启动修复，或走向凋亡。它也是人类肿瘤中突变频率最高的基因之一。",
    fact: "p53 的 DNA 结合域只有约 200 个氨基酸，却集中了绝大多数肿瘤热点突变。",
    tags: ["Tumor suppressor", "DNA binding", "Apoptosis"],
    accent: "#b7a4ff",
    domains: [
      { start: 1, end: 42, label: "Transactivation domain", short: "TAD", color: "#ff8ba0" },
      { start: 61, end: 94, label: "Proline-rich domain", short: "PRD", color: "#ffd36e" },
      { start: 95, end: 292, label: "DNA-binding domain", short: "DBD", color: "#b7a4ff" },
      { start: 323, end: 356, label: "Tetramerization domain", short: "TET", color: "#6ad7ff" },
      { start: 363, end: 393, label: "C-terminal regulatory domain", short: "CTD", color: "#77e6b2" },
    ],
    variants: [
      {
        id: "R175H",
        name: "R175H",
        position: 524,
        alt: "A",
        proteinChange: "p.Arg175His",
        phenotype: "DNA 结合域热点突变",
        note: "Arg175 参与锌离子配位。His 取代后蛋白折叠稳定性下降，是 Li-Fraumeni 综合征等肿瘤中的经典热点。",
        source: "ClinVar · COSMIC hotspot",
      },
      {
        id: "R248Q",
        name: "R248Q",
        position: 743,
        alt: "A",
        proteinChange: "p.Arg248Gln",
        phenotype: "肿瘤热点突变",
        note: "Arg248 直接接触 DNA 骨架。Gln 取代保留部分结构，却显著削弱序列特异性 DNA 结合。",
        source: "ClinVar · COSMIC hotspot",
      },
    ],
    sourceUrl: "https://www.ncbi.nlm.nih.gov/nuccore/NM_000546.6",
  },
  {
    id: "CFTR",
    recordKey: "CFTR",
    symbol: "CFTR",
    displayName: "CFTR",
    proteinName: "Cystic fibrosis transmembrane conductance regulator",
    organism: "Homo sapiens",
    locus: "7q31.2",
    accession: "NM_000492.4",
    proteinAccession: "NP_000483.3",
    region: "CDS 71..4513",
    headline: "The channel that folds.",
    description:
      "CFTR 是上皮细胞顶膜的氯离子通道。它不只是“开门让氯离子通过”，还必须经过内质网和高尔基体的严格折叠与运输检查；F508del 正是卡在这一步。",
    fact: "F508del 只删除一个氨基酸，却让多数 CFTR 蛋白在到达细胞膜之前就被质量控制系统拦截。",
    tags: ["Ion channel", "Protein folding", "Cystic fibrosis"],
    accent: "#6ad7ff",
    domains: [
      { start: 1, end: 432, label: "Transmembrane domain 1", short: "TMD1", color: "#6ad7ff" },
      { start: 433, end: 638, label: "Nucleotide-binding domain 1", short: "NBD1", color: "#ffd36e" },
      { start: 639, end: 836, label: "Regulatory domain", short: "R", color: "#b7a4ff" },
      { start: 837, end: 1199, label: "Transmembrane domain 2", short: "TMD2", color: "#77e6b2" },
      { start: 1200, end: 1440, label: "Nucleotide-binding domain 2", short: "NBD2", color: "#ff8ba0" },
      { start: 1441, end: 1480, label: "C-terminal tail", short: "C-term", color: "#8fb8ff" },
    ],
    variants: [
      {
        id: "F508del",
        name: "F508del",
        position: 1522,
        alt: "",
        proteinChange: "p.Phe508del",
        legacyName: "c.1521_1523delCTT",
        phenotype: "囊性纤维化",
        note: "Phe508 位于 NBD1。删除 3 bp 保持读框，但缺少这个疏水残基会破坏 NBD1 折叠与结构域界面，使 CFTR 在内质网被降解或无法正常运输。",
        source: "OMIM #219700 · CFTR2",
        edit: { type: "deletion", position: 1522, length: 3, deleted: "TTT" },
      },
    ],
    sourceUrl: "https://www.ncbi.nlm.nih.gov/nuccore/NM_000492.4",
  },
  {
    id: "S",
    recordKey: "S",
    symbol: "S",
    displayName: "spike",
    proteinName: "SARS-CoV-2 surface glycoprotein",
    organism: "SARS-CoV-2",
    locus: "Wuhan-Hu-1 · 21,563–25,384",
    accession: "NC_045512.2",
    proteinAccession: "YP_009724390.1",
    region: "S CDS 21,563..25,384",
    headline: "The key to the cell.",
    description:
      "刺突蛋白介导 SARS-CoV-2 与宿主 ACE2 受体结合并驱动膜融合。S1 亚基负责识别受体，S2 亚基负责把病毒膜与细胞膜拉在一起。",
    fact: "D614G 和 N501Y 都只改变一个氨基酸，却能改变刺突蛋白的构象平衡、传播力和免疫识别。",
    tags: ["Viral entry", "ACE2 binding", "Variants"],
    accent: "#6ad7ff",
    domains: [
      { start: 1, end: 13, label: "Signal peptide", short: "SP", color: "#6ad7ff" },
      { start: 14, end: 305, label: "N-terminal domain", short: "NTD", color: "#77e6b2" },
      { start: 319, end: 541, label: "Receptor-binding domain", short: "RBD", color: "#ffd36e" },
      { start: 438, end: 506, label: "Receptor-binding motif", short: "RBM", color: "#ff8ba0" },
      { start: 686, end: 1273, label: "S2 fusion subunit", short: "S2", color: "#b7a4ff" },
      { start: 910, end: 988, label: "Heptad repeat 1", short: "HR1", color: "#6ad7ff" },
      { start: 1163, end: 1213, label: "Heptad repeat 2", short: "HR2", color: "#77e6b2" },
    ],
    variants: [
      {
        id: "D614G",
        name: "D614G",
        position: 1841,
        alt: "G",
        proteinChange: "p.Asp614Gly",
        phenotype: "传播力增强",
        note: "位于 S1/S2 交界附近，改变构象平衡，使 RBD 更容易处于开放状态。2020 年迅速成为全球主导变异。",
        source: "GISAID / Nextstrain",
      },
      {
        id: "N501Y",
        name: "N501Y",
        position: 1501,
        alt: "T",
        proteinChange: "p.Asn501Tyr",
        phenotype: "ACE2 亲和力增强",
        note: "N501 位于受体结合基序，Tyr 取代增加与 ACE2 的接触。Alpha、Beta、Gamma 等变异株均携带该突变。",
        source: "GISAID / Nextstrain",
      },
    ],
    sourceUrl: "https://www.ncbi.nlm.nih.gov/nuccore/NC_045512.2",
  },
];

export const GENES: Gene[] = CATALOG.map(({ recordKey, ...meta }) => {
  const record = records[recordKey];
  return {
    ...meta,
    sequence: record.cds,
    protein: proteinFromCds(record.cds),
  };
});

export const GENE_BY_ID = Object.fromEntries(GENES.map((gene) => [gene.id, gene])) as Record<string, Gene>;

export const DEFAULT_GENE_ID = "HBB";

export const GENE_ORDER = GENES.map((gene) => gene.id);
