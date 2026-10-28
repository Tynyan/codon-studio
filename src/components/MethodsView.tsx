import {
  BookOpen,
  Code2,
  Database,
  ExternalLink,
  FlaskConical,
  Info,
  LockKeyhole,
  Sigma,
  TriangleAlert,
} from "lucide-react";
import { GENES } from "../data/catalog";
import { CODON_USAGE_META } from "../lib/genetics";
import { Badge, Panel, ViewIntro } from "./ui";

const REFERENCES = [
  {
    title: "NCBI RefSeq",
    detail: "HBB NM_000518.5 · INS NM_000207.3 · TP53 NM_000546.6 · CFTR NM_000492.4",
    href: "https://www.ncbi.nlm.nih.gov/refseq/",
  },
  {
    title: "NCBI Protein · HBB orthologs",
    detail: "Seven vertebrate beta-globin records used in the evolution view",
    href: "https://www.ncbi.nlm.nih.gov/protein/",
  },
  {
    title: "NCBI GenBank · SARS-CoV-2",
    detail: "Wuhan-Hu-1 complete genome NC_045512.2, spike CDS 21,563–25,384",
    href: "https://www.ncbi.nlm.nih.gov/nuccore/NC_045512.2",
  },
  {
    title: "Kazusa codon usage database",
    detail: "Homo sapiens, 93,487 CDS, 40,662,582 codons",
    href: "https://www.kazusa.or.jp/codon/",
  },
  {
    title: "Henikoff & Henikoff, 1992",
    detail: "Amino acid substitution matrices from protein blocks (BLOSUM62)",
    href: "https://doi.org/10.1073/pnas.89.22.10915",
  },
  {
    title: "Saitou & Nei, 1987",
    detail: "The neighbor-joining method for phylogenetic tree reconstruction",
    href: "https://doi.org/10.1093/oxfordjournals.molbev.a040454",
  },
  {
    title: "Kyte & Doolittle, 1982",
    detail: "A simple method for displaying the hydropathic character of a protein",
    href: "https://doi.org/10.1016/0022-2836(82)90515-0",
  },
  {
    title: "Sharp & Li, 1987",
    detail: "The codon adaptation index — a measure of directional synonymous codon usage bias",
    href: "https://doi.org/10.1093/nar/15.3.1281",
  },
  {
    title: "Wrapp et al., 2020",
    detail: "Cryo-EM structure of the 2019-nCoV spike in the prefusion conformation",
    href: "https://doi.org/10.1126/science.abb2507",
  },
];

export function MethodsView() {
  return (
    <div className="view view--methods">
      <ViewIntro
        eyebrow={<>METHODS / DATA / LIMITATIONS</>}
        title="Show your"
        accent="work."
        description="这个项目把每一个数字都拆成可检查的步骤：序列从哪里来、密码子怎样翻译、ORF 如何定义、多序列比对和进化树如何构建、pI 和 CAI 用什么公式，以及哪些结论不能从一条序列里直接得出。"
        tags={["Reproducible", "Open source", "Client-side", "MIT"]}
      >
        <div className="mini-stat-grid">
          <div><span>Built-in genes</span><strong>{GENES.length}</strong><em>real sequences</em></div>
          <div><span>Codons</span><strong>64</strong><em>standard code</em></div>
          <div><span>Server calls</span><strong>0</strong><em>at runtime</em></div>
          <div><span>License</span><strong>MIT</strong><em>open source</em></div>
        </div>
      </ViewIntro>

      <div className="methods-grid">
        <Panel className="method-data" kicker="DATA PROVENANCE" title="Where the sequences come from" action={<Database size={17} />}>
          <p className="panel-copy">
            所有内置序列都通过 NCBI E-utilities 获取并随项目离线打包。重新生成数据只需运行
            <code>python scripts/fetch-data.py</code>。Evolution 视图使用 7 条 HBB 同源蛋白（人、小鼠、大鼠、牛、鸡、非洲爪蟾、斑马鱼），其中爪蟾记录来自 GenBank。
          </p>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Gene</th><th>Accession</th><th>Region</th><th>Source</th></tr>
              </thead>
              <tbody>
                {GENES.map((gene) => (
                  <tr key={gene.id}>
                    <td><strong>{gene.symbol}</strong><span>{gene.organism}</span></td>
                    <td className="mono">{gene.accession}</td>
                    <td>{gene.region}</td>
                    <td>
                      <a href={gene.sourceUrl} target="_blank" rel="noreferrer">
                        NCBI <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="data-foot">
            <span><LockKeyhole size={12} /> 导入序列只保存在 localStorage，不会上传。</span>
            <span>Codon table: {CODON_USAGE_META.dataset}</span>
          </div>
        </Panel>

        <Panel className="method-formulas" kicker="ALGORITHMS" title="The calculations" action={<Sigma size={18} />}>
          <div className="formula-list">
            <div>
              <strong>Translation</strong>
              <p>标准遗传密码（NCBI table 1），按 3 bp 读取；遇到 TAA / TAG / TGA 终止。显示时支持 +1 / +2 / +3 三个阅读框。</p>
            </div>
            <div>
              <strong>Six-frame ORF</strong>
              <p>正向与反向互补序列各取 3 个相位，从每个 ATG 扫描到同框终止密码子。默认展示 ≥20 aa 的 ORF，并按长度排序。</p>
            </div>
            <div>
              <strong>Indels / frameshift</strong>
              <p>把编辑写成“位置 + 长度 + 插入序列”，重新翻译整条 CDS。长度变化不是 3 的倍数时判为 frameshift；否则判为整码缺失 / 插入，并比较蛋白长度、终止位置和理化性质。</p>
            </div>
            <div>
              <strong>MSA / neighbor joining</strong>
              <p>以人 HBB 为中心序列，使用 BLOSUM62 和线性空位罚分做成对全局比对，再投影成中心星多序列比对。两两 identity 转成 p-distance，用 Neighbor-Joining 建树并以斑马鱼为外群。</p>
            </div>
            <div>
              <strong>Molecular weight</strong>
              <p><code>Σ residue mass − 18.015 × (n − 1)</code>，使用平均残基质量，单位为 Da。</p>
            </div>
            <div>
              <strong>Isoelectric point</strong>
              <p>用 Henderson–Hasselbalch 计算 pH 0–14 的净电荷，再二分搜索 <code>charge(pH) = 0</code>。pKa 使用常用侧链近似值。</p>
            </div>
            <div>
              <strong>GRAVY / hydropathy</strong>
              <p>Kyte–Doolittle 疏水性标度，窗口 9 aa 滑动平均。越正越疏水，越负越亲水。</p>
            </div>
            <div>
              <strong>CAI</strong>
              <p><code>exp(mean(ln(w)))</code>，其中 <code>w = f(codon) / max f(synonymous)</code>，参考 Kazusa 人类密码子频率。终止密码子不参与。</p>
            </div>
            <div>
              <strong>GC3</strong>
              <p>编码序列第三位碱基中 G / C 的比例，常用于观察密码子使用偏好和突变压力。</p>
            </div>
          </div>
        </Panel>

        <Panel className="method-limits" kicker="INTERPRETATION" title="What this tool cannot tell you" action={<TriangleAlert size={17} />}>
          <ul className="limit-list">
            <li><span>01</span><p>理化性质变化是启发式指标，不等于致病性预测；真实影响需要结构、保守性、实验和临床证据。</p></li>
            <li><span>02</span><p>ORF 只是“可能编码”的开放阅读框，不代表真实启动子、剪接位点或翻译产物。</p></li>
            <li><span>03</span><p>CAI 使用人类参考表；病毒、细菌或叶绿体基因的密码子偏好需要换成对应宿主 / 物种的参考集。</p></li>
            <li><span>04</span><p>Evolution 视图展示的是单基因树，不是物种树；中心星比对、p-distance 和 NJ 都可能受长枝吸引与比对误差影响，不能替代数据库中的手工 / 模型比对。</p></li>
            <li><span>05</span><p>项目不进行三维结构预测、分子动力学模拟或变异临床分级。</p></li>
          </ul>
          <div className="limit-note">
            <Info size={14} />
            <span>这是一个教学与可视化工具，不是临床诊断软件。预置变异用于展示概念，不应作为医学建议。</span>
          </div>
        </Panel>

        <Panel className="method-stack" kicker="IMPLEMENTATION" title="Built like software" action={<Code2 size={17} />}>
          <div className="stack-list">
            <div><span>UI</span><strong>React 19 + TypeScript + Vite</strong></div>
            <div><span>Charts</span><strong>Hand-built SVG &amp; CSS, no chart library</strong></div>
            <div><span>Data</span><strong>NCBI RefSeq / GenBank + Kazusa, bundled offline</strong></div>
            <div><span>Algorithms</span><strong>Translation, ORF, BLOSUM62 MSA, NJ, indel engine; Vitest</strong></div>
            <div><span>Hosting</span><strong>Static build, GitHub Pages ready</strong></div>
          </div>
          <p className="panel-copy panel-copy--small">
            项目结构把数据、算法和界面分开：<code>src/lib/</code> 不依赖 React，<code>src/components/</code> 只负责呈现，
            <code>src/data/</code> 保存可追溯的公开序列。这样算法可以单独测试，也方便替换成新的基因或数据集。
          </p>
        </Panel>
      </div>

      <Panel className="references-panel" kicker="REFERENCES" title="Read the primary sources" action={<BookOpen size={17} />}>
        <div className="reference-grid">
          {REFERENCES.map((reference, index) => (
            <a key={reference.title} href={reference.href} target="_blank" rel="noreferrer" className="reference-card">
              <span className="reference-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{reference.title}</strong>
                <p>{reference.detail}</p>
              </div>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
        <div className="course-note">
          <FlaskConical size={16} />
          <div>
            <strong>课程项目 · Bioinformatics final project</strong>
            <p>一个面向中心法则与序列分析的可视化实验台。界面、算法、数据管线和文档均可独立阅读与复现。</p>
          </div>
          <Badge tone="lime">MIT licensed</Badge>
        </div>
      </Panel>
    </div>
  );
}
