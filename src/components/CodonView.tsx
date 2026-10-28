import { useState } from "react";
import { Activity, Info, Sparkles, TrendingUp } from "lucide-react";
import type { Gene } from "../types";
import type { GeneAnalysis } from "../lib/analysis";
import { AMINO_ACIDS, GROUP_META, HUMAN_CODON_USAGE, type AminoAcidCode } from "../lib/genetics";
import { formatInt } from "../lib/format";
import { CodonWheel } from "./CodonWheel";
import { GroupLegend } from "./charts";
import { Badge, Panel, ViewIntro } from "./ui";
import { cx } from "../lib/cx";

export function CodonView({
  gene,
  analysis,
}: {
  gene: Gene;
  analysis: GeneAnalysis;
}) {
  const [selectedCodon, setSelectedCodon] = useState("ATG");
  const selectedAa = AMINO_ACIDS[(HUMAN_CODON_USAGE[selectedCodon]?.aminoAcid ?? "M") as AminoAcidCode];
  const cai = analysis.codon.cai;
  const caiTone = cai >= 0.8 ? "strong" : cai >= 0.65 ? "moderate" : "relaxed";
  const usedCount = Object.values(analysis.codon.counts).filter((count) => count > 0).length;

  return (
    <div className="view view--codons">
      <ViewIntro
        eyebrow={<>CODON USAGE / {gene.organism}</>}
        title="The rhythm of"
        accent="synonymous codons."
        description="同一个氨基酸可以由多个密码子编码，但细胞并不会等概率地使用它们。密码子偏好影响翻译速度、mRNA 稳定性，也留下了物种与基因的来源指纹。"
        tags={["Synonymous codons", "CAI", "GC3", "Translation efficiency"]}
      >
        <div className="mini-stat-grid">
          <div><span>CAI</span><strong>{cai.toFixed(3)}</strong><em>human reference</em></div>
          <div><span>GC3</span><strong>{analysis.gc3.toFixed(1)}%</strong><em>third position</em></div>
          <div><span>Codons used</span><strong>{usedCount}<small>/64</small></strong><em>including stop</em></div>
          <div><span>Rare codons</span><strong>{analysis.codon.rare.length}</strong><em>fraction &lt; 0.15</em></div>
        </div>
      </ViewIntro>

      <div className="codon-layout">
        <Panel
          className="wheel-panel"
          kicker="HUMAN CODON USAGE × THIS GENE"
          title="The codon wheel"
          action={<Badge tone="lime">{usedCount} used</Badge>}
        >
          <div className="wheel-wrap">
            <CodonWheel
              selectedCodon={selectedCodon}
              onSelect={setSelectedCodon}
              counts={analysis.codon.counts}
            />
          </div>
          <div className="wheel-footer">
            <div className="wheel-legend">
              <GroupLegend />
            </div>
            <div className="wheel-legend-note">
              <span><i className="wheel-key wheel-key--usage" /> 人类使用频率</span>
              <span><i className="wheel-key wheel-key--gene" /> 本基因使用</span>
            </div>
          </div>
          <div className="wheel-selected">
            <div>
              <span>SELECTED</span>
              <strong>{selectedCodon}</strong>
              <em>{selectedAa.three} · {selectedAa.nameZh}</em>
            </div>
            <div>
              <span>HUMAN FRACTION</span>
              <strong>{((HUMAN_CODON_USAGE[selectedCodon]?.fraction ?? 0) * 100).toFixed(0)}%</strong>
              <em>of {selectedAa.three} codons</em>
            </div>
            <div>
              <span>IN THIS GENE</span>
              <strong>{analysis.codon.counts[selectedCodon] ?? 0}×</strong>
              <em>{analysis.codon.total ? (((analysis.codon.counts[selectedCodon] ?? 0) / analysis.codon.total) * 100).toFixed(1) : "0.0"}% of codons</em>
            </div>
          </div>
        </Panel>

        <div className="codon-side">
          <Panel
            className="cai-panel"
            kicker="CODON ADAPTATION INDEX"
            title="How tuned is this gene?"
            action={<Badge tone={caiTone === "strong" ? "lime" : caiTone === "moderate" ? "amber" : "cyan"}>{caiTone}</Badge>}
          >
            <div className="cai-gauge-wrap">
              <svg className="cai-gauge" viewBox="0 0 200 200" role="img" aria-label={`Codon adaptation index ${cai.toFixed(2)}`}>
                <circle cx="100" cy="100" r="76" className="cai-track" />
                <circle
                  cx="100"
                  cy="100"
                  r="76"
                  className="cai-progress"
                  strokeDasharray={`${Math.min(1, cai) * 477.5} 477.5`}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="96" textAnchor="middle" className="cai-number">{cai.toFixed(2)}</text>
                <text x="100" y="119" textAnchor="middle" className="cai-label">CAI</text>
              </svg>
              <div className="cai-scale"><span>0.0 low bias</span><span>1.0 strong bias</span></div>
            </div>
            <p className="panel-copy">
              CAI 用一组高表达基因的密码子频率作为参考，衡量目标基因是否“偏爱”宿主常用的同义密码子。{caiTone === "strong" ? "这个基因与人类密码子偏好相当契合。" : caiTone === "moderate" ? "存在一定偏好，但不极端。" : "这个基因的密码子使用较为分散，可能受到突变压力或外源序列影响。"}
            </p>
            <div className="metric-inline">
              <div><span>GC3</span><strong>{analysis.gc3.toFixed(1)}%</strong></div>
              <div><span>Aromaticity</span><strong>{analysis.protein.aromaticity.toFixed(1)}%</strong></div>
              <div><span>Aliphatic index</span><strong>{analysis.protein.aliphaticIndex.toFixed(0)}</strong></div>
            </div>
          </Panel>

          <Panel
            className="rare-panel"
            kicker="RARE CODON WATCH"
            title="The slow lanes"
            action={<Badge tone="coral">{analysis.codon.rare.length}</Badge>}
          >
            {analysis.codon.rare.length ? (
              <div className="rare-list">
                {analysis.codon.rare.slice(0, 8).map((rare) => (
                  <button
                    key={rare.codon}
                    type="button"
                    className={cx("rare-chip", selectedCodon === rare.codon && "is-active")}
                    onClick={() => setSelectedCodon(rare.codon)}
                  >
                    <strong>{rare.codon}</strong>
                    <span>{AMINO_ACIDS[HUMAN_CODON_USAGE[rare.codon]?.aminoAcid as AminoAcidCode]?.three}</span>
                    <em>{rare.count}× · {(rare.fraction * 100).toFixed(0)}%</em>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rare-empty"><Sparkles size={15} /> 没有低于 15% 人类使用频率的密码子。</div>
            )}
            <p className="panel-copy panel-copy--small">
              低使用频率密码子可能拖慢核糖体延伸，也可能参与翻译调控。这里的阈值只是为了可视化。
            </p>
          </Panel>

          <Panel
            className="top-codon-panel"
            kicker="MOST FREQUENT HERE"
            title="This gene's favourites"
            action={<TrendingUp size={16} />}
          >
            <div className="top-codon-list">
              {analysis.codon.top.slice(0, 6).map((item) => {
                const aa = AMINO_ACIDS[HUMAN_CODON_USAGE[item.codon]?.aminoAcid as AminoAcidCode];
                return (
                  <button
                    key={item.codon}
                    type="button"
                    className={cx("top-codon-row", selectedCodon === item.codon && "is-active")}
                    onClick={() => setSelectedCodon(item.codon)}
                  >
                    <strong>{item.codon}</strong>
                    <span style={{ color: GROUP_META[aa.group].color }}>{aa.three}</span>
                    <span className="top-codon-count">{item.count}×</span>
                    <span className="top-codon-bar">
                      <i style={{ width: `${(item.count / Math.max(1, analysis.codon.top[0]?.count ?? 1)) * 100}%` }} />
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      <div className="insight-banner insight-banner--codon">
        <div className="insight-icon"><Info size={18} /></div>
        <div>
          <strong>同义 ≠ 无影响</strong>
          <p>同义突变不改变氨基酸，却可能改变 mRNA 二级结构、翻译速度、剪接或密码子使用效率。CAI 只是从密码子偏好角度给出的一个可计算切面。</p>
        </div>
        <div className="insight-chips">
          <span><Activity size={12} /> translation</span>
          <span><Sparkles size={12} /> {formatInt(gene.sequence.length)} bp</span>
        </div>
      </div>
    </div>
  );
}
