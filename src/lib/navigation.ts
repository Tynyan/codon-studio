import {
  Activity,
  Dna,
  FlaskConical,
  Grid3X3,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import type { ViewId } from "../types";

export const NAV_ITEMS: Array<{
  id: ViewId;
  index: string;
  label: string;
  english: string;
  icon: LucideIcon;
}> = [
  { id: "workbench", index: "01", label: "工作台", english: "Workbench", icon: Dna },
  { id: "frames", index: "02", label: "阅读框", english: "Reading frames", icon: ScanLine },
  { id: "protein", index: "03", label: "蛋白质", english: "Protein", icon: Activity },
  { id: "variants", index: "04", label: "变异实验室", english: "Variant lab", icon: FlaskConical },
  { id: "codons", index: "05", label: "密码子偏好", english: "Codon usage", icon: Grid3X3 },
];

export const VIEW_TITLES: Record<ViewId, string> = {
  workbench: "Workbench",
  frames: "Reading frames",
  protein: "Protein",
  variants: "Variant lab",
  codons: "Codon usage",
  methods: "Methods & data",
};
