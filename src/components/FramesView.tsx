import { useMemo, useState } from "react";
import { Info, Sparkles } from "lucide-react";
import type { Gene } from "../types";
import type { GeneAnalysis } from "../lib/analysis";
import { formatInt } from "../lib/format";
import { OrfMap } from "./OrfMap";
import { Badge, Panel, Segmented, ViewIntro } from "./ui";
import { cx } from "../lib/cx";

export function FramesView({
  gene,
  analysis,
}: {
  gene: Gene;
  analysis: GeneAnalysis;
}) {
  const [minAa, setMinAa] = useState("20");
  const [selectedId, setSelectedId] = useState<string | null>(analysis.longest?.id ?? null);

  const filtered = useMemo(
    () => analysis.orfs.filter((orf) => orf.lengthAa >= Number(minAa)),
    [analysis.orfs, minAa],
  );
  const active = filtered.find((orf) => orf.id === selectedId) ?? filtered[0] ?? null;
  const longest = filtered.reduce<typeof filtered[number] | null>(
    (best, orf) => (!best || orf.lengthAa > best.lengthAa ? orf : best),
    null,
  );
  const strandCount = filtered.filter((orf) => orf.strand === "+").length;
  const tableRows = filtered.slice(0, 12);

  return (
    <div className="view view--frames">
      <ViewIntro
        eyebrow={<>READING FRAMES / {gene.accession}</>}
        title="Six ways to read"
        accent="the same sentence."
        description="同一段 DNA，从不同起点开始，就会得到完全不同的肽链。六阅读框把潜在的 ORF 全部摊开：三框正向，三框反向。"
        tags={["ATG start", "Stop codon", "Six-frame translation"]}
      >
        <div className="mini-stat-grid">
          <div><span>ORFs</span><strong>{formatInt(filtered.length)}</strong><em>≥ {minAa} aa</em></div>
          <div><span>Longest</span><strong>{formatInt(longest?.lengthAa ?? 0)}</strong><em>amino acids</em></div>
          <div><span>Forward</span><strong>{strandCount}</strong><em>/ {filtered.length} ORFs</em></div>
          <div><span>Longest frame</span><strong>{longest ? `${longest.frame <= 3 ? "+" : "−"}${((longest.frame - 1) % 3) + 1}` : "—"}</strong><em>{longest?.strand === "+" ? "forward" : "reverse"} strand</em></div>
        </div>
      </ViewIntro>

      <Panel
        className="orf-panel"
        kicker="ORF CARTOGRAPHY"
        title="Six-frame reading map"
        action={
          <div className="panel-controls">
            <span className="control-label">min ORF</span>
            <Segmented
              value={minAa}
              options={["20", "50", "100"].map((value) => ({ value, label: `${value} aa` }))}
              onChange={setMinAa}
              label="Minimum ORF length"
              className="segmented--small"
            />
          </div>
        }
      >
        <OrfMap
          orfs={filtered}
          sequenceLength={gene.sequence.length}
          selectedId={active?.id ?? null}
          onSelect={(orf) => setSelectedId(orf.id)}
        />
        <div className="orf-summary-strip">
          <span><i className="legend-line" /> 点击任意 ORF 查看序列与翻译</span>
          <span>{formatInt(gene.sequence.length)} bp · {formatInt(analysis.codon.total)} codons</span>
        </div>
      </Panel>

      <div className="frames-lower">
        <Panel
          kicker="RANKED BY LENGTH"
          title="Open reading frames"
          action={<Badge tone="muted">{filtered.length} hits</Badge>}
        >
          <div className="orf-table-wrap">
            <table className="orf-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Frame</th>
                  <th>Coordinates</th>
                  <th>Length</th>
                  <th>Protein preview</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((orf, index) => (
                  <tr
                    key={orf.id}
                    className={cx(active?.id === orf.id && "is-active")}
                    onClick={() => setSelectedId(orf.id)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(orf.id);
                      }
                    }}
                  >
                    <td>{String(index + 1).padStart(2, "0")}</td>
                    <td>
                      <span className={cx("frame-chip", `frame-${orf.frame}`)}>
                        {orf.frame <= 3 ? "+" : "−"}{((orf.frame - 1) % 3) + 1}
                      </span>
                    </td>
                    <td className="mono">{formatInt(orf.start + 1)}–{formatInt(orf.end)}</td>
                    <td className="mono">{orf.lengthAa} aa</td>
                    <td className="protein-preview">{orf.protein.slice(0, 18)}…</td>
                  </tr>
                ))}
                {!tableRows.length && (
                  <tr>
                    <td colSpan={5} className="table-empty">当前阈值下没有 ORF。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          className="orf-detail"
          kicker={active ? `FRAME ${active.frame <= 3 ? "+" : "−"}${((active.frame - 1) % 3) + 1} / ${active.strand === "+" ? "FORWARD" : "REVERSE"}` : "SELECT AN ORF"}
          title={active ? `${active.lengthAa} amino acids` : "No ORF selected"}
          action={active && <Badge tone="lime">{formatInt(active.lengthBp)} bp</Badge>}
        >
          {active ? (
            <>
              <div className="orf-coordinates">
                <span>START</span>
                <strong>c.{formatInt(active.start + 1)}</strong>
                <span>STOP</span>
                <strong>c.{formatInt(active.end)}</strong>
              </div>
              <div className="orf-sequence-block">
                <div className="sequence-block-head"><span>CDS</span><em>{active.sequence.slice(0, 3)} … {active.sequence.slice(-3)}</em></div>
                <code>{active.sequence.slice(0, 72)}{active.sequence.length > 72 ? "…" : ""}</code>
              </div>
              <div className="orf-sequence-block">
                <div className="sequence-block-head"><span>TRANSLATION</span><em>{active.protein[0]} → {active.protein[active.protein.length - 2]}</em></div>
                <code>{active.protein.slice(0, 72)}{active.protein.length > 72 ? "…" : ""}</code>
              </div>
              <div className="orf-notes">
                <Sparkles size={14} />
                <span>最长的 ORF 通常最像真实编码序列，但保守性、密码子使用与实验证据同样重要。</span>
              </div>
            </>
          ) : (
            <p className="muted-copy">把最小 ORF 长度调低，或换一个样本。</p>
          )}
        </Panel>
      </div>

      <div className="insight-banner">
        <div className="insight-icon"><Info size={18} /></div>
        <div>
          <strong>为什么是六个阅读框？</strong>
          <p>双链 DNA 的两条链都可以转录，每条链又有 3 个可能的起始相位。因此同一段序列有 3 个正向和 3 个反向阅读框。ORF 从 ATG 开始，到第一个同框终止密码子结束。</p>
        </div>
        <div className="insight-chips">
          <span>3 forward</span>
          <span>3 reverse</span>
          <span>1 stop rule</span>
        </div>
      </div>
    </div>
  );
}
