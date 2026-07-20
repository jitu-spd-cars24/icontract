import * as React from "react";
import { Button, Badge, Avatar, Tooltip } from "@/components/ui/primitives";
import { Logo, MerlinMark, MerlinOrb, SectionLabel, RISK_META } from "@/components/shared";
import { AmbientBackground } from "@/components/AmbientBackground";
import { useStore } from "@/store";
import { useHealth } from "./workspace/LeftRail";
import { MerlinChat } from "./workspace/MerlinChat";
import { ArtifactPanel } from "./workspace/ArtifactPanel";
import { ApprovalModal } from "./workspace/ApprovalModal";
import { ContractPreview } from "./workspace/ContractPreview";
import { ClauseDetail } from "./workspace/ClauseDetail";
import { RECENT_CONTRACTS, PENDING_APPROVALS, RECENT_SUPPLIERS } from "@/lib/data";
import type { RiskLevel } from "@/lib/types";
import {
  Plus, Search, Send, Sparkles, PanelRightClose, PanelRightOpen, Moon, Sun,
  FileText, ArrowLeft, X, LayoutTemplate, Upload, FilePlus2, Copy, Check, ArrowRight,
  CheckSquare, Building2, TrendingUp, Eye, PanelLeftClose, PanelLeftOpen, ShieldAlert,
  WandSparkles, SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type View = "home" | "chat" | "insights";
type RecentContract = (typeof RECENT_CONTRACTS)[number];
type SessionStatus = "Draft" | "In Review" | "In Approval" | "Signed";
type ContractStatusFilter = "All" | SessionStatus;

function compactContractLabel(title: string) {
  const parts = title.split("—")[0].trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join("").toUpperCase();
}

const MERLIN_HOME_UPDATES = [
  {
    id: "priority",
    label: "Suggested next move",
    title: "ABC Manufacturing can be approval-ready today",
    detail: "Resolve the Net 90 payment term and Merlin expects the draft health to move from 72 to 84.",
    metric: "72 -> 84",
    metricLabel: "health lift",
    tone: "high" as const,
    icon: ShieldAlert,
    cta: "Open draft",
    onSelectStatus: "Draft" as const,
    onSelectTitle: "ABC Manufacturing — Purchase Agreement",
  },
  {
    id: "approval",
    label: "Approval update",
    title: "Cloudspring is waiting on finance sign-off",
    detail: "One approver decision will move the MSA into the final signature route.",
    metric: "1",
    metricLabel: "decision left",
    tone: "primary" as const,
    icon: CheckSquare,
    cta: "Review route",
    onSelectStatus: "In Approval" as const,
    onSelectTitle: "Cloudspring Technologies — MSA",
  },
  {
    id: "pattern",
    label: "Merlin insight",
    title: "Payment terms are the main portfolio pattern this week",
    detail: "3 recent drafts pushed beyond the Net 45 standard. Merlin recommends starting with the fallback clause set.",
    metric: "3",
    metricLabel: "drafts flagged",
    tone: "merlin" as const,
    icon: Sparkles,
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
  function openContract(contract: Pick<RecentContract, "title" | "status">) {
    startDraft();
    const nextStatus = (contract.status as SessionStatus) ?? "Draft";
    setSessionStatus(nextStatus);
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
      <aside className={`hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex ${leftCollapsed ? "w-[84px]" : "w-64"}`}>
        {leftCollapsed ? (
          <>
            <div className="flex flex-col items-center gap-3 px-3 py-4">
              <button onClick={() => setView("home")} aria-label="Home"><Logo collapsed /></button>
              <div className="flex justify-center">
                <Tooltip content="Expand panel" side="right">
                  <button
                    onClick={() => setLeftCollapsed(false)}
                    className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label="Expand sidebar"
                  >
                    <PanelLeftOpen className="size-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="border-t border-border/70 px-3 pt-4">
              <div className="flex justify-center">
                <Tooltip content="New contract" side="right">
                  <button
                    onClick={() => setShowStart(true)}
                    className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs transition-transform hover:scale-[1.02]"
                    aria-label="New contract"
                  >
                    <Plus className="size-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto px-3 scrollbar-thin">
              <div className="mb-3 h-px bg-border/70" />
              <div className="space-y-3">
                {RECENT_CONTRACTS.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex justify-center">
                    <Tooltip content={c.title} side="right">
                      <button
                        onClick={() => openContract(c)}
                        className="relative grid size-12 place-items-center rounded-2xl border border-border/70 bg-background text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent/50 hover:text-foreground"
                        aria-label={c.title}
                      >
                        <span>{compactContractLabel(c.title)}</span>
                        <span
                          className={`absolute right-1.5 top-1.5 size-1.5 rounded-full ${
                            c.status === "Signed"
                              ? "bg-success"
                              : c.status === "Draft"
                              ? "bg-warning"
                              : "bg-primary"
                          }`}
                        />
                      </button>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border/70 px-3 py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center">
                  <Tooltip content="Switch experience" side="right">
                    <button
                      onClick={() => setAppMode("chooser")}
                      className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-accent/50"
                      aria-label="Switch experience"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                  </Tooltip>
                </div>
                <div className="flex justify-center">
                  <Tooltip content={theme === "light" ? "Dark mode" : "Light mode"} side="right">
                    <button
                      onClick={toggleTheme}
                      className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-accent/50"
                      aria-label="Toggle theme"
                    >
                      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                    </button>
                  </Tooltip>
                </div>
                <div className="flex justify-center pt-2">
                  <Avatar name="Jitendra Kumar" className="size-10" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-3">
              <button onClick={() => setView("home")} aria-label="Home"><Logo /></button>
              <Tooltip content="Collapse panel" side="right">
                <button
                  onClick={() => setLeftCollapsed(true)}
                  className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </Tooltip>
            </div>
            <div className="px-3">
              <Button className="w-full justify-start" onClick={() => setShowStart(true)}>
                <Plus className="size-4" /> New contract
              </Button>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input placeholder="Search contracts…" className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto px-2 scrollbar-thin">
              <div className="mb-1 flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent contracts</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{RECENT_CONTRACTS.length}</span>
              </div>
              <div className="space-y-1">
                {RECENT_CONTRACTS.map((c) => {
                  const statusClass =
                    c.status === "Signed"
                      ? "bg-success"
                      : c.status === "Draft"
                      ? "bg-warning"
                      : c.status === "In Approval"
                      ? "bg-primary"
                      : "bg-merlin";

                  return (
                    <button
                      key={c.id}
                      onClick={() => openContract(c)}
                      className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-border/70 hover:bg-accent/45"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-card">
                        <FileText className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium leading-tight text-foreground">
                          {c.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] leading-none text-muted-foreground">
                          <span className={`size-1.5 rounded-full ${statusClass}`} />
                          <span>{c.status}</span>
                          <span className="text-muted-foreground/60">·</span>
                          <span>{c.updated}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border p-2">
              <button onClick={() => setAppMode("chooser")} className="mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-accent/50">
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
      <main className="flex min-w-0 flex-1 flex-col">
        {view === "chat" && (
          <div className="glass sticky top-0 z-10 flex h-13 items-center gap-2 border-b border-border/60 px-4 py-2.5">
            <button onClick={() => setView("home")} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Back to home"><ArrowLeft className="size-4" /></button>
            <MerlinMark size={26} />
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
            <div className="ml-auto flex items-center gap-1.5">
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
          <HomeView input={homeInput} setInput={setHomeInput} onSubmit={homeSubmit} onNew={() => setShowStart(true)} onOpen={openContract} onViewInsights={() => setView("insights")} onDraftMerlin={() => startWith("merlin")} theme={theme} toggleTheme={toggleTheme} />
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
function HomeView({ input, setInput, onSubmit, onNew, onOpen, onViewInsights, onDraftMerlin, theme, toggleTheme }: {
  input: string; setInput: (v: string) => void; onSubmit: () => void; onNew: () => void;
  onOpen: (contract: Pick<RecentContract, "title" | "status">) => void; onViewInsights: () => void; onDraftMerlin: () => void; theme: string; toggleTheme: () => void;
}) {
  const { toast } = useStore();
  return (
    <div className="relative flex-1 overflow-y-auto scrollbar-thin">
      {/* ambient AI backdrop — covers the top region, dissolves into the canvas */}
      <AmbientBackground className="h-[900px]" />
      {/* mobile top bar */}
      <div className="relative flex items-center gap-2 px-4 py-3 md:hidden">
        <Logo /><Badge tone="merlin" className="ml-auto">NextGen AI</Badge>
        <button onClick={toggleTheme} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent">{theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}</button>
      </div>
      {/* hero */}
      <div className="relative">
        <div className="mx-auto max-w-2xl px-6 pb-2 pt-16 sm:pt-24">
          <div className="flex flex-col items-center text-center animate-in-up">
            <MerlinOrb size={60} />
            <h1 className="mt-7 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[38px]">Good afternoon, Jitendra</h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">What would you like to work on? Describe a contract in plain language and Merlin will draft, check and de-risk it with you.</p>
          </div>

          {/* prompt box — the focal surface */}
          <div className="mt-8">
            <div className="group flex items-end gap-2 rounded-2xl border border-border/70 bg-card p-2.5 shadow-lg transition-shadow focus-within:border-merlin-border focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--merlin)_14%,transparent)]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                rows={1}
                placeholder="e.g. Draft a purchase agreement with ABC Manufacturing for ₹2 Cr…"
                className="max-h-40 min-h-[30px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70 scrollbar-thin"
              />
              <Button size="icon" onClick={onSubmit} disabled={!input.trim()} aria-label="Send" className="press rounded-xl"><Send className="size-4" /></Button>
            </div>
            <div className="mt-3.5 flex flex-wrap justify-center gap-2">
              {["Draft a Purchase Agreement", "Import third-party paper", "Start from a template"].map((s) => (
                <button key={s} onClick={s.includes("Draft") ? onDraftMerlin : onNew} className="press rounded-full border border-border/70 bg-card/70 px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-xs transition-all hover:-translate-y-px hover:text-foreground hover:shadow-sm">{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-14">
        <div className="mt-12">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <MerlinMark size={24} />
              <div>
                <SectionLabel>Merlin insights</SectionLabel>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Priority signals from your active contract work.</p>
              </div>
            </div>
            <button
              onClick={onViewInsights}
              className="hidden items-center gap-1 rounded-full border border-merlin-border bg-merlin-soft px-3 py-1.5 text-[12px] font-semibold text-merlin transition-colors hover:bg-accent hover:text-primary sm:inline-flex"
            >
              View more <ArrowRight className="size-3.5" />
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {MERLIN_HOME_UPDATES.map((item, index) => {
              const Icon = item.icon;
              // colour only where it means something: risk = red; otherwise neutral
              const toneClass =
                item.tone === "high"
                  ? "bg-risk-high-soft text-risk-high"
                  : "bg-muted text-muted-foreground";

              return (
                <button
                  key={item.id}
                  onClick={() => onOpen({ title: item.onSelectTitle, status: item.onSelectStatus })}
                  className="group relative flex min-h-[168px] flex-col rounded-2xl border border-border/60 bg-card p-5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneClass}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</span>
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{item.metric}</span>
                    <span className="pb-1 text-[12px] font-medium text-muted-foreground">{item.metricLabel}</span>
                  </div>

                  <div className="mt-3 flex-1">
                    <div className="text-[15px] font-semibold leading-snug">{item.title}</div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                    {item.cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* contracts */}
        <div className="mt-14">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Your contracts</SectionLabel>
            <button onClick={onNew} className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"><Plus className="size-3.5" /> New contract</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {RECENT_CONTRACTS.map((c) => (
              <button key={c.id} onClick={() => onOpen(c)} className="group rounded-2xl border border-border/60 bg-card p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-merlin-border/60 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><FileText className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-medium">{c.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono">{c.id}</span><span>·</span><span>{c.value}</span>
                    </div>
                  </div>
                  <Badge tone={c.status === "Signed" ? "low" : c.status === "Draft" ? "med" : "primary"}>{c.status}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Health {c.health}%</span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Open chat <ArrowRight className="size-3.5" /></span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* supporting sections */}
        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          {/* waiting on you */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CheckSquare className="size-4 text-muted-foreground" />
              <SectionLabel>Waiting on you</SectionLabel>
              <Badge tone="high" className="ml-auto">{PENDING_APPROVALS.length}</Badge>
            </div>
            <div className="divide-y divide-border/70 rounded-2xl border border-border/60 bg-card shadow-xs">
              {PENDING_APPROVALS.map((a) => (
                <div key={a.id} className="p-3">
                  <div className="text-sm font-medium leading-snug">{a.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{a.stage}</span><span>{a.from} · {a.waiting}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="success" className="h-7" onClick={() => toast({ title: "Approved", detail: a.title, tone: "success" })}>Approve</Button>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => onOpen({ title: a.title, status: "In Approval" })}>Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* recent suppliers */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <SectionLabel>Recent suppliers</SectionLabel>
            </div>
            <div className="divide-y divide-border/70 rounded-2xl border border-border/60 bg-card shadow-xs">
              {RECENT_SUPPLIERS.map((s) => (
                <div key={s.name} className="flex items-center gap-3 p-3">
                  <div className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{s.name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.contracts} contracts · {s.region}</div>
                  </div>
                  <Badge tone={RISK_META[s.risk as RiskLevel].tone}>{s.risk}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* cycle time */}
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4" />
              <span className="text-xs font-medium">Cycle time this quarter</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">6.2</span>
              <span className="text-sm text-muted-foreground">days avg</span>
              <Badge tone="low" className="ml-auto">↓ 38% with Merlin</Badge>
            </div>
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

        <section className="overflow-hidden rounded-3xl border border-merlin-border bg-gradient-to-br from-merlin-soft/70 via-card to-card">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-7">
            <div>
              <div className="flex items-center gap-3">
                <MerlinMark size={42} />
                <div>
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-merlin">Merlin command centre</div>
                  <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">AI controls by contract status</h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Merlin groups every contract by where it is stuck, then suggests the next best action: fix draft risks, route review, chase approvals, or reuse signed agreements as clean references.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {MERLIN_HOME_UPDATES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onOpen({ title: item.onSelectTitle, status: item.onSelectStatus })}
                    className="rounded-2xl border border-border/70 bg-background/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-merlin-border hover:bg-card"
                  >
                    <div className="text-xl font-semibold tabular-nums">{item.metric}</div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.metricLabel}</div>
                    <div className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug">{item.title}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
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
                  <div key={control} className="flex items-start gap-2 rounded-xl bg-accent/50 px-3 py-2 text-[13px]">
                    <Check className="mt-0.5 size-3.5 text-success" />
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
