export type FlowStep =
  | "dashboard"
  | "starting-point"
  | "intake"
  | "import"
  | "duplicate"
  | "metadata"
  | "template"
  | "generating"
  | "workspace";

export type ClauseStatus =
  | "standard"
  | "modified"
  | "risk"
  | "missing"
  | "ai-generated"
  | "approved";

export type RiskLevel = "high" | "medium" | "low" | "none";

export type FieldConfidence =
  | "auto" // auto-imported by Merlin
  | "manual" // user-entered
  | "missing" // required, not filled
  | "review"; // needs review — conflict/low confidence

export interface MetadataField {
  id: string;
  label: string;
  value: string;
  group: "Supplier" | "Commercial" | "Financial" | "Legal" | "Renewal" | "Compliance";
  confidence: FieldConfidence;
  required?: boolean;
  note?: string; // Merlin's reason / conflict detail
  source?: string; // e.g. "Merlin intake", "Supplier master", "Manual"
}

export interface ClauseVersion {
  id: string;
  label: string; // "v1 · Standard", "v2 · Net 45"
  author: string;
  timestamp: string;
  summary: string;
}

export interface ClauseVariant {
  id: string;
  name: string; // "Standard", "Fallback — Net 60", "Escrow"
  kind: "standard" | "fallback" | "custom";
  body: string;
  risk: RiskLevel;
  note?: string;
}

export interface Clause {
  id: string;
  number: string; // "7.2"
  title: string;
  status: ClauseStatus;
  risk: RiskLevel;
  body: string;
  owner?: string; // assigned legal/business owner
  approved?: boolean;
  nonStandard?: boolean;
  aiGenerated?: boolean;
  commentCount?: number;
  variants?: ClauseVariant[];
  activeVariantId?: string;
  versions?: ClauseVersion[];
  merlinNote?: string; // proactive insight tied to this clause
}

export interface MerlinInsight {
  id: string;
  type: "risk" | "missing" | "policy" | "benchmark" | "suggestion";
  severity: RiskLevel;
  title: string;
  detail: string;
  basis: string; // policy / source citation
  confidence: number; // 0-100
  clauseId?: string;
  fieldId?: string;
  actions: ("accept" | "compare" | "explain" | "ignore" | "escalate" | "goto")[];
  resolved?: boolean;
}

export interface Template {
  id: string;
  name: string;
  score: number;
  jurisdiction: string;
  version: string;
  clauses: number;
  why: string[];
  status: "recommended" | "ok" | "warning";
  warning?: string;
}

export interface Comment {
  id: string;
  clauseId: string;
  author: string;
  role: string;
  body: string;
  timestamp: string;
  resolved: boolean;
  mentions?: string[];
  parentId?: string; // set on replies
}

export interface Approver {
  id: string;
  name: string;
  role: string;
  stage: number;
  status: "ready" | "pending" | "on-leave" | "delegated";
  note?: string;
}

export interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  target?: string;
  timestamp: string;
  kind: "edit" | "ai" | "comment" | "approval" | "system" | "risk";
}

export interface IntakeQA {
  id: string;
  question: string;
  answer: string;
  fills?: string[]; // metadata field ids this answer populates
  missing?: boolean;
}
