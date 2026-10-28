import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { DEFAULT_GENE_ID, GENES, GENE_BY_ID } from "./data/catalog";
import { analyzeGene } from "./lib/analysis";
import { clamp, copyText } from "./lib/format";
import { createCustomGene, loadCustomGenes, saveCustomGenes } from "./lib/gene";
import type { CustomGeneInput, Gene, ViewId } from "./types";
import { useToast } from "./hooks/useToast";
import { MobileNav, Sidebar, Topbar } from "./components/Shell";
import { VIEW_TITLES } from "./lib/navigation";
import { GeneLibrary } from "./components/GeneLibrary";
import { ImportDialog } from "./components/ImportDialog";
import { WorkbenchView } from "./components/WorkbenchView";
import { FramesView } from "./components/FramesView";
import { ProteinView } from "./components/ProteinView";
import { VariantsView } from "./components/VariantsView";
import { CodonView } from "./components/CodonView";
import { MethodsView } from "./components/MethodsView";
import type { DraftMutation } from "./components/SequenceStage";
import { cx } from "./lib/cx";

const VIEWS: ViewId[] = ["workbench", "frames", "protein", "variants", "codons", "methods"];

function isView(value: string | null): value is ViewId {
  return value !== null && VIEWS.includes(value as ViewId);
}

function readInitialState() {
  const params = new URLSearchParams(window.location.search);
  const requestedGene = params.get("gene");
  const available = [...GENES, ...loadCustomGenes()];
  const gene = requestedGene
    ? available.find((item) => item.id === requestedGene) ?? GENE_BY_ID[DEFAULT_GENE_ID]
    : GENE_BY_ID[DEFAULT_GENE_ID];
  const geneId = gene.id;
  const frame = clamp(Number(params.get("frame") ?? 1) - 1, 0, 2);
  const totalCodons = Math.max(1, Math.ceil(gene.sequence.length / 3));
  const codon = clamp(Number(params.get("codon") ?? 1) - 1, 0, totalCodons - 1);
  const variant = gene.variants.find((item) => item.id === params.get("variant")) ?? gene.variants[0] ?? null;
  return {
    geneId,
    view: isView(params.get("view")) ? (params.get("view") as ViewId) : "workbench",
    frame,
    codon,
    variantId: variant?.id ?? null,
  };
}

function fasta(header: string, sequence: string): string {
  const lines = sequence.match(/.{1,60}/g) ?? [sequence];
  return `>${header}\n${lines.join("\n")}\n`;
}

function App() {
  const initial = useMemo(() => readInitialState(), []);
  const [customGenes, setCustomGenes] = useState<Gene[]>(() => loadCustomGenes());
  const genes = useMemo(() => [...GENES, ...customGenes], [customGenes]);
  const [geneId, setGeneId] = useState(initial.geneId);
  const [view, setView] = useState<ViewId>(initial.view);
  const [frame, setFrame] = useState(initial.frame);
  const [selectedCodon, setSelectedCodon] = useState(initial.codon);
  const [selectedBase, setSelectedBase] = useState(initial.frame + initial.codon * 3 + 1);
  const [selectedResidue, setSelectedResidue] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initial.variantId);
  const [draft, setDraft] = useState<DraftMutation | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  const gene = genes.find((item) => item.id === geneId) ?? GENE_BY_ID[DEFAULT_GENE_ID];
  const analysis = useMemo(() => analyzeGene(gene), [gene]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("gene", geneId);
    if (view !== "workbench") params.set("view", view);
    if (frame > 0) params.set("frame", String(frame + 1));
    if (selectedCodon > 0) params.set("codon", String(selectedCodon + 1));
    if (view === "variants" && selectedVariantId) params.set("variant", selectedVariantId);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", next);
  }, [frame, geneId, selectedCodon, selectedVariantId, view]);

  useEffect(() => {
    document.title = `${gene.displayName} · Codon Studio`;
  }, [gene.displayName]);

  const goToView = (nextView: ViewId) => {
    setView(nextView);
    if (nextView === "variants") {
      if (draft) setSelectedVariantId(null);
      else if (!selectedVariantId) setSelectedVariantId(gene.variants[0]?.id ?? null);
    }
  };

  const chooseGene = (id: string) => {
    const next = genes.find((item) => item.id === id);
    if (!next) return;
    setGeneId(next.id);
    setView("workbench");
    setFrame(0);
    setSelectedCodon(0);
    setSelectedBase(1);
    setSelectedResidue(1);
    setDraft(null);
    setSelectedVariantId(next.variants[0]?.id ?? null);
    setLibraryOpen(false);
  };

  const changeFrame = (nextFrame: number) => {
    setFrame(nextFrame);
    setSelectedCodon(0);
    setSelectedBase(nextFrame + 1);
    setDraft(null);
  };

  const selectCodon = (index: number) => {
    const totalCodons = Math.max(1, Math.ceil(gene.sequence.length / 3));
    setSelectedCodon(clamp(index, 0, totalCodons - 1));
  };

  const openVariantLab = () => {
    setView("variants");
    if (draft) {
      const known =
        (draft.frame ?? 0) === 0
          ? gene.variants.find((variant) => variant.position === draft.position && variant.alt === draft.alt)
          : undefined;
      if (known) {
        setSelectedVariantId(known.id);
        setDraft(null);
      } else {
        setSelectedVariantId(null);
      }
    } else {
      setSelectedVariantId(gene.variants[0]?.id ?? null);
    }
  };

  const openVariant = (id: string) => {
    setDraft(null);
    setSelectedVariantId(id);
    setView("variants");
  };

  const openCodon = (codonIndex: number, targetFrame = 0) => {
    setView("workbench");
    setFrame(targetFrame);
    setSelectedCodon(codonIndex);
    setSelectedBase(targetFrame + codonIndex * 3 + 1);
  };

  const copySequence = async () => {
    const content = fasta(`${gene.symbol} ${gene.displayName} | ${gene.accession} | Codon Studio`, gene.sequence);
    const copied = await copyText(content);
    showToast(copied ? "FASTA 已复制" : "无法访问剪贴板", {
      detail: copied ? `${gene.sequence.length} bp · ${gene.symbol}` : "请检查浏览器权限。",
      tone: copied ? "success" : "warning",
    });
  };

  const share = async () => {
    const copied = await copyText(window.location.href);
    showToast(copied ? "分享链接已复制" : "无法访问剪贴板", {
      detail: copied ? "链接包含当前基因、视图与密码子位置。" : "可以直接复制地址栏中的 URL。",
      tone: copied ? "success" : "warning",
    });
  };

  const importGene = (input: CustomGeneInput) => {
    const custom = createCustomGene(input);
    const next = [...customGenes, custom];
    setCustomGenes(next);
    saveCustomGenes(next);
    setGeneId(custom.id);
    setView("workbench");
    setFrame(0);
    setSelectedCodon(0);
    setSelectedBase(1);
    setSelectedResidue(1);
    setDraft(null);
    setSelectedVariantId(null);
    setImportOpen(false);
    showToast("序列已加入工作台", { detail: `${custom.displayName} · ${custom.sequence.length} bp`, tone: "success" });
  };

  const deleteCustom = (id: string) => {
    const next = customGenes.filter((item) => item.id !== id);
    setCustomGenes(next);
    saveCustomGenes(next);
    if (geneId === id) chooseGene(DEFAULT_GENE_ID);
    showToast("本地序列已删除", { tone: "default" });
  };

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true">
        <div className="ambient-blob ambient-blob--one" />
        <div className="ambient-blob ambient-blob--two" />
        <div className="ambient-grid" />
      </div>

      <Sidebar
        gene={gene}
        view={view}
        onViewChange={goToView}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenMethod={() => goToView("methods")}
      />

      <div className="app-main">
        <MobileNav
          gene={gene}
          view={view}
          onViewChange={goToView}
          onOpenLibrary={() => setLibraryOpen(true)}
          onOpenImport={() => setImportOpen(true)}
          onShare={share}
        />
        <Topbar
          gene={gene}
          view={view}
          onOpenLibrary={() => setLibraryOpen(true)}
          onOpenImport={() => setImportOpen(true)}
          onShare={share}
        />

        <main className="app-content">
          <div className="view-wrap" key={`${gene.id}-${view}`}>
            {view === "workbench" && (
              <WorkbenchView
                gene={gene}
                analysis={analysis}
                frame={frame}
                onFrameChange={changeFrame}
                selectedCodon={selectedCodon}
                selectedBase={selectedBase}
                onSelectCodon={selectCodon}
                onSelectBase={setSelectedBase}
                draft={draft}
                onDraftChange={setDraft}
                onOpenVariantLab={openVariantLab}
                onCopySequence={copySequence}
                onOpenVariant={openVariant}
              />
            )}
            {view === "frames" && <FramesView gene={gene} analysis={analysis} />}
            {view === "protein" && (
              <ProteinView
                gene={gene}
                analysis={analysis}
                selectedResidue={selectedResidue}
                onSelectResidue={setSelectedResidue}
                onOpenCodon={openCodon}
              />
            )}
            {view === "variants" && (
              <VariantsView
                gene={gene}
                analysis={analysis}
                selectedVariantId={selectedVariantId}
                draft={draft}
                onSelectVariant={setSelectedVariantId}
                onDraftChange={setDraft}
                onOpenCodon={openCodon}
              />
            )}
            {view === "codons" && <CodonView gene={gene} analysis={analysis} />}
            {view === "methods" && <MethodsView />}
          </div>

          <footer className="app-footer">
            <span><i className="footer-dot" /> CODON STUDIO · {VIEW_TITLES[view]}</span>
            <span>{gene.organism} · {gene.accession}</span>
            <span>All analysis runs locally · MIT</span>
          </footer>
        </main>
      </div>

      <GeneLibrary
        key={libraryOpen ? "library-open" : "library-closed"}
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        genes={genes}
        currentId={gene.id}
        onSelect={chooseGene}
        onOpenImport={() => {
          setLibraryOpen(false);
          setImportOpen(true);
        }}
        onDeleteCustom={deleteCustom}
      />
      <ImportDialog
        key={importOpen ? "import-open" : "import-closed"}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={importGene}
      />

      {toast && (
        <div className={cx("toast", `toast--${toast.tone}`)} role="status">
          <span className="toast-icon">
            {toast.tone === "success" ? <CheckCircle2 size={16} /> : <Info size={16} />}
          </span>
          <div>
            <strong>{toast.message}</strong>
            {toast.detail && <span>{toast.detail}</span>}
          </div>
          <button type="button" className="toast-close" onClick={dismiss} aria-label="关闭提示">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
