import * as React from "react";
import { Button, Badge, Avatar, Tooltip } from "@/components/ui/primitives";
import { Logo, MerlinMark } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./workspace/LeftRail";
import { MerlinChat } from "./workspace/MerlinChat";
import { ArtifactPanel } from "./workspace/ArtifactPanel";
import { ApprovalModal } from "./workspace/ApprovalModal";
import { RECENT_CONTRACTS } from "@/lib/data";
import {
  Plus, Search, Send, Sparkles, PanelRightClose, PanelRightOpen, Moon, Sun,
  FileText, ArrowLeft, X, LayoutTemplate, Upload, FilePlus2, Copy, Check, ArrowRight, LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type View = "home" | "chat";

export function NextGenWorkspace() {
  const store = useStore();
  const { theme, toggleTheme, setAppMode, startMerlinIntake, startDraft, startBlank } = store;
  const health = useHealth();

  const [view, setView] = React.useState<View>("home");
  const [sessionKey, setSessionKey] = React.useState(0);
  const [title, setTitle] = React.useState("New contract");
  const [showStart, setShowStart] = React.useState(false);
  const [artifactOpen, setArtifactOpen] = React.useState(true);
  const [showApproval, setShowApproval] = React.useState(false);
  const [homeInput, setHomeInput] = React.useState("");

  function beginSession(name: string) {
    setTitle(name);
    setSessionKey((k) => k + 1);
    setView("chat");
    setArtifactOpen(true);
  }
  function startWith(method: string) {
    setShowStart(false);
    if (method === "merlin") { startMerlinIntake(); beginSession("New contract · Merlin"); }
    else if (method === "blank") { startBlank(); beginSession("Untitled agreement"); }
    else if (method === "duplicate") { startDraft({ duplicatedFrom: "Nimbus Steel — Purchase Agreement" }); beginSession("Copy · Purchase Agreement"); }
    else { startDraft(); beginSession(method === "template" ? "New · from template" : "Imported paper"); }
  }
  function openContract(name: string) { startDraft(); beginSession(name); }
  function homeSubmit() {
    if (!homeInput.trim()) return;
    startMerlinIntake();
    beginSession("New contract · Merlin");
    setHomeInput("");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2 px-3 py-3">
          <button onClick={() => setView("home")} aria-label="Home"><Logo /></button>
          <Badge tone="merlin" className="ml-auto">NextGen AI</Badge>
        </div>
        <div className="px-3">
          <Button className="w-full justify-start" onClick={() => setShowStart(true)}>
            <Plus className="size-4" /> New contract
          </Button>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search chats…" className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </div>
        <div className="mt-3 flex-1 overflow-y-auto px-2 scrollbar-thin">
          <button onClick={() => setView("home")} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${view === "home" ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50"}`}>
            <LayoutGrid className="size-4" /> Home
          </button>
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent chats</div>
          {RECENT_CONTRACTS.map((c) => (
            <button key={c.id} onClick={() => openContract(c.title.split(" — ")[0])} className="mb-0.5 flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/50">
              <span className="line-clamp-1 text-sm">{c.title}</span>
              <span className="line-clamp-1 text-[11px] text-muted-foreground">{c.status} · {c.updated}</span>
            </button>
          ))}
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
      </aside>

      {/* ===== CENTER ===== */}
      <main className="flex min-w-0 flex-1 flex-col">
        {view === "chat" && (
          <div className="flex h-13 items-center gap-2 border-b border-border px-4 py-2.5">
            <button onClick={() => setView("home")} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Back to home"><ArrowLeft className="size-4" /></button>
            <MerlinMark size={26} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{title}</div>
              <div className="truncate text-[11px] text-muted-foreground leading-tight">Health {health.score}/100</div>
            </div>
            <div className="ml-auto">
              <Tooltip content={artifactOpen ? "Hide artifact" : "Show artifact"} side="left">
                <button onClick={() => setArtifactOpen((o) => !o)} className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent" aria-label="Toggle artifact">
                  {artifactOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {view === "home" ? (
          <HomeView input={homeInput} setInput={setHomeInput} onSubmit={homeSubmit} onNew={() => setShowStart(true)} onOpen={openContract} onDraftMerlin={() => startWith("merlin")} theme={theme} toggleTheme={toggleTheme} />
        ) : (
          <MerlinChat sessionKey={sessionKey} onOpenApproval={() => setShowApproval(true)} />
        )}
      </main>

      {/* ===== RIGHT ARTIFACT ===== */}
      {view === "chat" && artifactOpen && (
        <ArtifactPanel onClose={() => setArtifactOpen(false)} onAskAbout={() => { /* handled inside chat */ }} onSubmit={() => setShowApproval(true)} />
      )}

      {showStart && <StartModal onClose={() => setShowStart(false)} onPick={startWith} />}
      {showApproval && <ApprovalModal onClose={() => setShowApproval(false)} />}
    </div>
  );
}

/* ---------------- Home ---------------- */
function HomeView({ input, setInput, onSubmit, onNew, onOpen, onDraftMerlin, theme, toggleTheme }: {
  input: string; setInput: (v: string) => void; onSubmit: () => void; onNew: () => void;
  onOpen: (name: string) => void; onDraftMerlin: () => void; theme: string; toggleTheme: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {/* mobile top bar */}
      <div className="flex items-center gap-2 px-4 py-3 md:hidden">
        <Logo /><Badge tone="merlin" className="ml-auto">NextGen AI</Badge>
        <button onClick={toggleTheme} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent">{theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}</button>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <MerlinMark size={48} />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Good afternoon, Jitendra</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">What contract can I help you with today? Describe it in plain language and I'll draft it.</p>
        </div>

        {/* prompt box */}
        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
              rows={1}
              placeholder="e.g. Draft a purchase agreement with ABC Manufacturing for ₹2 Cr…"
              className="max-h-32 min-h-[26px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-muted-foreground scrollbar-thin"
            />
            <Button size="icon" onClick={onSubmit} disabled={!input.trim()} aria-label="Send"><Send className="size-4" /></Button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {["Draft a Purchase Agreement", "Import third-party paper", "Start from a template"].map((s) => (
              <button key={s} onClick={s.includes("Draft") ? onDraftMerlin : onNew} className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-merlin-border hover:text-foreground">{s}</button>
            ))}
          </div>
        </div>

        {/* created contracts */}
        <div className="mt-12">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your contracts</span>
            <button onClick={onNew} className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"><Plus className="size-3.5" /> New contract</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {RECENT_CONTRACTS.map((c) => (
              <button key={c.id} onClick={() => onOpen(c.title.split(" — ")[0])} className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-merlin-border hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent text-primary"><FileText className="size-4" /></span>
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
                  {o.merlin ? <MerlinMark size={36} /> : <span className="grid size-9 place-items-center rounded-lg bg-accent text-primary"><Icon className="size-4" /></span>}
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
