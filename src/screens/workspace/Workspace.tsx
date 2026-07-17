import * as React from "react";
import { Button, Badge, Avatar, Tooltip } from "@/components/ui/primitives";
import { Logo, MerlinMark } from "@/components/shared";
import { useStore } from "@/store";
import { LeftRail, useHealth, type CenterView } from "./LeftRail";
import { DocumentCanvas } from "./DocumentCanvas";
import { MerlinPanel } from "./MerlinPanel";
import { ApprovalModal } from "./ApprovalModal";
import {
  MetadataView,
  CommentsView,
  VersionsView,
  AuditView,
  ApprovalsView,
  AttachmentsView,
  AISuggestionsView,
} from "./CenterViews";
import {
  ArrowLeft,
  Check,
  Share2,
  MoreHorizontal,
  PanelRightClose,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";

export function Workspace() {
  const { go, theme, toggleTheme, setMerlinTab, isBlank } = useStore();
  const health = useHealth();
  const [nav, setNav] = React.useState("overview");
  const [view, setView] = React.useState<CenterView>("document");
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [rightCollapsed, setRightCollapsed] = React.useState(false);
  const [showApproval, setShowApproval] = React.useState(false);

  function handleNav(id: string, v: CenterView) {
    setNav(id);
    setView(v);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
        <button onClick={() => go("dashboard")} aria-label="Dashboard">
          <Logo collapsed />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          onClick={() => go("dashboard")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Contracts
        </button>
        <span className="text-muted-foreground/50">/</span>
        <span className="max-w-[280px] truncate text-sm font-medium">
          {isBlank ? "Untitled agreement" : "ABC Manufacturing — Purchase Agreement"}
        </span>
        <Badge tone="med">{isBlank ? "Blank draft" : "Draft"}</Badge>
        <span className="hidden items-center gap-1 text-[11px] text-muted-foreground md:inline-flex">
          <Check className="size-3 text-success" /> Auto-saved
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="mr-1 hidden items-center gap-2 rounded-lg border border-border px-2.5 py-1 sm:flex">
            <span className="text-[11px] text-muted-foreground">Health</span>
            <span className="text-sm font-bold tabular-nums">{health.score}</span>
            <span
              className="size-2 rounded-full"
              style={{
                background: health.ready ? "var(--risk-low)" : "var(--risk-med)",
              }}
            />
          </div>
          {!isBlank && (
            <div className="mr-1 hidden -space-x-1.5 sm:flex">
              <Avatar name="Priya Nair" className="size-6 ring-2 ring-card" />
              <Avatar name="Rahul Mehta" className="size-6 ring-2 ring-card" tone="var(--info)" />
              <Avatar name="Ananya Rao" className="size-6 ring-2 ring-card" tone="var(--merlin)" />
            </div>
          )}
          <Tooltip content="Toggle theme">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </Tooltip>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Share2 className="size-3.5" /> Share
          </Button>
          <Button size="sm" onClick={() => setShowApproval(true)}>
            Submit for approval
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </header>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        <LeftRail
          active={nav}
          onSelect={handleNav}
          collapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed((c) => !c)}
        />

        {/* center */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-background scrollbar-thin">
          {view === "document" && <DocumentCanvas />}
          {view === "metadata" && <MetadataView />}
          {view === "commercial" && <MetadataView commercialOnly />}
          {view === "ai" && (
            <AISuggestionsView
              onGotoClause={() => {
                setNav("clauses");
                setView("document");
              }}
              onOpenMerlin={() => setRightCollapsed(false)}
            />
          )}
          {view === "comments" && <CommentsView />}
          {view === "versions" && <VersionsView />}
          {view === "audit" && <AuditView />}
          {view === "attachments" && <AttachmentsView />}
          {view === "approvals" && (
            <ApprovalsView onSubmit={() => setShowApproval(true)} />
          )}
        </main>

        {/* right Merlin panel */}
        {rightCollapsed ? (
          <div className="flex w-12 flex-col items-center border-l border-border bg-card py-3">
            <Tooltip content="Open Merlin" side="left">
              <button
                onClick={() => setRightCollapsed(false)}
                className="relative grid size-9 place-items-center rounded-lg bg-merlin text-merlin-foreground merlin-glow"
              >
                <Sparkles className="size-4" />
                {!health.ready && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {health.openRisks + health.openMissing}
                  </span>
                )}
              </button>
            </Tooltip>
          </div>
        ) : (
          <aside className="relative w-[360px] shrink-0 overflow-hidden border-l border-border">
            <button
              onClick={() => setRightCollapsed(true)}
              className="absolute -left-3 top-3 z-10 grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
              aria-label="Collapse Merlin panel"
            >
              <PanelRightClose className="size-3.5" />
            </button>
            <MerlinPanel />
          </aside>
        )}
      </div>

      {showApproval && <ApprovalModal onClose={() => setShowApproval(false)} />}
    </div>
  );
}
