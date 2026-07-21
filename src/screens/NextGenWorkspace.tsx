import * as React from "react";
import { Button, Badge, Avatar, Tooltip } from "@/components/ui/primitives";
import { Logo, MerlinMark, MerlinOrb, SectionLabel } from "@/components/shared";
const PlasmaSphere = React.lazy(() =>
  import("@/components/PlasmaSphere").then((m) => ({ default: m.PlasmaSphere }))
);
import { AmbientBackground } from "@/components/AmbientBackground";
import { useStore } from "@/store";
import { useHealth } from "./workspace/LeftRail";
import { MerlinChat } from "./workspace/MerlinChat";
import { ArtifactPanel } from "./workspace/ArtifactPanel";
import { ApprovalModal } from "./workspace/ApprovalModal";
import { ContractPreview } from "./workspace/ContractPreview";
import { ClauseDetail } from "./workspace/ClauseDetail";
import { CommandWidgets } from "./workspace/CommandWidgets";
import { RECENT_CONTRACTS, PROJECTS } from "@/lib/data";
import {
  Plus, Search, Send, Sparkles, PanelRightClose, PanelRightOpen, Moon, Sun,
  FileText, ArrowLeft, X, LayoutTemplate, Upload, FilePlus2, Copy, Check, ArrowRight,
  Eye, PanelLeftClose, PanelLeftOpen, ShieldAlert,
  WandSparkles, SlidersHorizontal, Folder, ChevronDown, ChevronRight, Pin,
  Clock, MoreHorizontal, Flag, User, ListChecks, BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type View = "home" | "chat" | "insights";
type RecentContract = (typeof RECENT_CONTRACTS)[number];
type SessionStatus = "Draft" | "In Review" | "In Approval" | "Signed";
type ContractStatusFilter = "All" | SessionStatus;

const MERLIN_HOME_UPDATES = [
  {
    id: "priority",
    label: "Action needed",
    title: "ABC Manufacturing can be approval-ready today",
    detail: "Resolve the Net 90 payment term and draft health moves from 72 to 84.",
    context: "ABC Manufacturing",
    subtitle: "Purchase Agreement",
    date: "Due today",
    priority: "High" as const,
    progress: 72,
    tasks: { done: 18, total: 25 },
    tone: "high" as const,
    cta: "Open draft",
    onSelectStatus: "Draft" as const,
    onSelectTitle: "ABC Manufacturing — Purchase Agreement",
  },
  {
    id: "approval",
    label: "In approval",
    title: "Cloudspring is waiting on finance sign-off",
    detail: "One approver decision moves the MSA into the final signature route.",
    context: "Cloudspring Technologies",
    subtitle: "Master Services Agreement",
    date: "2h ago",
    priority: "Medium" as const,
    progress: 96,
    tasks: { done: 3, total: 4 },
    tone: "success" as const,
    cta: "Review route",
    onSelectStatus: "In Approval" as const,
    onSelectTitle: "Cloudspring Technologies — MSA",
  },
  {
    id: "pattern",
    label: "Merlin insight",
    title: "Payment terms are the main portfolio pattern this week",
    detail: "3 recent drafts pushed beyond the Net 45 standard. Start with the fallback set.",
    context: "Portfolio signal",
    subtitle: "3 drafts flagged",
    date: "This week",
    priority: "Low" as const,
    progress: 68,
    tasks: { done: 9, total: 12 },
    tone: "merlin" as const,
    cta: "Use suggestion",
    onSelectStatus: "Draft" as const,
    onSelectTitle: "Apex Digital — Statement of Work",
  },
];

export function NextGenWorkspace() {
  const store = useStore();
  const { theme, toggleTheme, setAppMode, startMerlinIntake, startDraft, startBlank, submitted, submitForApproval } = store;
  const health = useHealth();

  const [view, setView] = React.useState<View>("home");
  const [sessionKey, setSessionKey] = React.useState(0);
  const [title, setTitle] = React.useState("New contract");
  const [sessionStatus, setSessionStatus] = React.useState<SessionStatus>("Draft");
  const [showStart, setShowStart] = React.useState(false);
  const [artifactOpen, setArtifactOpen] = React.useState(true);
  const [showApproval, setShowApproval] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [openClauseId, setOpenClauseId] = React.useState<string | null>(null);
  const [homeInput, setHomeInput] = React.useState("");
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [sidebarQuery, setSidebarQuery] = React.useState("");
  const [openProjects, setOpenProjects] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(PROJECTS.map((p) => [p.id, p.pinned]))
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Once the contract is routed, reflect it across the whole window.
  React.useEffect(() => {
    if (submitted && sessionStatus === "Draft") setSessionStatus("In Approval");
  }, [submitted, sessionStatus]);

  const normalizedSidebarQuery = sidebarQuery.trim().toLowerCase();
  const visibleProjects = normalizedSidebarQuery
    ? PROJECTS.map((project) => {
        const projectMatches = project.name.toLowerCase().includes(normalizedSidebarQuery);
        const items = projectMatches
          ? project.items
          : project.items.filter((item) => item.title.toLowerCase().includes(normalizedSidebarQuery));
        return { ...project, items };
      }).filter((project) => project.items.length > 0 || project.name.toLowerCase().includes(normalizedSidebarQuery))
    : PROJECTS;
  const visibleRecentContracts = normalizedSidebarQuery
    ? RECENT_CONTRACTS.filter((contract) =>
        contract.title.toLowerCase().includes(normalizedSidebarQuery) ||
        contract.status.toLowerCase().includes(normalizedSidebarQuery)
      )
    : RECENT_CONTRACTS;
  const hasSidebarResults = visibleProjects.length > 0 || visibleRecentContracts.length > 0;

  function beginSession(name: string) {
    setTitle(name);
    setSessionKey((k) => k + 1);
    setView("chat");
    setArtifactOpen(true);
    setShowPreview(false);
    setOpenClauseId(null);
  }
  function startWith(method: string) {
    setShowStart(false);
    setSessionStatus("Draft");
    if (method === "merlin") { startMerlinIntake(); beginSession("New contract · Merlin"); }
    else if (method === "blank") { startBlank(); beginSession("Untitled agreement"); }
    else if (method === "duplicate") { startDraft({ duplicatedFrom: "Nimbus Steel — Purchase Agreement" }); beginSession("Copy · Purchase Agreement"); }
    else { startDraft(); beginSession(method === "template" ? "New · from template" : "Imported paper"); }
  }
  function openContract(contract: Pick<RecentContract, "title" | "status"> & { id?: string }) {
    startDraft();
    const nextStatus = (contract.status as SessionStatus) ?? "Draft";
    setSessionStatus(nextStatus);
    if (contract.id) setActiveId(contract.id);
    if (nextStatus === "In Approval") submitForApproval();
    beginSession(contract.title);
  }
  function homeSubmit() {
    if (!homeInput.trim()) return;
    setSessionStatus("Draft");
    startMerlinIntake();
    beginSession("New contract · Merlin");
    setHomeInput("");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className={`hidden shrink-0 flex-col transition-[width] duration-200 md:flex ${
        leftCollapsed
          ? "w-14 bg-transparent pt-4"
          : "my-3 ml-3 h-[calc(100vh-1.5rem)] w-[292px] overflow-hidden rounded-[28px] border border-border/70 bg-card/95 shadow-[0_24px_80px_rgba(15,15,25,0.12)] backdrop-blur-xl"
      }`}>
        {leftCollapsed ? (
          <button
            onClick={() => setLeftCollapsed(false)}
            className="ml-3 grid size-10 place-items-center rounded-xl border border-border/70 bg-card/95 text-muted-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        ) : (
          <>
            <div className="flex h-[72px] items-center gap-2 px-4">
              <button onClick={() => setView("home")} className="min-w-0" aria-label="Home"><Logo /></button>
              <button
                onClick={() => setLeftCollapsed(true)}
                className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>
            {/* New contract — prominent launcher */}
            <div className="px-4 pt-1">
              <button
                onClick={() => setShowStart(true)}
                className="flex w-full items-center justify-start gap-2.5 rounded-2xl bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm shadow-primary/10 transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
              >
                <Plus className="size-[18px]" strokeWidth={2.6} />
                New contract
              </button>
            </div>

            <div className="px-4 pt-3">
              <label className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-3.5 text-muted-foreground shadow-xs transition-colors focus-within:border-primary/35 focus-within:bg-card focus-within:text-foreground">
                <Search className="size-4 shrink-0" />
                <input
                  value={sidebarQuery}
                  onChange={(event) => setSidebarQuery(event.target.value)}
                  placeholder="Search contracts..."
                  className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
                />
                {sidebarQuery && (
                  <button
                    type="button"
                    onClick={() => setSidebarQuery("")}
                    className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </label>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto px-4 scrollbar-thin">
              {!hasSidebarResults && (
                <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
                  No contracts found
                </div>
              )}

              {/* Projects */}
              {visibleProjects.length > 0 && (
                <div className="mb-1 flex items-center gap-2 px-1 py-1">
                  <Folder className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-[13px] font-medium text-muted-foreground">Projects</span>
                  <Tooltip content="New project" side="top">
                    <button className="grid size-5 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="New project">
                      <Plus className="size-3.5" />
                    </button>
                  </Tooltip>
                </div>
              )}
              <div className="space-y-0.5">
                {visibleProjects.map((p) => {
                  const open = openProjects[p.id];
                  return (
                    <div key={p.id}>
                      <button
                        onClick={() => setOpenProjects((s) => ({ ...s, [p.id]: !s[p.id] }))}
                        className="group flex w-full items-center gap-1.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-accent/45"
                      >
                        {p.pinned && (
                          <Pin className="size-3 shrink-0 -rotate-45 fill-current text-muted-foreground/70" />
                        )}
                        <span className="grid size-4 shrink-0 place-items-center text-muted-foreground">
                          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{p.name}</span>
                      </button>
                      {open && (
                        <div className="mb-1 ml-[13px] space-y-0.5 border-l border-border/60 pl-3">
                          {p.items.map((it) => {
                            const active = activeId === it.id;
                            return (
                              <button
                                key={it.id}
                                onClick={() => openContract(it)}
                                className={`block w-full truncate rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors ${
                                  active
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                                }`}
                              >
                                {it.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Recent */}
              {visibleRecentContracts.length > 0 && (
                <div className="mb-1 mt-5 flex items-center gap-2 px-1 py-1">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-muted-foreground">Recent</span>
                </div>
              )}
              <div className="space-y-0.5">
                {visibleRecentContracts.map((c) => {
                  const active = activeId === c.id;
                  return (
                    <div
                      key={c.id}
                      className="group relative flex items-center rounded-lg transition-colors hover:bg-accent/45"
                    >
                      <button
                        onClick={() => openContract(c)}
                        className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors ${
                          active ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {c.title}
                      </button>
                      <button
                        className="mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border/70 p-3">
              <button onClick={() => setAppMode("chooser")} className="mb-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] text-muted-foreground hover:bg-accent/50">
                <ArrowLeft className="size-3.5" /> Switch experience
              </button>
              <div className="flex items-center gap-2 px-1 py-1">
                <Avatar name="Jitendra Kumar" className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">Jitendra Kumar</div>
                  <div className="truncate text-[11px] text-muted-foreground">Procurement Manager</div>
                </div>
                <button onClick={toggleTheme} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Toggle theme">
                  {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ===== CENTER ===== */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {view === "chat" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-24 items-start gap-2 bg-gradient-to-b from-background via-background/90 via-55% to-transparent px-4 pt-3">
            <button onClick={() => setView("home")} className="pointer-events-auto grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Back to home"><ArrowLeft className="size-4" /></button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold leading-tight">{title}</span>
                {sessionStatus === "In Approval" && <Badge tone="low"><Check className="size-3" /> In approval</Badge>}
                {sessionStatus === "In Review" && <Badge tone="med">In review</Badge>}
                {sessionStatus === "Signed" && <Badge tone="low">Signed</Badge>}
              </div>
              <div className="truncate text-[11px] text-muted-foreground leading-tight">
                Health {health.score}/100
                {sessionStatus === "In Approval" ? " · routed to 4 approvers" : ""}
                {sessionStatus === "In Review" ? " · pending internal review" : ""}
                {sessionStatus === "Signed" ? " · executed" : ""}
              </div>
            </div>
            <div className="pointer-events-auto ml-auto flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="size-3.5" /> Preview contract
              </Button>
              <Tooltip content={artifactOpen ? "Hide artifact" : "Show artifact"} side="left">
                <button onClick={() => setArtifactOpen((o) => !o)} className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent" aria-label="Toggle artifact">
                  {artifactOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {view === "home" && (
          <HomeView input={homeInput} setInput={setHomeInput} onSubmit={homeSubmit} onNew={() => setShowStart(true)} onOpen={openContract} onViewInsights={() => setView("insights")} onDraftMerlin={() => startWith("merlin")} theme={theme} toggleTheme={toggleTheme} leftCollapsed={leftCollapsed} />
        )}
        {view === "insights" && (
          <MerlinInsightsView onBack={() => setView("home")} onOpen={openContract} />
        )}
        {view === "chat" && (
          <MerlinChat sessionKey={sessionKey} sessionStatus={sessionStatus} onOpenApproval={() => setShowApproval(true)} />
        )}
      </main>

      {/* ===== RIGHT ARTIFACT ===== */}
      {view === "chat" && artifactOpen && (
        <ArtifactPanel sessionStatus={sessionStatus} onClose={() => setArtifactOpen(false)} onPreview={() => setShowPreview(true)} onOpenClause={(id) => setOpenClauseId(id)} onSubmit={() => setShowApproval(true)} />
      )}

      {showStart && <StartModal onClose={() => setShowStart(false)} onPick={startWith} />}
      {showApproval && <ApprovalModal onClose={() => setShowApproval(false)} />}
      {showPreview && <ContractPreview statusLabel={sessionStatus} onClose={() => setShowPreview(false)} />}
      {openClauseId && <ClauseDetail clauseId={openClauseId} onClose={() => setOpenClauseId(null)} />}
    </div>
  );
}

/* ---------------- Home ---------------- */
function HomeView({ input, setInput, onSubmit, onNew, onOpen, onViewInsights, onDraftMerlin, theme, toggleTheme, leftCollapsed }: {
  input: string; setInput: (v: string) => void; onSubmit: () => void; onNew: () => void;
  onOpen: (contract: Pick<RecentContract, "title" | "status">) => void; onViewInsights: () => void; onDraftMerlin: () => void; theme: string; toggleTheme: () => void;
  leftCollapsed: boolean;
}) {
  const { toast } = useStore();
  const [showStickyComposer, setShowStickyComposer] = React.useState(false);

  function handleHomeScroll(event: React.UIEvent<HTMLDivElement>) {
    setShowStickyComposer(event.currentTarget.scrollTop > 360);
  }

  return (
    <div className="relative flex-1 overflow-y-auto scrollbar-thin" onScroll={handleHomeScroll}>
      {/* ambient AI backdrop — covers the top region, dissolves into the canvas */}
      <AmbientBackground className="h-[900px]" />
      {/* mobile top bar */}
      <div className="relative flex items-center gap-2 px-4 py-3 md:hidden">
        <Logo /><Badge tone="merlin" className="ml-auto">NextGen AI</Badge>
        <button onClick={toggleTheme} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent">{theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}</button>
      </div>
      {/* hero */}
      <div className="relative">
        <div className="mx-auto max-w-3xl px-6 pb-2 pt-16 sm:pt-24">
          <div className="flex flex-col items-center text-center animate-in-up">
            <React.Suspense fallback={<div style={{ width: 190, height: 190 }} />}>
              <PlasmaSphere size={190} />
            </React.Suspense>
            <h1 className="-mt-3 text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] text-balance sm:text-[42px]">
              Good afternoon, Jitendra
              <br />
              What would you like to{" "}
              <span className="bg-gradient-to-r from-merlin to-[#ff86cf] bg-clip-text text-transparent">draft?</span>
            </h1>
          </div>

          {/* prompt card — the focal surface */}
          <div className="mx-auto mt-9 max-w-4xl">
            <div className="group rounded-[24px] border border-border/60 bg-card/70 p-3 shadow-[0_24px_70px_rgba(15,15,20,0.12)] backdrop-blur-2xl transition-shadow focus-within:border-merlin-border focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--merlin)_13%,transparent)] supports-[backdrop-filter]:bg-card/60">
              <div className="flex items-start gap-3 px-2 pt-2">
                <Sparkles className="mt-1 size-4 shrink-0 text-merlin" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                  rows={2}
                  placeholder="Ask Merlin to draft a contract, or describe the deal in plain language…"
                  className="max-h-40 min-h-[72px] flex-1 resize-none bg-transparent py-0.5 text-[17px] leading-relaxed outline-none placeholder:text-muted-foreground/70 scrollbar-thin"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                <button onClick={onNew} className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  <Upload className="size-3.5" /> Attach
                </button>
                <button onClick={onNew} className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  <LayoutTemplate className="size-3.5" /> Template <ChevronDown className="size-3.5 opacity-60" />
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <span className="hidden text-[13px] text-muted-foreground sm:inline">Merlin drafts &amp; de-risks</span>
                  <Button size="icon" onClick={onSubmit} disabled={!input.trim()} aria-label="Send" className="press size-11 rounded-2xl shadow-md shadow-primary/15"><Send className="size-4" /></Button>
                </div>
              </div>
            </div>
          </div>

          {/* example starters */}
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Get started with an example</div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Draft a Purchase Agreement", icon: FileText, run: onDraftMerlin },
                { label: "Import third-party paper", icon: Upload, run: onNew },
                { label: "Start from a template", icon: LayoutTemplate, run: onNew },
                { label: "Duplicate a recent contract", icon: Copy, run: onNew },
              ].map((ex) => {
                const Icon = ex.icon;
                return (
                  <button
                    key={ex.label}
                    onClick={ex.run}
                    className="group flex h-32 flex-col justify-between rounded-2xl border border-border/50 bg-muted/40 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-md"
                  >
                    <span className="text-[13.5px] font-medium leading-snug text-foreground/90">{ex.label}</span>
                    <span className="grid size-8 place-items-center rounded-lg bg-card text-muted-foreground shadow-xs transition-colors group-hover:text-merlin">
                      <Icon className="size-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden={!showStickyComposer}
        className={`fixed bottom-4 left-4 right-4 z-30 transition-all duration-500 ease-out sm:bottom-6 md:right-8 ${
          leftCollapsed ? "md:left-[calc(56px+2rem)]" : "md:left-[calc(292px+2rem)]"
        } ${showStickyComposer ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}
      >
        <div className="mx-auto max-w-4xl rounded-[24px] border border-border/80 bg-card/95 p-3 shadow-[0_24px_70px_rgba(15,15,20,0.18)] backdrop-blur-xl">
          <div className="flex items-start gap-3 px-2 pt-2">
            <Sparkles className="mt-1 size-4 shrink-0 text-merlin" />
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              rows={1}
              placeholder="Ask Merlin to draft a contract, or describe the deal in plain language..."
              className="max-h-24 min-h-[42px] flex-1 resize-none bg-transparent py-0.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70 scrollbar-thin"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
            <button onClick={onNew} className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Upload className="size-3.5" /> Attach
            </button>
            <button onClick={onNew} className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <LayoutTemplate className="size-3.5" /> Template <ChevronDown className="size-3.5 opacity-60" />
            </button>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-[13px] text-muted-foreground sm:inline">Merlin drafts &amp; de-risks</span>
              <Button size="icon" onClick={onSubmit} disabled={!input.trim()} aria-label="Send sticky Merlin prompt" className="press size-11 rounded-2xl shadow-md shadow-primary/15">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-14">
        <div className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[21px] font-semibold leading-none tracking-[-0.025em] text-foreground">Merlin insights</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-merlin-soft px-2 py-0.5 text-[11px] font-semibold text-merlin">
                  <span className="size-1.5 animate-pulse rounded-full bg-merlin" /> Live
                </span>
              </div>
              <p className="mt-1.5 text-[13px] text-muted-foreground">Priority signals from your active contract work.</p>
            </div>
            <button
              onClick={onViewInsights}
              className="hidden items-center gap-1 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              View more <ArrowRight className="size-3.5" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MERLIN_HOME_UPDATES.map((item) => {
              const toneColor =
                item.tone === "high"
                  ? "var(--risk-high)"
                  : item.tone === "merlin"
                  ? "var(--merlin)"
                  : item.tone === "success"
                  ? "var(--risk-low)"
                  : "var(--primary)";
              const pillClass =
                item.tone === "high"
                  ? "bg-risk-high-soft text-risk-high"
                  : item.tone === "merlin"
                  ? "bg-merlin-soft text-merlin"
                  : item.tone === "success"
                  ? "bg-risk-low-soft text-success"
                  : "bg-primary/10 text-primary";
              const ring = `conic-gradient(${toneColor} ${item.progress * 3.6}deg, color-mix(in oklch, var(--muted-foreground) 22%, transparent) 0deg)`;

              return (
                <button
                  key={item.id}
                  onClick={() => onOpen({ title: item.onSelectTitle, status: item.onSelectStatus })}
                  className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {/* header: folder + status pill */}
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground/70"><Folder className="size-[22px]" strokeWidth={1.75} /></span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${pillClass}`}>
                      <span className="size-1.5 rounded-full" style={{ background: toneColor }} />
                      {item.label}
                    </span>
                  </div>

                  {/* title + description */}
                  <div className="mt-3.5">
                    <div className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{item.title}</div>
                    <p className="mt-1.5 line-clamp-1 text-[13.5px] leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>

                  {/* context meta */}
                  <div className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <User className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">{item.context}</span>
                    <span className="opacity-50">·</span>
                    <span className="truncate">{item.subtitle}</span>
                  </div>

                  {/* date + priority */}
                  <div className="mt-2.5 flex items-center justify-between text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className="size-4 shrink-0 opacity-70" /> {item.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <BarChart3 className="size-4 opacity-80" /> {item.priority}
                    </span>
                  </div>

                  <div className="my-4 h-px bg-border/70" />

                  {/* footer: progress + tasks + merlin mark */}
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-[18px] shrink-0 rounded-full"
                        style={{
                          background: ring,
                          WebkitMask: "radial-gradient(farthest-side, transparent 55%, #000 57%)",
                          mask: "radial-gradient(farthest-side, transparent 55%, #000 57%)",
                        }}
                      />
                      <span className="text-[13.5px] font-semibold tabular-nums text-foreground">{item.progress}%</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
                      <ListChecks className="size-4 opacity-70" />
                      <span className="tabular-nums">{item.tasks.done}/{item.tasks.total}</span> checks
                    </span>
                    <span className="ml-auto"><MerlinMark size={26} /></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* contracts */}
        <div className="mt-14">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[21px] font-semibold leading-none tracking-[-0.025em] text-foreground">Your recent contracts</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {RECENT_CONTRACTS.length} active
                </span>
              </div>
              <p className="mt-1.5 text-[13px] text-muted-foreground">Continue drafts, approvals, reviews, and signed agreements.</p>
            </div>
            <button
              onClick={onNew}
              className="inline-flex w-fit items-center gap-1 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-[13px] font-medium text-primary transition-colors hover:bg-accent hover:text-primary"
            >
              <Plus className="size-3.5" /> New contract
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {RECENT_CONTRACTS.map((c) => (
              <button key={c.id} onClick={() => onOpen(c)} className="group rounded-2xl border border-border/60 bg-card p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-merlin-border/60 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><FileText className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-semibold leading-snug">{c.title}</div>
                  </div>
                  <Badge tone={c.status === "Signed" ? "low" : c.status === "Draft" ? "med" : "primary"}>{c.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------------- Merlin insights page ---------------- */
const STATUS_FILTERS: {
  value: ContractStatusFilter;
  label: string;
  helper: string;
  tone: "neutral" | "med" | "primary" | "low";
}[] = [
  { value: "All", label: "All", helper: "Portfolio view", tone: "neutral" },
  { value: "Draft", label: "Draft", helper: "Fix before routing", tone: "med" },
  { value: "In Review", label: "In Review", helper: "Legal is checking", tone: "primary" },
  { value: "In Approval", label: "In Approval", helper: "Approver action", tone: "primary" },
  { value: "Signed", label: "Signed", helper: "Closed contracts", tone: "low" },
];

function MerlinInsightsView({ onBack, onOpen }: {
  onBack: () => void;
  onOpen: (contract: Pick<RecentContract, "title" | "status">) => void;
}) {
  const [statusFilter, setStatusFilter] = React.useState<ContractStatusFilter>("All");
  const visibleContracts = statusFilter === "All"
    ? RECENT_CONTRACTS
    : RECENT_CONTRACTS.filter((contract) => contract.status === statusFilter);
  const selectedStatus = STATUS_FILTERS.find((status) => status.value === statusFilter) ?? STATUS_FILTERS[0];
  const priorityContracts = RECENT_CONTRACTS.filter((contract) => contract.status !== "Signed").slice(0, 4);

  function countStatus(status: ContractStatusFilter) {
    return status === "All"
      ? RECENT_CONTRACTS.length
      : RECENT_CONTRACTS.filter((contract) => contract.status === status).length;
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to workspace
        </button>

        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-xs lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[24px] font-semibold leading-none tracking-[-0.025em] text-foreground sm:text-[28px]">Merlin command centre</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-merlin-soft px-2 py-0.5 text-[11px] font-semibold text-merlin">
                  <span className="size-1.5 animate-pulse rounded-full bg-merlin" /> Live
                </span>
              </div>
              <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                Merlin groups every contract by where it's stuck, then suggests the next best action — fix draft risks, route review, chase approvals, or reuse signed agreements as clean references.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {MERLIN_HOME_UPDATES.map((item) => {
                  const toneColor =
                    item.tone === "high" ? "var(--risk-high)" : item.tone === "merlin" ? "var(--merlin)" : item.tone === "success" ? "var(--risk-low)" : "var(--primary)";
                  const ring = `conic-gradient(${toneColor} ${item.progress * 3.6}deg, color-mix(in oklch, var(--muted-foreground) 22%, transparent) 0deg)`;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onOpen({ title: item.onSelectTitle, status: item.onSelectStatus })}
                      className="group rounded-2xl border border-border/60 bg-muted/40 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-md"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-[18px] shrink-0 rounded-full"
                          style={{ background: ring, WebkitMask: "radial-gradient(farthest-side, transparent 55%, #000 57%)", mask: "radial-gradient(farthest-side, transparent 55%, #000 57%)" }}
                        />
                        <span className="text-[15px] font-semibold tabular-nums text-foreground">{item.progress}%</span>
                      </span>
                      <div className="mt-2.5 line-clamp-2 text-[14px] font-medium leading-snug text-foreground">{item.title}</div>
                      <div className="mt-1 text-[12px] text-muted-foreground">{item.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
              <div className="flex items-center gap-2">
                <WandSparkles className="size-4 text-merlin" />
                <div className="text-sm font-semibold">Recommended controls</div>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  "Apply policy-safe fixes to Draft contracts",
                  "Prepare review packets for Legal",
                  "Nudge pending approvers with context",
                  "Use signed agreements as fallback references",
                ].map((control) => (
                  <div key={control} className="flex items-start gap-2 rounded-xl bg-card px-3 py-2 text-[13px]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                    <span>{control}</span>
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full" onClick={() => onOpen({ title: "ABC Manufacturing — Purchase Agreement", status: "Draft" })}>
                Continue highest priority <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        <CommandWidgets />

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <SectionLabel>Status controls</SectionLabel>
            </div>
            <span className="text-[12px] text-muted-foreground">{visibleContracts.length} contracts shown</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {STATUS_FILTERS.map((status) => {
              const active = status.value === statusFilter;
              return (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    active
                      ? "border-merlin-border bg-merlin-soft text-foreground shadow-sm"
                      : "border-border/70 bg-card hover:border-merlin-border/70 hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{status.label}</span>
                    <Badge tone={status.tone}>{countStatus(status.value)}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{status.helper}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{selectedStatus.label} contracts</div>
                <div className="text-[12px] text-muted-foreground">Merlin keeps the right next action attached to each status.</div>
              </div>
              <Badge tone="merlin">{selectedStatus.helper}</Badge>
            </div>
            <div className="divide-y divide-border/70">
              {visibleContracts.map((contract) => {
                const isDraft = contract.status === "Draft";
                const isApproval = contract.status === "In Approval";
                const isSigned = contract.status === "Signed";
                return (
                  <button
                    key={contract.id}
                    onClick={() => onOpen(contract)}
                    className="grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/35 sm:grid-cols-[1fr_180px_150px] sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{contract.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                          <span className="font-mono">{contract.id}</span>
                          <span>·</span>
                          <span>{contract.value}</span>
                          <span>·</span>
                          <span>{contract.updated}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Health</span>
                        <span>{contract.health}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${isDraft ? "bg-warning" : isSigned ? "bg-success" : "bg-merlin"}`}
                          style={{ width: `${contract.health}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <Badge tone={isSigned ? "low" : isDraft ? "med" : "primary"}>{contract.status}</Badge>
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                        {isDraft ? "Fix draft" : isApproval ? "Check route" : isSigned ? "Use as reference" : "Open review"}
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-merlin" />
                <div className="text-sm font-semibold">Merlin says</div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                The fastest improvement is still the ABC draft. Fixing Net 90 and missing signer should unlock approval readiness today.
              </p>
              <button
                onClick={() => onOpen({ title: "ABC Manufacturing — Purchase Agreement", status: "Draft" })}
                className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
              >
                Open controlled panel <ArrowRight className="size-3.5" />
              </button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="text-sm font-semibold">Status playbook</div>
              <div className="mt-3 space-y-3">
                {priorityContracts.map((contract) => (
                  <div key={contract.id} className="rounded-xl bg-accent/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-[13px] font-medium">{contract.title}</div>
                      <Badge tone={contract.status === "Draft" ? "med" : "primary"}>{contract.status}</Badge>
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      {contract.status === "Draft"
                        ? "Resolve policy gaps before approval."
                        : contract.status === "In Approval"
                        ? "Nudge approvers with risk context."
                        : "Package clause diffs for legal."}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Start modal ---------------- */
const START_OPTS: { id: string; icon: LucideIcon; title: string; desc: string; merlin?: boolean; rec?: boolean }[] = [
  { id: "merlin", icon: Sparkles, title: "Generate with Merlin Intake", desc: "Answer a few questions. Merlin drafts the contract, fills metadata and picks clauses.", merlin: true, rec: true },
  { id: "template", icon: LayoutTemplate, title: "Start from a template", desc: "Assemble from a governed, clause-based template." },
  { id: "import", icon: Upload, title: "Import third-party paper", desc: "Upload the supplier's contract; Merlin marks it up and flags deviations." },
  { id: "blank", icon: FilePlus2, title: "Create from blank", desc: "Open an empty editor and build clause by clause with Merlin." },
  { id: "duplicate", icon: Copy, title: "Duplicate existing contract", desc: "Clone a similar prior agreement and update the parties." },
];

function StartModal({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-in-fade" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">New contract</div>
            <h2 className="mt-1 text-lg font-semibold">How would you like to start?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Every path lands in the same chat — Merlin guides you from here.</p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Close"><X className="size-4" /></button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {START_OPTS.map((o) => {
            const Icon = o.icon;
            return (
              <button key={o.id} onClick={() => onPick(o.id)} className={`group relative rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${o.merlin ? "border-merlin-border bg-merlin-soft/40 sm:col-span-2" : "border-border hover:border-primary/40"}`}>
                {o.rec && <Badge tone="merlin" className="absolute right-3 top-3"><Check className="size-3" /> Recommended</Badge>}
                <div className="flex items-start gap-3">
                  {o.merlin ? <MerlinMark size={36} /> : <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></span>}
                  <div>
                    <div className="text-[15px] font-semibold">{o.title}</div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{o.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
