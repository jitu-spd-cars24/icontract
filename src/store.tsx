import * as React from "react";
import {
  CLAUSES,
  METADATA,
  INSIGHTS,
  COMMENTS,
  ACTIVITY,
  STANDARD_FIX,
} from "@/lib/data";
import type {
  Clause,
  MetadataField,
  MerlinInsight,
  Comment,
  ActivityEvent,
  FlowStep,
} from "@/lib/types";

interface Toast {
  id: number;
  title: string;
  detail?: string;
  tone: "default" | "merlin" | "success" | "warning" | "destructive";
}

export interface NewClause {
  title?: string;
  body?: string;
  status?: Clause["status"];
  risk?: Clause["risk"];
  aiGenerated?: boolean;
  edit?: boolean;
}

interface Store {
  appMode: "chooser" | "traditional" | "nextgen";
  setAppMode: (m: "chooser" | "traditional" | "nextgen") => void;
  step: FlowStep;
  go: (s: FlowStep) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  isBlank: boolean;
  intakeMode: boolean;
  workspaceMode: "chat" | "document";
  submitted: boolean;
  submitForApproval: () => void;
  duplicatedFrom: string | null;
  startDraft: (opts?: { duplicatedFrom?: string }) => void;
  startBlank: () => void;
  startMerlinIntake: () => void;
  generateFromIntake: () => void;

  clauses: Clause[];
  metadata: MetadataField[];
  insights: MerlinInsight[];
  comments: Comment[];
  activity: ActivityEvent[];

  selectedClauseId: string | null;
  setSelectedClause: (id: string | null) => void;
  editingClauseId: string | null;
  setEditingClause: (id: string | null) => void;
  merlinTab: string;
  setMerlinTab: (t: string) => void;

  // actions
  applyVariant: (clauseId: string, variantId: string) => void;
  resolveInsight: (id: string, mode: "accept" | "ignore") => void;
  insertMissingClause: (missingId: string) => void;
  updateField: (id: string, value: string, resolve?: boolean) => void;
  commitClauseBody: (clauseId: string, body: string) => void;
  addClause: (init?: NewClause) => string;
  updateClause: (id: string, patch: Partial<Clause>) => void;
  removeClause: (id: string) => void;
  scaffoldContract: () => void;
  resolveComment: (id: string) => void;
  reopenComment: (id: string) => void;
  addComment: (input: { clauseId: string; body: string; parentId?: string }) => void;
  logActivity: (e: Omit<ActivityEvent, "id" | "timestamp">) => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
}

const StoreCtx = React.createContext<Store | null>(null);

let toastSeq = 0;
let activitySeq = 100;
let clauseSeq = 0;
let commentSeq = 0;
const PANEL_DEEP_LINK = "icontract-panel";

export const CURRENT_USER = { name: "Jitendra Kumar", role: "Procurement" };
export const MENTIONABLE = [
  "Priya Nair",
  "Rahul Mehta",
  "Ananya Rao",
  "Vikram Shah",
  "Sanjay Iyer",
];

/* Empty metadata scaffold for a blank contract */
const BLANK_METADATA: MetadataField[] = METADATA.map((f) => ({
  ...f,
  value: "",
  confidence: f.required ? "missing" : "manual",
  note: undefined,
  source: undefined,
}));

/* Standard starter clauses Merlin can scaffold into a blank editor */
const SCAFFOLD: NewClause[] = [
  { title: "Parties & Definitions", body: "This Purchase Agreement is entered into between [Buyer] and [Supplier]. Capitalised terms have the meanings set out in Schedule A.", status: "standard", risk: "none" },
  { title: "Scope of Supply", body: "Supplier shall manufacture and deliver the goods described in the Purchase Orders issued under this Agreement, conforming to the agreed specifications and delivery schedules.", status: "standard", risk: "none" },
  { title: "Payment Terms", body: "Buyer shall pay all undisputed invoices within forty-five (45) days of the invoice date (Net 45).", status: "standard", risk: "low" },
  { title: "Term & Termination", body: "This Agreement runs for [term] from the Effective Date. Either Party may terminate for convenience on sixty (60) days' written notice, or immediately on uncured material breach after a thirty (30) day cure period.", status: "standard", risk: "low" },
  { title: "Governing Law & Dispute Resolution", body: "This Agreement is governed by the laws of [jurisdiction]. Disputes shall be resolved by arbitration seated in [seat].", status: "standard", risk: "low" },
];

function isOpeningIContractPanel() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("open") === PANEL_DEEP_LINK;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const openIContractPanel = isOpeningIContractPanel();
  const [appMode, setAppMode] = React.useState<"chooser" | "traditional" | "nextgen">(
    () => (openIContractPanel ? "traditional" : "chooser")
  );
  const [step, setStep] = React.useState<FlowStep>(() =>
    openIContractPanel ? "workspace" : "dashboard"
  );
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [clauses, setClauses] = React.useState<Clause[]>(CLAUSES);
  const [metadata, setMetadata] = React.useState<MetadataField[]>(METADATA);
  const [insights, setInsights] = React.useState<MerlinInsight[]>(INSIGHTS);
  const [comments, setComments] = React.useState<Comment[]>(COMMENTS);
  const [activity, setActivity] = React.useState<ActivityEvent[]>(ACTIVITY);
  const [selectedClauseId, setSelectedClauseId] = React.useState<string | null>(
    null
  );
  const [editingClauseId, setEditingClauseId] = React.useState<string | null>(
    null
  );
  const [merlinTab, setMerlinTab] = React.useState("insights");
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [isBlank, setIsBlank] = React.useState(false);
  const [intakeMode, setIntakeMode] = React.useState(false);
  const [workspaceMode, setWorkspaceMode] = React.useState<"chat" | "document">("chat");
  const [submitted, setSubmitted] = React.useState(false);
  const [duplicatedFrom, setDuplicatedFrom] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const dismissToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const logActivity = React.useCallback(
    (e: Omit<ActivityEvent, "id" | "timestamp">) => {
      setActivity((prev) => [
        { ...e, id: `e${++activitySeq}`, timestamp: "Just now" },
        ...prev,
      ]);
    },
    []
  );

  const applyVariant = React.useCallback(
    (clauseId: string, variantId: string) => {
      setClauses((prev) =>
        prev.map((c) => {
          if (c.id !== clauseId || !c.variants) return c;
          const v = c.variants.find((x) => x.id === variantId);
          if (!v) return c;
          const newVersion = {
            id: `v${(c.versions?.length ?? 0) + 1}`,
            label: `v${(c.versions?.length ?? 0) + 1} · ${v.name}`,
            author: "Jitendra Kumar",
            timestamp: "Just now",
            summary: `Switched to ${v.name}.`,
          };
          return {
            ...c,
            body: v.body,
            activeVariantId: variantId,
            risk: v.risk,
            status: v.kind === "standard" ? "approved" : "modified",
            nonStandard: v.kind !== "standard",
            versions: [...(c.versions ?? []), newVersion],
          };
        })
      );
      const clause = clauses.find((c) => c.id === clauseId);
      const v = clause?.variants?.find((x) => x.id === variantId);
      logActivity({
        actor: "Jitendra Kumar",
        action: "swapped clause variant on",
        target: clause?.title,
        kind: "edit",
      });
      toast({
        title: "Clause variant applied",
        detail: v ? `${clause?.title} → ${v.name}` : undefined,
        tone: "success",
      });
    },
    [clauses, logActivity, toast]
  );

  const resolveInsight = React.useCallback(
    (id: string, mode: "accept" | "ignore") => {
      const insight = insights.find((i) => i.id === id);
      setInsights((prev) =>
        prev.map((i) => (i.id === id ? { ...i, resolved: true } : i))
      );
      if (!insight) return;
      // Accepting a risk insight resolves the linked clause to a safer variant
      if (mode === "accept" && insight.clauseId) {
        setClauses((prev) =>
          prev.map((c) => {
            if (c.id !== insight.clauseId) return c;
            // pick the lowest-risk standard/fallback variant if any
            const safe =
              c.variants?.find((v) => v.kind === "standard") ??
              c.variants?.find((v) => v.risk === "low");
            if (safe) {
              return {
                ...c,
                body: safe.body,
                activeVariantId: safe.id,
                risk: safe.risk,
                status: "approved",
                nonStandard: false,
              };
            }
            const fix = STANDARD_FIX[c.id];
            return { ...c, body: fix ?? c.body, status: "approved", risk: "low", nonStandard: false };
          })
        );
      }
      logActivity({
        actor: mode === "accept" ? "Jitendra Kumar" : "Jitendra Kumar",
        action:
          mode === "accept"
            ? "accepted Merlin recommendation:"
            : "dismissed Merlin flag:",
        target: insight.title,
        kind: mode === "accept" ? "ai" : "risk",
      });
      toast({
        title: mode === "accept" ? "Recommendation applied" : "Flag dismissed",
        detail: insight.title,
        tone: mode === "accept" ? "success" : "default",
      });
    },
    [insights, logActivity, toast]
  );

  const insertMissingClause = React.useCallback(
    (missingId: string) => {
      const map: Record<string, Clause> = {
        m1: {
          id: "c_dpa",
          number: "12",
          title: "Data Protection & Privacy (DPA)",
          status: "ai-generated",
          risk: "low",
          aiGenerated: true,
          body: "Supplier shall process personal data only on Buyer's documented instructions and in compliance with the Digital Personal Data Protection Act, 2023. Supplier shall implement appropriate technical and organisational measures, notify Buyer of any personal-data breach within 48 hours, and delete or return all personal data on termination.",
          merlinNote: "Drafted by Merlin from the India DPA standard. Review before approval.",
        },
        m2: {
          id: "c_ins",
          number: "13",
          title: "Insurance & Coverage",
          status: "ai-generated",
          risk: "low",
          aiGenerated: true,
          body: "Supplier shall maintain, at its own cost, commercial general liability insurance of not less than ₹5 Crore per occurrence, product liability cover, and workers' compensation as required by law, and shall provide certificates of insurance on request.",
          merlinNote: "Drafted from template minimum coverage limits. Review before approval.",
        },
      };
      const clause = map[missingId];
      if (!clause) return;
      setClauses((prev) =>
        prev.some((c) => c.id === clause.id) ? prev : [...prev, clause]
      );
      // resolve the matching insight
      setInsights((prev) =>
        prev.map((i) =>
          (missingId === "m1" && i.id === "i4") ||
          (missingId === "m2" && i.id === "i5")
            ? { ...i, resolved: true }
            : i
        )
      );
      logActivity({
        actor: "Merlin",
        action: "inserted AI-drafted clause",
        target: clause.title,
        kind: "ai",
      });
      toast({
        title: "Clause inserted",
        detail: `${clause.title} — drafted by Merlin, flagged for review`,
        tone: "merlin",
      });
    },
    [logActivity, toast]
  );

  const startDraft = React.useCallback(
    (opts?: { duplicatedFrom?: string }) => {
      setClauses(CLAUSES);
      setMetadata(METADATA);
      setInsights(INSIGHTS);
      setComments(COMMENTS);
      setActivity(ACTIVITY);
      setIsBlank(false);
      setIntakeMode(false);
      setWorkspaceMode("chat");
      setSubmitted(false);
      setDuplicatedFrom(opts?.duplicatedFrom ?? null);
      setSelectedClauseId(null);
      setEditingClauseId(null);
      setMerlinTab("insights");
      setStep("workspace");
    },
    []
  );

  const startMerlinIntake = React.useCallback(() => {
    setClauses([]);
    setMetadata(BLANK_METADATA);
    setInsights([]);
    setComments([]);
    setActivity([
      { id: "e_intake", actor: "Jitendra Kumar", action: "started a Merlin intake", timestamp: "Just now", kind: "system" },
    ]);
    setIsBlank(true);
    setIntakeMode(true);
    setWorkspaceMode("chat");
    setSubmitted(false);
    setDuplicatedFrom(null);
    setSelectedClauseId(null);
    setEditingClauseId(null);
    setMerlinTab("insights");
    setStep("workspace");
  }, []);

  const generateFromIntake = React.useCallback(() => {
    setClauses(CLAUSES);
    setMetadata(METADATA);
    setInsights(INSIGHTS);
    setComments(COMMENTS);
    setActivity(ACTIVITY);
    setIsBlank(false);
    setIntakeMode(false);
    setWorkspaceMode("chat");
    setSubmitted(false);
    setSelectedClauseId(null);
    setEditingClauseId(null);
  }, []);

  const submitForApproval = React.useCallback(() => {
    setSubmitted(true);
  }, []);

  const startBlank = React.useCallback(() => {
    setClauses([]);
    setMetadata(BLANK_METADATA);
    setInsights([]);
    setComments([]);
    setActivity([
      {
        id: "e_blank",
        actor: "Jitendra Kumar",
        action: "created a blank contract",
        timestamp: "Just now",
        kind: "system",
      },
    ]);
    setIsBlank(true);
    setIntakeMode(false);
    setWorkspaceMode("document");
    setSubmitted(false);
    setDuplicatedFrom(null);
    setSelectedClauseId(null);
    setEditingClauseId(null);
    setMerlinTab("insights");
    setStep("workspace");
  }, []);

  const addClause = React.useCallback((init?: NewClause) => {
    const id = `c_new_${++clauseSeq}`;
    setClauses((prev) => {
      const nums = prev.map((c) => parseInt(c.number, 10) || 0);
      const next = (nums.length ? Math.max(...nums) : 0) + 1;
      const clause: Clause = {
        id,
        number: String(next),
        title: init?.title ?? "Untitled clause",
        body: init?.body ?? "",
        status: init?.status ?? "modified",
        risk: init?.risk ?? "none",
        aiGenerated: init?.aiGenerated,
      };
      return [...prev, clause];
    });
    if (init?.edit) setEditingClauseId(id);
    return id;
  }, []);

  const updateClause = React.useCallback(
    (id: string, patch: Partial<Clause>) => {
      setClauses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    []
  );

  const removeClause = React.useCallback((id: string) => {
    setClauses((prev) => prev.filter((c) => c.id !== id));
    setEditingClauseId((cur) => (cur === id ? null : cur));
    setSelectedClauseId((cur) => (cur === id ? null : cur));
  }, []);

  const scaffoldContract = React.useCallback(() => {
    setClauses((prev) => {
      let n = prev.length ? Math.max(...prev.map((c) => parseInt(c.number, 10) || 0)) : 0;
      const added = SCAFFOLD.map((s) => {
        n += 1;
        return {
          id: `c_new_${++clauseSeq}`,
          number: String(n),
          title: s.title ?? "Untitled clause",
          body: s.body ?? "",
          status: s.status ?? "standard",
          risk: s.risk ?? "none",
          aiGenerated: true,
        } as Clause;
      });
      return [...prev, ...added];
    });
    logActivity({
      actor: "Merlin",
      action: "scaffolded a Purchase Agreement (5 standard clauses)",
      kind: "ai",
    });
    toast({
      title: "Contract scaffolded",
      detail: "5 standard clauses added — edit or ask Merlin to tailor them",
      tone: "merlin",
    });
  }, [logActivity, toast]);

  const updateField = React.useCallback(
    (id: string, value: string, resolve = true) => {
      setMetadata((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                value,
                confidence: resolve ? "manual" : f.confidence,
                note: resolve ? undefined : f.note,
              }
            : f
        )
      );
    },
    []
  );

  const commitClauseBody = React.useCallback(
    (clauseId: string, body: string) => {
      setClauses((prev) =>
        prev.map((c) =>
          c.id === clauseId
            ? {
                ...c,
                body,
                status: "ai-generated",
                aiGenerated: true,
              }
            : c
        )
      );
    },
    []
  );

  const resolveComment = React.useCallback(
    (id: string) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === id || c.parentId === id ? { ...c, resolved: true } : c
        )
      );
      toast({ title: "Comment resolved", tone: "success" });
    },
    [toast]
  );

  const reopenComment = React.useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id || c.parentId === id ? { ...c, resolved: false } : c
      )
    );
  }, []);

  const addComment = React.useCallback(
    ({
      clauseId,
      body,
      parentId,
    }: {
      clauseId: string;
      body: string;
      parentId?: string;
    }) => {
      const mentions = (body.match(/@([A-Za-z]+)/g) ?? []).map((m) =>
        m.slice(1)
      );
      const id = `cm_new_${++commentSeq}`;
      setComments((prev) => [
        ...prev,
        {
          id,
          clauseId,
          author: CURRENT_USER.name,
          role: CURRENT_USER.role,
          body,
          timestamp: "Just now",
          resolved: false,
          mentions: mentions.length ? mentions : undefined,
          parentId,
        },
      ]);
      const clause = clauses.find((c) => c.id === clauseId);
      if (!parentId) {
        setClauses((prev) =>
          prev.map((c) =>
            c.id === clauseId
              ? { ...c, commentCount: (c.commentCount ?? 0) + 1 }
              : c
          )
        );
      }
      logActivity({
        actor: CURRENT_USER.name,
        action: parentId ? "replied on" : "commented on",
        target: clause?.title,
        kind: "comment",
      });
      toast({
        title: parentId ? "Reply posted" : "Comment added",
        detail: clause ? `§${clause.number} ${clause.title}` : undefined,
        tone: "default",
      });
    },
    [clauses, logActivity, toast]
  );

  const value: Store = {
    appMode,
    setAppMode,
    step,
    go: setStep,
    theme,
    toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    isBlank,
    intakeMode,
    workspaceMode,
    submitted,
    submitForApproval,
    duplicatedFrom,
    startDraft,
    startBlank,
    startMerlinIntake,
    generateFromIntake,
    clauses,
    metadata,
    insights,
    comments,
    activity,
    selectedClauseId,
    setSelectedClause: setSelectedClauseId,
    editingClauseId,
    setEditingClause: setEditingClauseId,
    merlinTab,
    setMerlinTab,
    applyVariant,
    resolveInsight,
    insertMissingClause,
    updateField,
    commitClauseBody,
    addClause,
    updateClause,
    removeClause,
    scaffoldContract,
    resolveComment,
    reopenComment,
    addComment,
    logActivity,
    toasts,
    toast,
    dismissToast,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
