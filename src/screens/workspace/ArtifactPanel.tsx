import * as React from "react";
import { Badge, Progress, Tooltip } from "@/components/ui/primitives";
import { MerlinMark, ClauseStatusBadge } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./LeftRail";
import { CONTRACT } from "@/lib/data";
import { FileText, PanelRightClose, ShieldCheck, Check, Eye } from "lucide-react";

export function ArtifactPanel({
  onClose,
  onAskAbout,
  onSubmit,
  onPreview,
}: {
  onClose: () => void;
  onAskAbout: (label: string) => void;
  onSubmit: () => void;
  onPreview?: () => void;
}) {
  const { clauses, metadata, insights, isBlank, intakeMode } = useStore();
  const health = useHealth();
  const [tab, setTab] = React.useState<"document" | "metadata">("document");

  const filled = metadata.filter((f) => f.value).length;
  const openRisks = insights.filter((i) => !i.resolved && i.type === "risk").length;
  const steps = [
    { label: "Details", done: filled >= 6 },
    { label: "Draft", done: clauses.length > 0 },
    { label: "Risks", done: clauses.length > 0 && openRisks === 0 },
    { label: "Approval", done: health.ready },
  ];

  return (
    <aside className="hidden w-[380px] shrink-0 flex-col border-l border-border bg-card lg:flex">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <FileText className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">
            {isBlank ? "Untitled agreement" : "Purchase Agreement"}
          </div>
          <div className="text-[11px] text-muted-foreground leading-tight">
            {isBlank ? "Artifact · draft" : `${CONTRACT.id} · draft`}
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
          <Badge tone={health.ready ? "low" : "med"}>{health.ready ? "Ready" : intakeMode ? "Gathering" : "In progress"}</Badge>
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

      {/* tabs */}
      <div className="flex gap-1 border-b border-border px-3 py-2">
        {(["document", "metadata"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              tab === t ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {t}
          </button>
        ))}
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
            <div className="space-y-2">
              {clauses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onAskAbout(`§${c.number} ${c.title}`)}
                  className={`w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-merlin-border ${c.risk !== "none" ? "border-l-2" : ""}`}
                  style={c.risk !== "none" ? { borderLeftColor: c.risk === "high" ? "var(--risk-high)" : c.risk === "medium" ? "var(--risk-med)" : "var(--risk-low)" } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{c.number}</span>
                    <span className="flex-1 truncate text-[13.5px] font-medium">{c.title}</span>
                    <ClauseStatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{c.body || "Empty clause"}</p>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {(["Supplier", "Commercial", "Financial", "Legal", "Renewal", "Compliance"] as const).map((g) => {
              const fields = metadata.filter((f) => f.group === g);
              if (!fields.length) return null;
              return (
                <div key={g}>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g}</div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    {fields.map((f, i) => (
                      <div key={f.id} className={`grid grid-cols-2 gap-2 px-3 py-1.5 text-[12.5px] ${i ? "border-t border-border" : ""}`}>
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={`truncate text-right font-medium ${!f.value ? "text-risk-med" : ""}`}>{f.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        {onPreview && (
          <button
            onClick={onPreview}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Eye className="size-4" /> Preview
          </button>
        )}
        <button
          onClick={onSubmit}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ShieldCheck className="size-4" /> Submit for approval
        </button>
      </div>
    </aside>
  );
}
