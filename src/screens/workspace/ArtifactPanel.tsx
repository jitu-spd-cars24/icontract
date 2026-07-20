import * as React from "react";
import { Badge, Progress } from "@/components/ui/primitives";
import { MerlinMark } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./LeftRail";
import { ShieldCheck, Check, ChevronRight } from "lucide-react";
import type { ClauseStatus } from "@/lib/types";

const ARTIFACT_STATUS_META: Record<ClauseStatus, { label: string; className: string }> = {
  standard: { label: "Standard", className: "bg-muted text-muted-foreground" },
  modified: { label: "Modified", className: "bg-risk-med-soft text-risk-med" },
  risk: { label: "At risk", className: "bg-risk-high-soft text-risk-high" },
  missing: { label: "Missing", className: "bg-risk-high-soft text-risk-high" },
  "ai-generated": { label: "AI", className: "bg-merlin-soft text-merlin" },
  approved: { label: "Approved", className: "bg-risk-low-soft text-success" },
};

export function ArtifactPanel({
  sessionStatus = "Draft",
  onClose,
  onOpenClause,
  onSubmit,
  onPreview,
}: {
  sessionStatus?: "Draft" | "In Review" | "In Approval" | "Signed";
  onClose: () => void;
  onOpenClause: (clauseId: string) => void;
  onSubmit: () => void;
  onPreview?: () => void;
}) {
  const { clauses, metadata, insights, intakeMode, submitted } = useStore();
  const health = useHealth();
  const [tab, setTab] = React.useState<"document" | "metadata">("document");

  const filled = metadata.filter((f) => f.value).length;
  const openRisks = insights.filter((i) => !i.resolved && i.type === "risk").length;
  const steps = [
    { label: "Details", done: filled >= 6 },
    { label: "Draft", done: clauses.length > 0 },
    { label: "Risks", done: clauses.length > 0 && openRisks === 0 },
    { label: "Approval", done: submitted },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const statusText =
    sessionStatus === "Signed"
      ? "signed"
      : sessionStatus === "In Review"
      ? "in review"
      : submitted || sessionStatus === "In Approval"
      ? "in approval"
      : "draft";

  return (
    <aside className="hidden w-[380px] shrink-0 flex-col border-l border-border bg-card lg:flex">
      {/* header */}
      <div className="border-b border-border px-4 py-3">
        <div className="px-2 py-2">
          <div className="relative grid grid-cols-4 gap-1">
            <div className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-border" aria-hidden="true" />
            <div
              className="absolute left-[12.5%] top-4 h-px bg-success transition-all duration-300"
              style={{ width: `${Math.max(0, completedSteps - 1) * 25}%` }}
              aria-hidden="true"
            />
            {steps.map((s, index) => (
              <div key={s.label} className="relative flex flex-col items-center gap-1.5 text-center">
                <span
                  className={`grid size-8 place-items-center rounded-full border text-[11px] font-semibold shadow-xs ${
                    s.done
                      ? "border-success/20 bg-risk-low-soft text-success"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {s.done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className={`text-[10.5px] font-medium ${s.done ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-border/70 bg-background/60 p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Health</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums">{health.score}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge tone={sessionStatus === "Signed" ? "low" : submitted || sessionStatus === "In Approval" ? "primary" : health.ready ? "low" : "med"}>
              {sessionStatus === "Signed" ? "Signed" : submitted || sessionStatus === "In Approval" ? "In approval" : sessionStatus === "In Review" ? "In review" : health.ready ? "Ready" : intakeMode ? "Gathering" : "In progress"}
            </Badge>
          </div>
          <Progress value={health.score} tone={health.score >= 90 ? "success" : health.score >= 70 ? "primary" : "warning"} className="mt-2 h-1.5" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Stage</div>
              <div className="mt-0.5 text-sm font-semibold">{completedSteps}/4</div>
            </div>
            <div className="rounded-xl bg-card px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Risks</div>
              <div className={`mt-0.5 text-sm font-semibold ${health.openRisks ? "text-risk-high" : "text-success"}`}>{health.openRisks}</div>
            </div>
            <div className="rounded-xl bg-card px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Missing</div>
              <div className={`mt-0.5 text-sm font-semibold ${health.openMissing ? "text-risk-med" : "text-success"}`}>{health.openMissing}</div>
            </div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="border-b border-border px-4 py-3">
        <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
        {(["document", "metadata"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold capitalize transition-colors ${
              tab === t ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {tab === "document" ? (
          clauses.length === 0 ? (
            <div className="grid place-items-center gap-2 py-16 text-center">
              <MerlinMark size={30} active={false} />
              <p className="text-sm font-medium">Nothing drafted yet</p>
              <p className="max-w-[220px] text-xs text-muted-foreground">As Merlin builds the contract, clauses appear here for you to review.</p>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clauses</span>
                <span className="text-[11px] text-muted-foreground">{clauses.length} total</span>
              </div>
              <div className="space-y-1.5">
              {clauses.map((c) => {
                const flagged = c.risk !== "none";
                const railColor = c.risk === "high" ? "var(--risk-high)" : c.risk === "medium" ? "var(--risk-med)" : "var(--risk-low)";
                const status = ARTIFACT_STATUS_META[c.status];
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenClause(c.id)}
                    className="group relative w-full rounded-xl border border-transparent bg-background/45 py-2.5 pl-3.5 pr-2.5 text-left transition-colors hover:border-border/70 hover:bg-accent/45"
                  >
                    {flagged && (
                      <span className="absolute inset-y-2.5 left-1 w-[3px] rounded-full" style={{ background: railColor }} />
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight ${flagged ? "pl-2" : ""}`}>{c.title}</span>
                      {c.status !== "standard" && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium leading-none ${status.className}`}>
                          {status.label}
                        </span>
                      )}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className={`mt-1 line-clamp-1 text-[12px] leading-relaxed text-muted-foreground/75 ${flagged ? "pl-2" : ""}`}>{c.body || "Empty clause"}</p>
                  </button>
                );
              })}
              </div>
            </div>
          )
        ) : (
          <div className="space-y-5 px-1 pt-1">
            {(["Supplier", "Commercial", "Financial", "Legal", "Renewal", "Compliance"] as const).map((g) => {
              const fields = metadata.filter((f) => f.group === g);
              if (!fields.length) return null;
              return (
                <div key={g}>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{g}</div>
                  <div className="divide-y divide-border/60">
                    {fields.map((f) => (
                      <div key={f.id} className="grid grid-cols-[1fr_1.2fr] gap-3 py-2 text-[13px]">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={`truncate text-right font-medium ${!f.value ? "text-risk-med" : "text-foreground"}`}>{f.value || "Not set"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {sessionStatus === "Signed" ? (
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success/35 bg-risk-low-soft/60 px-4 py-2.5 text-sm font-medium text-success">
            <Check className="size-4" /> Signed · read-only snapshot
          </div>
        ) : submitted || sessionStatus === "In Approval" ? (
          <button
            onClick={onSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success/40 bg-risk-low-soft/60 px-4 py-2.5 text-sm font-medium text-success transition-colors hover:bg-risk-low-soft"
          >
            <Check className="size-4" /> In approval · Stage 1 of 4
          </button>
        ) : sessionStatus === "In Review" ? (
          <button
            onClick={onSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-risk-med/35 bg-risk-med-soft/35 px-4 py-2.5 text-sm font-medium text-risk-med transition-colors hover:bg-risk-med-soft/55"
          >
            <ShieldCheck className="size-4" /> Review in progress
          </button>
        ) : (
          <button
            onClick={onSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShieldCheck className="size-4" /> Submit for approval
          </button>
        )}
      </div>
    </aside>
  );
}
