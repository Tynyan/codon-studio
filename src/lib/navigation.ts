import {
  Activity,
  Dna,
  FlaskConical,
  GitBranch,
  Grid3X3,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import type { ViewId } from "../types";

export const NAV_ITEMS: Array<{
  id: ViewId;
  index: string;
  label: string;
  mobileLabel?: string;
  english: string;
  icon: LucideIcon;
}> = [
  { id: "workbench", index: "01", label: "工作台", english: "Workbench", icon: Dna },
  { id: "frames", index: "02", label: "阅读框", english: "Reading frames", icon: ScanLine },
  { id: "protein", index: "03", label: "蛋白质", english: "Protein", icon: Activity },
  { id: "variants", index: "04", label: "变异实验室", mobileLabel: "变异", english: "Variant lab", icon: FlaskConical },
  { id: "codons", index: "05", label: "密码子偏好", mobileLabel: "密码子", english: "Codon usage", icon: Grid3X3 },
  { id: "evolution", index: "06", label: "进化与保守性", mobileLabel: "进化", english: "Evolution", icon: GitBranch },
];

export const VIEW_TITLES: Record<ViewId, string> = {
  workbench: "Workbench",
  frames: "Reading frames",
  protein: "Protein",
  variants: "Variant lab",
  codons: "Codon usage",
  evolution: "Evolution",
  methods: "Methods & data",
};
