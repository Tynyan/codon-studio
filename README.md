<div align="center">

# CODON / STUDIO

### 把生命读成代码。

一个交互式中心法则实验台：真实基因序列、六阅读框 ORF、蛋白质化学与实时变异模拟。
**React 19 · TypeScript · Vite · 纯前端 · MIT**

![Codon Studio](docs/screenshot.png)

</div>

---

## 这是什么？

**Codon Studio（密码子工坊）** 把「DNA → mRNA → 蛋白质」做成一台可以上手操作的仪器。它不把生物信息学包装成一堆静态图表，而是让你：

- 在真实的 **HBB、INS、TP53、SARS-CoV-2 Spike** 编码序列之间切换；
- 沿序列移动，实时看到密码子、氨基酸与肽链；
- 打开 **六阅读框**，比较同一段 DNA 在不同起点下读出的不同蛋白；
- 点击任意碱基做 **定点突变**，立刻判断同义 / 错义 / 无义，并观察蛋白理化性质的变化；
- 查看 **密码子使用偏性**、GC3、CAI 与稀有密码子；
- 导入自己的 FASTA，在浏览器本地完成全部分析。

所有计算都在客户端完成，**序列不会上传到服务器**。

![Variant lab](docs/screenshot-variants.png)

## 三步上手

1. **选一个真实基因**：右上角 `HBB` 按钮打开样本库，或拖入自己的 FASTA。
2. **点一个碱基**：在中央序列轨道上选择任意碱基，右侧会列出 3 个替换选项；点击后立即看到密码子、氨基酸和 `ΔGRAVY`。
3. **换一个视角**：左侧进入「阅读框 / 蛋白质 / 变异实验室 / 密码子偏好」，所有视图共享同一个当前样本和当前密码子位置。

小提示：`Variant lab` 里有 HbS、p53 R175H、Spike D614G 等真实变异；`Codon usage` 里的轮盘可以悬停和点击。

## 为什么适合作为课程项目

| 课程概念 | 项目中的对应实现 |
| --- | --- |
| 中心法则 | DNA 编码链 → mRNA → 蛋白质的同步可视化 |
| 遗传密码 | 标准遗传密码表、64 个密码子、密码子轮盘 |
| 开放阅读框 | 三正向 + 三反向的六阅读框 ORF 扫描 |
| 序列特征 | GC 含量、GC3、碱基组成、GC 沿序列分布 |
| 蛋白质性质 | 分子量、理论 pI、GRAVY、净电荷、氨基酸组成 |
| 密码子偏好 | 人类参考密码子频率、CAI、稀有密码子 |
| 变异注释 | 同义 / 错义 / 无义 / 终止丢失、性质变化 |
| 软件工程 | TypeScript strict、纯函数算法层、16 个单元测试、零 lint warning、响应式与可访问性 |

预置的真实变异包括：

- **HbS** `HBB:c.20A>T` `p.Glu7Val`（legacy `p.Glu6Val`）——镰状细胞贫血
- **HbC** `HBB:c.19G>A` `p.Glu7Lys`
- **R175H** `TP53:c.524G>A` `p.Arg175His`
- **R248Q** `TP53:c.743G>A` `p.Arg248Gln`
- **D614G** `Spike:c.1841A>G` `p.Asp614Gly`
- **N501Y** `Spike:c.1501A>T` `p.Asn501Tyr`

## 界面

### 六阅读框
同一段 3,822 bp 的 Spike CDS，正反链共 6 个阅读框，ORF 按长度排序。

![Reading frames](docs/screenshot-frames.png)

### 密码子轮盘
64 个密码子按氨基酸分组，扇区透明度表示人类使用频率，内圈荧光弧表示本基因是否使用。

![Codon usage](docs/screenshot-codons.png)

### 蛋白质
结构域、残基级序列、Kyte–Doolittle 疏水性曲线与氨基酸组成。

![Protein](docs/screenshot-protein.png)

### 方法与数据
公式、数据来源、局限性全部写在应用里，而不是只藏在 README。

![Methods](docs/screenshot-methods.png)

### 手机端

<img src="docs/screenshot-mobile.png" width="360" alt="Codon Studio mobile" />

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
# → http://127.0.0.1:5173

# 3. 生产构建
npm run build

# 4. 本地预览构建结果
npm run preview
```

要求：**Node.js ≥ 20**（开发时使用 Node 24）。

### 测试与质量检查

```bash
npm test        # 16 个算法单元测试
npm run lint    # Oxlint，0 warning
npm run build   # TypeScript strict + Vite production build
```

## 部署到 GitHub Pages

仓库已经包含 `.github/workflows/deploy.yml`：

1. 把项目推送到 GitHub 的 `main` 分支；
2. 在仓库 **Settings → Pages** 中把 Source 设为 **GitHub Actions**；
3. 每次 push 会自动执行测试、构建并发布 `dist/`。

Vite 使用 `base: "./"`，因此可以部署在 `https://<user>.github.io/<repo>/` 这样的项目子路径下，不需要额外改配置。

## 项目结构

```text
.
├── scripts/
│   ├── fetch-data.py        # 从 NCBI / Kazusa 重新生成数据
│   └── capture.mjs          # 用 Edge/Chrome 生成 docs 截图
├── src/
│   ├── components/          # 视图、图表、弹窗、交互组件
│   │   ├── SequenceStage.tsx
│   │   ├── CodonWheel.tsx
│   │   ├── VariantsView.tsx
│   │   └── ...
│   ├── data/
│   │   ├── catalog.ts       # 基因元数据、结构域、真实变异
│   │   ├── sequences.json   # 已提交的 RefSeq CDS
│   │   └── codonUsage.json  # Kazusa 人类密码子频率
│   ├── hooks/
│   ├── lib/
│   │   ├── genetics.ts      # 翻译、ORF、突变、理化性质
│   │   ├── analysis.ts      # 派生分析与变异解释
│   │   └── genetics.test.ts # Vitest 单元测试
│   ├── App.tsx
│   └── styles.css
├── docs/                    # README 截图
└── .github/workflows/deploy.yml
```

算法层 `src/lib/` 不依赖 React；组件只负责呈现。这样所有序列操作都可以被单元测试，也可以被未来的 CLI / API 复用。

## 算法说明

### 翻译与 ORF

- 使用 NCBI 标准遗传密码（table 1），按 3 bp 读取，遇到 `TAA / TAG / TGA` 终止。
- 六阅读框：正向 3 个相位 + 反向互补链 3 个相位。
- 对每个 `ATG` 向后扫描同框终止密码子；默认展示 ≥20 aa 的 ORF。
- 反向 ORF 的坐标会映射回正向参考序列。

### 蛋白质性质

- **分子量**：`Σ residue mass − 18.015 × (n − 1)`，使用平均残基质量。
- **理论 pI**：Henderson–Hasselbalch 净电荷公式 + pH 0–14 二分搜索。
- **GRAVY**：Kyte–Doolittle 疏水性标度的全蛋白平均；曲线使用 9 aa 滑动窗口。
- **组成**：20 种标准氨基酸计数，终止密码子不计入长度。

### 密码子偏好

- **CAI**：`exp(mean(ln(w)))`，其中 `w = f(codon) / max f(synonymous codons)`。
- 参考集为 Kazusa 人类密码子使用表（93,487 CDS / 40,662,582 codons）。
- **GC3**：编码序列第三位碱基的 GC 比例。
- **稀有密码子**：人类使用比例 `< 0.15` 的密码子（仅用于可视化，不是硬性生物学阈值）。

### 变异解释

按参考密码子与突变后密码子的翻译结果分类：

- 同义（synonymous）
- 错义（missense）
- 无义（nonsense）
- 终止密码子丢失（stop-loss）

再计算分子量、pI、GRAVY、净电荷的变化，并给出「保守 / 激进」的启发式提示。

## 数据来源

| 基因 | Accession | 区域 | 来源 |
| --- | --- | --- | --- |
| HBB | `NM_000518.5` | CDS 51..494 | NCBI RefSeq |
| INS | `NM_000207.3` | CDS 60..392 | NCBI RefSeq |
| TP53 | `NM_000546.6` | CDS 143..1324 | NCBI RefSeq |
| SARS-CoV-2 S | `NC_045512.2` | S CDS 21,563..25,384 | NCBI GenBank |
| Codon usage | — | 93,487 human CDS | [Kazusa](https://www.kazusa.or.jp/codon/) |

重新抓取数据：

```bash
python scripts/fetch-data.py
```

脚本会校验 CDS 长度、起始密码子、终止密码子和碱基字符，并重新生成 `src/data/sequences.json` 与 `src/data/codonUsage.json`。

## 科学边界

这是一个**教学与可视化工具**，不是临床诊断软件：

- 理化性质变化不等于致病性预测，真实影响需要结构、保守性、实验和临床证据；
- ORF 只表示「可能编码」的开放阅读框，不代表真实启动子、剪接位点或翻译产物；
- CAI 使用人类参考表；病毒、细菌、细胞器的密码子偏好应换成对应物种 / 宿主的参考集；
- 项目不进行多序列比对、系统发育推断、三维结构预测或变异临床分级。

预置变异用于展示概念，不应作为医学建议。

## 设计说明

- **深色实验台**：绿黑底色 + 荧光柠檬绿，呼应测序仪与凝胶成像的视觉语言。
- **碱基色**：A 珊瑚、T 青、G 琥珀、C 紫；同一套颜色贯穿序列、密码子轮盘与突变视图。
- **字体**：Space Grotesk（界面）、JetBrains Mono（序列 / 数据）、Instrument Serif Italic（叙事标题）。
- **图表全部手写 SVG**，不依赖图表库；因此可以精确控制密码子轮盘、ORF 轨道和疏水性曲线。
- **响应式**：桌面侧栏 → 移动端顶部标签导航；触控目标 ≥ 24 px，支持 `prefers-reduced-motion`。

## Roadmap

- [ ] 多序列比对与简单邻接法系统发育树
- [ ] 更多物种的密码子使用参考表
- [ ] 导出 PDF / PNG 实验报告
- [ ] 可分享的只读变异快照
- [ ] 蛋白质结构域 3D 视图

## License

[MIT](LICENSE) © 2026 Codon Studio contributors

---

如果这个项目对你有帮助，欢迎 star、fork，或者用它作为生物信息学入门的教学样例。
