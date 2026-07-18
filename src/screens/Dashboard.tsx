import * as React from "react";
import { TopBar } from "@/components/TopBar";
import { Card, Button, Badge, Progress } from "@/components/ui/primitives";
import {
  RiskDot,
  SectionLabel,
} from "@/components/shared";
import { useStore } from "@/store";
import {
  RECENT_CONTRACTS,
} from "@/lib/data";
import {
  Plus,
  ArrowRight,
  FileText,
  Clock,
  ListFilter,
} from "lucide-react";
import type { RiskLevel } from "@/lib/types";

type DashboardContractStatus = (typeof RECENT_CONTRACTS)[number]["status"];

export function Dashboard() {
  const { go, startDraft, searchQuery } = useStore();
  const [statusFilter, setStatusFilter] = React.useState<"All" | DashboardContractStatus>("All");
  const openAttention = RECENT_CONTRACTS.filter((c) => c.status !== "Signed").length;
  const draftCount = RECENT_CONTRACTS.filter((c) => c.status === "Draft").length;
  const statusFilteredContracts =
    statusFilter === "All"
      ? RECENT_CONTRACTS
      : RECENT_CONTRACTS.filter((c) => c.status === statusFilter);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredContracts = normalizedQuery
    ? statusFilteredContracts.filter((c) =>
        [c.title, c.id, c.value, c.status, c.updated]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : statusFilteredContracts;
  const routedCount = openAttention - draftCount;
  const statusOptions: Array<{
    label: "All" | DashboardContractStatus;
    count: number;
  }> = [
    { label: "All", count: RECENT_CONTRACTS.length },
    { label: "Draft", count: RECENT_CONTRACTS.filter((c) => c.status === "Draft").length },
    { label: "In Review", count: RECENT_CONTRACTS.filter((c) => c.status === "In Review").length },
    { label: "In Approval", count: RECENT_CONTRACTS.filter((c) => c.status === "In Approval").length },
    { label: "Signed", count: RECENT_CONTRACTS.filter((c) => c.status === "Signed").length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main className="mx-auto max-w-[1240px] px-6 py-8">
        {/* Greeting + CTA */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Good afternoon, Jitendra
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Procurement Manager · Manufacturing · {RECENT_CONTRACTS.length} contracts · {openAttention} need attention
            </p>
          </div>
          <Button size="lg" onClick={() => go("starting-point")}>
            <Plus className="size-4" /> New contract
          </Button>
        </div>

        <div className="mt-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <SectionLabel>All contracts</SectionLabel>
                <div className="mt-1 text-xs text-muted-foreground">
                  {searchQuery.trim()
                    ? `${filteredContracts.length} matching contracts`
                    : `${draftCount} drafts · ${routedCount} routed or under review`}
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <ListFilter className="size-3.5" /> Sorted by last updated
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {statusOptions.map((option) => {
                const isActive = statusFilter === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setStatusFilter(option.label)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                    ].join(" ")}
                  >
                    <span>{option.label}</span>
                    <span
                      className={[
                        "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                        isActive
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <Card className="divide-y divide-border">
              {filteredContracts.length ? filteredContracts.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-accent/50 sm:grid sm:grid-cols-[minmax(0,1fr)_220px_120px_132px] sm:items-center sm:gap-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{c.title}</span>
                        <RiskDot risk={c.risk as RiskLevel} />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{c.id}</span>
                        <span>·</span>
                        <span>{c.value}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" /> {c.updated}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-[220px]">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Health</span>
                      <span className="tabular-nums font-medium">{c.health}%</span>
                    </div>
                    <Progress
                      value={c.health}
                      tone={c.health >= 90 ? "success" : c.health >= 75 ? "primary" : "warning"}
                    />
                  </div>

                  <div className="sm:justify-self-start">
                    <Badge tone={c.status === "Signed" ? "low" : c.status === "Draft" ? "med" : "primary"}>
                      {c.status}
                    </Badge>
                  </div>

                  <div className="sm:justify-self-end">
                  {c.isDraft ? (
                    <Button size="sm" className="w-full justify-center sm:w-[132px]" onClick={() => startDraft()}>
                      Continue <ArrowRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="w-full justify-center sm:w-[132px]" onClick={() => startDraft()}>
                      Open
                    </Button>
                  )}
                  </div>
                </div>
              )) : (
                <div className="px-6 py-10 text-center">
                  <div className="text-sm font-medium">No contracts match this search</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Try another keyword or switch the status filter.
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
