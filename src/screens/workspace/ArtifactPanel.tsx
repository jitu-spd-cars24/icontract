import * as React from "react";
import { Badge, Progress, Tooltip } from "@/components/ui/primitives";
import { MerlinMark, ClauseStatusBadge } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./LeftRail";
import { CONTRACT } from "@/lib/data";
import { FileText, PanelRightClose, ShieldCheck, Check, Eye, ChevronRight } from "lucide-react";

export function ArtifactPanel({
  onClose,
  onOpenClause,
  onSubmit,
  onPreview,
}: {
  onClose: () => void;
  onOpenClause: (clauseId: string) => void;
  onSubmit: () => void;
  onPreview?: () => void;
}) {
  const { clauses, metadata, insights, isBlank, intakeMode, submitted } = useStore();
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
  const statusText = submitted ? "in approval" : "draft";

  return (
    <aside className="hidden w-[380px] shrink-0 flex-col border-l border-border bg-card lg:flex">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <FileText className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">
            {isBlank ? "Untitled agreement" : "Purchase Agreement"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] leading-tight text-muted-foreground">
            <span>{isBlank ? "Artifact" : CONTRACT.id}</span>
            <span>·</span>
            <span className={submitted ? "font-medium text-success" : ""}>{statusText}</span>
          </div>
        </div>
        {onPreview && (
          <Tooltip content="Preview full contract" side="left">
            <button onClick={onPreview} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Preview contract">
              <Eye className="size-4" />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Hide artifact" side="left">
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Hide artifact">
            <PanelRightClose className="size-4" />
          </button>
        </Tooltip>
      </div>

      {/* steps / progress */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Progress</span>
          <Badge tone={submitted ? "primary" : health.ready ? "low" : "med"}>
            {submitted ? "In approval" : health.ready ? "Ready" : intakeMode ? "Gathering" : "In progress"}
          </Badge>
        </div>
        <div className="mt-2.5 flex items-center">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex flex-col items-center gap-1">
                <span className={`grid size-5 place-items-center rounded-full text-[10px] ${s.done ? "bg-success text-success-foreground" : "border border-border text-muted-foreground"}`}>
                  {s.done ? <Check className="size-3" /> : i + 1}
                </span>
                <span className={`text-[10px] ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`mx-1 mb-4 h-px flex-1 ${steps[i + 1].done ? "bg-success" : "bg-border"}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground">Health score</span>
          <span className="text-lg font-bold tabular-nums">{health.score}<span className="text-xs font-normal text-muted-foreground">/100</span></span>
        </div>
        <Progress value={health.score} tone={health.score >= 90 ? "success" : health.score >= 70 ? "primary" : "warning"} className="mt-1.5" />
      </div>

      {/* tabs — underline style */}
      <div className="flex gap-5 border-b border-border px-4">
        {(["document", "metadata"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative -mb-px py-2.5 text-[13px] font-medium capitalize transition-colors ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {tab === "document" ? (
          clauses.length === 0 ? (
            <div className="grid place-items-center gap-2 py-16 text-center">
              <MerlinMark size={30} active={false} />
              <p className="text-sm font-medium">Nothing drafted yet</p>
              <p className="max-w-[220px] text-xs text-muted-foreground">As Merlin builds the contract, clauses appear here for you to review.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {clauses.map((c) => {
                const flagged = c.risk !== "none";
                const railColor = c.risk === "high" ? "var(--risk-high)" : c.risk === "medium" ? "var(--risk-med)" : "var(--risk-low)";
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenClause(c.id)}
                    className="group relative w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/60"
                  >
                    {flagged && (
                      <span className="absolute inset-y-2.5 left-0.5 w-[3px] rounded-full" style={{ background: railColor }} />
                    )}
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground/55">{c.number}</span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{c.title}</span>
                      {c.status !== "standard" && <ClauseStatusBadge status={c.status} />}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 line-clamp-1 pl-[26px] text-[12.5px] leading-relaxed text-muted-foreground/80">{c.body || "Empty clause"}</p>
                  </button>
                );
              })}
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
        {submitted ? (
          <button
            onClick={onSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success/40 bg-risk-low-soft/60 px-4 py-2.5 text-sm font-medium text-success transition-colors hover:bg-risk-low-soft"
          >
            <Check className="size-4" /> In approval · Stage 1 of 4
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
