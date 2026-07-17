import * as React from "react";
import { Badge, Progress, Tooltip } from "@/components/ui/primitives";
import { RiskDot } from "@/components/shared";
import { useStore } from "@/store";
import {
  LayoutDashboard,
  Database,
  IndianRupee,
  ListOrdered,
  Sparkles,
  MessageSquare,
  GitBranch,
  CheckSquare,
  ScrollText,
  Paperclip,
  ChevronLeft,
  PanelLeftClose,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CenterView =
  | "document"
  | "metadata"
  | "commercial"
  | "ai"
  | "comments"
  | "versions"
  | "approvals"
  | "audit"
  | "attachments";

const NAV: {
  id: string;
  label: string;
  icon: LucideIcon;
  view: CenterView;
  badge?: "risk" | "count";
}[] = [
  { id: "overview", label: "Contract Overview", icon: LayoutDashboard, view: "document" },
  { id: "metadata", label: "Metadata", icon: Database, view: "metadata" },
  { id: "commercial", label: "Commercial Details", icon: IndianRupee, view: "commercial" },
  { id: "clauses", label: "Clauses", icon: ListOrdered, view: "document" },
  { id: "ai", label: "AI Suggestions", icon: Sparkles, view: "ai", badge: "risk" },
  { id: "comments", label: "Comments", icon: MessageSquare, view: "comments", badge: "count" },
  { id: "versions", label: "Versions", icon: GitBranch, view: "versions" },
  { id: "approvals", label: "Approvals", icon: CheckSquare, view: "approvals" },
  { id: "audit", label: "Audit", icon: ScrollText, view: "audit" },
  { id: "attachments", label: "Attachments", icon: Paperclip, view: "attachments" },
];

export function useHealth() {
  const { insights, clauses, metadata } = useStore();
  return React.useMemo(() => {
    const openRisks = insights.filter((i) => !i.resolved && i.type === "risk");
    const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");
    const highClauses = clauses.filter((c) => c.risk === "high").length;
    const reqMissing = metadata.filter(
      (f) => f.required && (f.confidence === "missing" || !f.value)
    ).length;

    // an empty document can't be healthy
    if (clauses.length === 0) {
      return { score: 5, openRisks: 0, openMissing: 0, ready: false, empty: true };
    }

    const score = Math.max(
      5,
      Math.min(
        100,
        100 - openRisks.length * 8 - openMissing.length * 6 - highClauses - reqMissing * 3
      )
    );
    return {
      score,
      openRisks: openRisks.length,
      openMissing: openMissing.length,
      ready: openRisks.length === 0 && openMissing.length === 0 && reqMissing === 0,
      empty: false,
    };
  }, [insights, clauses, metadata]);
}

export function LeftRail({
  active,
  onSelect,
  collapsed,
  onToggle,
}: {
  active: string;
  onSelect: (id: string, view: CenterView) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { clauses, comments, setSelectedClause, selectedClauseId } = useStore();
  const health = useHealth();
  const openComments = comments.filter((c) => !c.resolved).length;

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center gap-1 border-r border-border bg-card py-3">
        <Tooltip content="Expand" side="right">
          <button
            onClick={onToggle}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <ChevronLeft className="size-4 rotate-180" />
          </button>
        </Tooltip>
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <Tooltip key={n.id} content={n.label} side="right">
              <button
                onClick={() => onSelect(n.id, n.view)}
                className={`grid size-8 place-items-center rounded-lg ${
                  active === n.id
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                <Icon className="size-4" />
              </button>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-60 flex-col border-r border-border bg-card">
      {/* health */}
      <div className="border-b border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Health score
          </span>
          <button
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{health.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
          <Badge tone={health.ready ? "low" : "med"} className="ml-auto">
            {health.ready ? "Ready" : "In progress"}
          </Badge>
        </div>
        <Progress
          value={health.score}
          tone={health.score >= 90 ? "success" : health.score >= 70 ? "primary" : "warning"}
          className="mt-2"
        />
        <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <RiskDot risk="high" /> {health.openRisks} risks
          </span>
          <span className="inline-flex items-center gap-1">
            <RiskDot risk="medium" /> {health.openMissing} missing
          </span>
        </div>
      </div>

      {/* nav */}
      <nav className="space-y-0.5 border-b border-border p-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n.id, n.view)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge === "risk" && health.openRisks + health.openMissing > 0 && (
                <span className="rounded-full bg-risk-high-soft px-1.5 text-[10px] font-semibold text-risk-high">
                  {health.openRisks + health.openMissing}
                </span>
              )}
              {n.badge === "count" && openComments > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                  {openComments}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* document outline */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Document outline
        </div>
        <div className="space-y-0.5">
          {clauses.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedClause(c.id);
                onSelect("clauses", "document");
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                selectedClauseId === c.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <RiskDot risk={c.risk} />
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
                {c.number}
              </span>
              <span className="flex-1 truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
