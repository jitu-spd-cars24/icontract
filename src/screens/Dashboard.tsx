import { TopBar } from "@/components/TopBar";
import { Card, Button, Badge, Progress } from "@/components/ui/primitives";
import {
  MerlinMark,
  RiskDot,
  SectionLabel,
  RISK_META,
} from "@/components/shared";
import { useStore } from "@/store";
import {
  RECENT_CONTRACTS,
  RECENT_SUPPLIERS,
  DASH_RECS,
  PENDING_APPROVALS,
} from "@/lib/data";
import {
  Plus,
  ArrowRight,
  FileText,
  Clock,
  Building2,
  CheckSquare,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { RiskLevel } from "@/lib/types";

export function Dashboard() {
  const { go, startDraft } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <TopBar onNew={() => go("starting-point")} />

      <main className="mx-auto max-w-[1240px] px-6 py-8">
        {/* Greeting + CTA */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Good afternoon, Jitendra
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Procurement Manager · Manufacturing · 4 contracts need your attention
            </p>
          </div>
          <Button size="lg" onClick={() => go("starting-point")}>
            <Plus className="size-4" /> New contract
          </Button>
        </div>

        {/* Merlin briefing banner */}
        <Card className="mt-6 overflow-hidden border-merlin-border">
          <div className="flex items-start gap-4 bg-merlin-soft/60 p-4">
            <MerlinMark size={36} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Merlin — your daily briefing</span>
                <Badge tone="merlin">
                  <Sparkles /> Proactive
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                I reviewed your active portfolio this morning. Here's what needs a decision.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {DASH_RECS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => go(r.id === "d3" ? "starting-point" : "dashboard")}
                    className="group flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-merlin-border"
                  >
                    <span
                      className="mt-1 size-2 shrink-0 rounded-full"
                      style={{
                        background:
                          r.tone === "high"
                            ? "var(--risk-high)"
                            : r.tone === "warning"
                            ? "var(--risk-med)"
                            : "var(--info)",
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">{r.title}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {r.detail}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Recent contracts */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Recent contracts</SectionLabel>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                View all <ChevronRight className="size-3" />
              </button>
            </div>
            <Card className="divide-y divide-border">
              {RECENT_CONTRACTS.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-accent text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{c.title}</span>
                      <RiskDot risk={c.risk as RiskLevel} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{c.id}</span>
                      <span>·</span>
                      <span>{c.value}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" /> {c.updated}
                      </span>
                    </div>
                  </div>
                  <div className="hidden w-28 sm:block">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Health</span>
                      <span className="tabular-nums font-medium">{c.health}%</span>
                    </div>
                    <Progress
                      value={c.health}
                      tone={c.health >= 90 ? "success" : c.health >= 75 ? "primary" : "warning"}
                    />
                  </div>
                  <Badge tone={c.status === "Signed" ? "low" : c.status === "Draft" ? "med" : "primary"}>
                    {c.status}
                  </Badge>
                  {c.isDraft ? (
                    <Button size="sm" onClick={() => startDraft()}>
                      Continue <ArrowRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => startDraft()}>
                      Open
                    </Button>
                  )}
                </div>
              ))}
            </Card>

            {/* Continue draft callout */}
            <Card className="mt-4 flex items-center gap-4 border-primary/30 bg-accent/40 p-4">
              <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="size-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Pick up where you left off</div>
                <div className="text-xs text-muted-foreground">
                  ABC Manufacturing — Purchase Agreement · 3 open risks · edited just now
                </div>
              </div>
              <Button onClick={() => startDraft()}>
                Resume draft <ArrowRight className="size-4" />
              </Button>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Approvals */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CheckSquare className="size-4 text-muted-foreground" />
                <SectionLabel>Waiting on you</SectionLabel>
                <Badge tone="high" className="ml-auto">
                  {PENDING_APPROVALS.length}
                </Badge>
              </div>
              <Card className="divide-y divide-border">
                {PENDING_APPROVALS.map((a) => (
                  <div key={a.id} className="p-3">
                    <div className="text-sm font-medium leading-snug">{a.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{a.stage}</span>
                      <span>{a.from} · {a.waiting}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="success" className="h-7">Approve</Button>
                      <Button size="sm" variant="outline" className="h-7">Review</Button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>

            {/* Suppliers */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <SectionLabel>Recent suppliers</SectionLabel>
              </div>
              <Card className="divide-y divide-border">
                {RECENT_SUPPLIERS.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 p-3">
                    <div className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.contracts} contracts · {s.region}
                      </div>
                    </div>
                    <Badge tone={RISK_META[s.risk as RiskLevel].tone}>
                      {s.risk}
                    </Badge>
                  </div>
                ))}
              </Card>
            </div>

            {/* Quick stat */}
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="size-4" />
                <span className="text-xs font-medium">Cycle time this quarter</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">6.2</span>
                <span className="text-sm text-muted-foreground">days avg</span>
                <Badge tone="low" className="ml-auto">
                  ↓ 38% with Merlin
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
