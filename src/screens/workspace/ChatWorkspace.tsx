import * as React from "react";
import { Button, Badge, Avatar, Tooltip, Progress } from "@/components/ui/primitives";
import { Logo, MerlinMark, RiskDot, ClauseStatusBadge } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./LeftRail";
import { ApprovalModal } from "./ApprovalModal";
import { CONTRACT, RECENT_CONTRACTS } from "@/lib/data";
import {
  Plus,
  Send,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  Moon,
  Sun,
  Check,
  FileText,
  ShieldCheck,
  Search,
  Home,
} from "lucide-react";

interface Card {
  kind: "risk" | "missing";
  refId: string; // insight id or missing id
  title: string;
  detail: string;
  basis: string;
  confidence?: number;
  done?: boolean;
}
interface Msg {
  id: string;
  role: "merlin" | "user";
  text?: string;
  cards?: Card[];
}

let seq = 0;
const uid = () => `m${++seq}`;

export function ChatWorkspace() {
  const store = useStore();
  const {
    go,
    theme,
    toggleTheme,
    isBlank,
    clauses,
    insights,
    resolveInsight,
    insertMissingClause,
  } = store;
  const health = useHealth();

  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [artifactOpen, setArtifactOpen] = React.useState(true);
  const [showApproval, setShowApproval] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Proactive opening — Merlin greets and reports findings
  React.useEffect(() => {
    const openRisks = insights.filter((i) => !i.resolved && i.type === "risk");
    const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");
    const intro: Msg[] = [
      {
        id: uid(),
        role: "merlin",
        text: isBlank
          ? "Hi Jitendra — blank canvas. Tell me what you're drafting and I'll scaffold it, or ask me anything. The contract shows up as an artifact on the right as we go."
          : `Hi Jitendra — I've read the ${CONTRACT.type} for ${CONTRACT.supplier}. The full contract is the artifact on the right. Here's what I'd look at first.`,
      },
    ];
    if (!isBlank && (openRisks.length || openMissing.length)) {
      intro.push({
        id: uid(),
        role: "merlin",
        text: `I found ${openRisks.length} risk${openRisks.length !== 1 ? "s" : ""} and ${openMissing.length} missing clause${openMissing.length !== 1 ? "s" : ""}. You can act on any of these right here — I'll update the artifact.`,
        cards: [
          ...openRisks.map((i) => ({
            kind: "risk" as const,
            refId: i.id,
            title: i.title,
            detail: i.detail,
            basis: i.basis,
            confidence: i.confidence,
          })),
          ...openMissing.map((i) => ({
            kind: "missing" as const,
            refId: i.id === "i4" ? "m1" : "m2",
            title: i.title.replace("Missing clause — ", ""),
            detail: i.detail,
            basis: i.basis,
            confidence: i.confidence,
          })),
        ],
      });
    }
    setMessages(intro);
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function push(m: Msg) {
    setMessages((prev) => [...prev, m]);
  }
  function merlinReply(text: string, cards?: Card[]) {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      push({ id: uid(), role: "merlin", text, cards });
    }, 620);
  }

  function handleCard(card: Card) {
    if (card.kind === "risk") {
      resolveInsight(card.refId, "accept");
      merlinReply(
        `Done — I applied the policy-standard fix to “${card.title}” and logged it in version history. That clears one risk; your health score is climbing.`
      );
    } else {
      insertMissingClause(card.refId);
      merlinReply(
        `Added “${card.title}” — drafted from the standard and flagged for your review in the artifact. Nothing is final until you approve it.`
      );
    }
    // mark card done
    setMessages((prev) =>
      prev.map((m) =>
        m.cards
          ? { ...m, cards: m.cards.map((c) => (c.refId === card.refId ? { ...c, done: true } : c)) }
          : m
      )
    );
  }

  function process(text: string) {
    const t = text.toLowerCase();
    const openRisks = insights.filter((i) => !i.resolved && i.type === "risk");
    const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");

    if (/(fix|resolve).*(all|everything)|clean.*up/.test(t)) {
      openRisks.forEach((i) => resolveInsight(i.id, "accept"));
      insertMissingClause("m1");
      insertMissingClause("m2");
      return merlinReply(
        "On it — I applied the standard fix to every open risk and inserted the two missing clauses (DPA + Insurance) as drafts for review. The contract is now materially cleaner; check the artifact and the health score."
      );
    }
    if (/payment|net\s?\d|dso/.test(t)) {
      const p = openRisks.find((i) => i.clauseId === "c4");
      if (p) { resolveInsight(p.id, "accept"); return merlinReply("Switched Payment Terms from Net 90 to the policy-standard Net 45. That was your biggest cash-flow exposure — resolved and tracked."); }
      return merlinReply("Payment Terms are already on the policy standard (Net 45). Nothing outstanding there.");
    }
    if (/indemn/.test(t)) {
      const p = openRisks.find((i) => i.clauseId === "c7");
      if (p) { resolveInsight(p.id, "accept"); return merlinReply("Aligned the indemnity to the company standard — uncapped for IP and personal-injury claims. Legal will be happy."); }
      return merlinReply("Indemnity already matches the standard.");
    }
    if (/terminat/.test(t)) {
      const p = openRisks.find((i) => i.clauseId === "c9");
      if (p) { resolveInsight(p.id, "accept"); return merlinReply("Reset Termination to 60-day notice with a 30-day cure period, per the playbook."); }
      return merlinReply("Termination already follows the standard.");
    }
    if (/dpa|data|privacy/.test(t)) { if (openMissing.some((i)=>i.id==="i4")) { insertMissingClause("m1"); return merlinReply("Added a Data Protection (DPA) clause drafted to the India DPDP Act 2023 — flagged for review."); } return merlinReply("A DPA clause is already in place."); }
    if (/insurance|coverage/.test(t)) { if (openMissing.some((i)=>i.id==="i5")) { insertMissingClause("m2"); return merlinReply("Added an Insurance & Coverage clause with the template's minimum limits — flagged for review."); } return merlinReply("Insurance coverage is already covered."); }
    if (/missing/.test(t)) { insertMissingClause("m1"); insertMissingClause("m2"); return merlinReply("Inserted both missing clauses — Data Protection (DPA) and Insurance & Coverage — as drafts for your review."); }
    if (/risk|summar|overview|status|what.*wrong/.test(t)) {
      return merlinReply(
        openRisks.length || openMissing.length
          ? `Right now: ${openRisks.length} open risk${openRisks.length !== 1 ? "s" : ""}${openRisks.length ? " — " + openRisks.map((i) => i.title.toLowerCase()).join("; ") : ""}. ${openMissing.length} missing clause${openMissing.length !== 1 ? "s" : ""}. Health is ${health.score}/100. Say “fix everything” and I'll handle the routine ones.`
          : `Clean bill — no open risks or missing clauses. Health ${health.score}/100. You're approval-ready.`
      );
    }
    if (/approve|submit|sign|route|ready/.test(t)) {
      setShowApproval(true);
      return merlinReply(`Opening approval readiness. You're at ${health.score}/100 — I'll walk you through the checklist and routing.`);
    }
    if (/supplier|abc|history/.test(t)) return merlinReply(`${CONTRACT.supplier} is an existing supplier (SUP-004471) with 2 prior contracts. Risk rating moved Low → Medium last quarter. On both prior deals they accepted Net 45 — which is why the requested Net 90 stood out.`);
    if (/template|metadata|value|term|date/.test(t)) return merlinReply(`This was generated from the “Supplier Agreement — India (FY26)” template. Key metadata: ${CONTRACT.value}, ${CONTRACT.region}, effective ${CONTRACT.effectiveDate} for ${CONTRACT.term}. You can edit any field in the artifact's Metadata tab.`);
    if (/hi|hello|hey|thanks|thank/.test(t)) return merlinReply("Anytime. I'm watching the whole contract — ask me to fix a clause, explain a risk, add something, or check if you're ready to submit.");
    return merlinReply(`I can act on this contract directly. Try: “fix the payment terms”, “add the missing clauses”, “summarise the risks”, or “am I ready to submit?” — and I'll update the artifact on the right.`);
  }

  function send(text: string) {
    const v = text.trim();
    if (!v) return;
    push({ id: uid(), role: "user", text: v });
    setDraft("");
    process(v);
  }

  const suggestions = isBlank
    ? ["Scaffold a Purchase Agreement", "Add a payment terms clause", "What should I include?"]
    : ["Fix the payment terms", "Add the missing clauses", "Summarise the risks", "Am I ready to submit?"];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1">
        {/* ============ LEFT — conversations ============ */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="flex items-center gap-2 px-3 py-3">
            <button onClick={() => go("dashboard")} aria-label="Dashboard"><Logo /></button>
          </div>
          <div className="px-3">
            <Button className="w-full justify-start" onClick={() => go("starting-point")}>
              <Plus className="size-4" /> New contract
            </Button>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search chats…"
                className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="mt-3 flex-1 overflow-y-auto px-2 scrollbar-thin">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent
            </div>
            {[{ id: CONTRACT.id, title: "ABC Manufacturing — Purchase Agreement", last: "3 risks flagged · just now", active: true },
              ...RECENT_CONTRACTS.filter((c) => c.id !== CONTRACT.id).map((c) => ({ id: c.id, title: c.title, last: `${c.status} · ${c.updated}`, active: false }))]
              .map((c) => (
                <button
                  key={c.id}
                  className={`mb-0.5 flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    c.active ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <span className="line-clamp-1 text-sm font-medium">{c.title}</span>
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">{c.last}</span>
                </button>
              ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Avatar name="Jitendra Kumar" className="size-8" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">Jitendra Kumar</div>
              <div className="truncate text-[11px] text-muted-foreground">Procurement Manager</div>
            </div>
            <Tooltip content="Toggle theme">
              <button onClick={toggleTheme} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Toggle theme">
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>
            </Tooltip>
          </div>
        </aside>

        {/* ============ CENTER — chat ============ */}
        <main className="flex min-w-0 flex-1 flex-col bg-background">
          {/* slim header */}
          <div className="flex h-13 items-center gap-2 border-b border-border px-4 py-2.5">
            <button onClick={() => go("dashboard")} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden" aria-label="Home"><Home className="size-4" /></button>
            <MerlinMark size={26} />
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">Merlin</div>
              <div className="truncate text-[11px] text-muted-foreground leading-tight">
                {isBlank ? "New contract" : `ABC Manufacturing · Health ${health.score}/100`}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setShowApproval(true)}>
                <ShieldCheck className="size-3.5" /> Submit
              </Button>
              <Tooltip content={artifactOpen ? "Hide artifact" : "Show artifact"}>
                <button onClick={() => setArtifactOpen((o) => !o)} className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent" aria-label="Toggle artifact">
                  {artifactOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-2xl px-4 py-6">
              {messages.map((m) =>
                m.role === "merlin" ? (
                  <div key={m.id} className="mb-6 flex gap-3 animate-in-up">
                    <MerlinMark size={28} active={false} />
                    <div className="min-w-0 flex-1">
                      {m.text && <div className="text-[15px] leading-relaxed text-foreground">{m.text}</div>}
                      {m.cards && (
                        <div className="mt-3 space-y-2">
                          {m.cards.map((c) => (
                            <div key={c.refId} className="rounded-xl border border-border bg-card p-3">
                              <div className="flex items-center gap-2">
                                <RiskDot risk={c.kind === "risk" ? "high" : "medium"} />
                                <span className="text-sm font-medium">{c.title}</span>
                                {c.confidence && (
                                  <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{c.confidence}%</span>
                                )}
                              </div>
                              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.detail}</p>
                              <div className="mt-1 text-[11px] text-muted-foreground">Basis: {c.basis}</div>
                              <div className="mt-2.5">
                                {c.done ? (
                                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-success">
                                    <Check className="size-3.5" /> {c.kind === "risk" ? "Fixed" : "Added"}
                                  </span>
                                ) : (
                                  <Button size="sm" variant="merlin" className="h-7" onClick={() => handleCard(c)}>
                                    <Sparkles className="size-3" /> {c.kind === "risk" ? "Apply fix" : "Draft & add"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="mb-6 flex justify-end animate-in-up">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground">
                      {m.text}
                    </div>
                  </div>
                )
              )}
              {typing && (
                <div className="mb-6 flex gap-3">
                  <MerlinMark size={28} active={false} />
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* composer */}
          <div className="border-t border-border bg-background">
            <div className="mx-auto max-w-2xl px-4 py-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-merlin-border hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); }
                  }}
                  rows={1}
                  placeholder="Ask Merlin to draft, fix, explain, or check readiness…"
                  className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground scrollbar-thin"
                />
                <Button size="icon" onClick={() => send(draft)} disabled={!draft.trim()} aria-label="Send">
                  <Send className="size-4" />
                </Button>
              </div>
              <div className="mt-1.5 text-center text-[11px] text-muted-foreground">
                Merlin acts on your contract — it never changes legal terms without your confirmation.
              </div>
            </div>
          </div>
        </main>

        {/* ============ RIGHT — artifact ============ */}
        {artifactOpen && (
          <ArtifactPanel
            onClose={() => setArtifactOpen(false)}
            onAskAbout={(label) => send(`Explain ${label}`)}
            onSubmit={() => setShowApproval(true)}
          />
        )}
      </div>

      {showApproval && <ApprovalModal onClose={() => setShowApproval(false)} />}
    </div>
  );
}

/* ---------------- Artifact panel ---------------- */
function ArtifactPanel({
  onClose,
  onAskAbout,
  onSubmit,
}: {
  onClose: () => void;
  onAskAbout: (label: string) => void;
  onSubmit: () => void;
}) {
  const { clauses, metadata, isBlank } = useStore();
  const health = useHealth();
  const [tab, setTab] = React.useState<"document" | "metadata">("document");

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
            {isBlank ? "Draft" : `${CONTRACT.id} · Draft`}
          </div>
        </div>
        <Tooltip content="Hide artifact" side="left">
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Hide artifact">
            <PanelRightClose className="size-4" />
          </button>
        </Tooltip>
      </div>

      {/* health */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Health score</span>
          <Badge tone={health.ready ? "low" : "med"}>{health.ready ? "Ready" : "In progress"}</Badge>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{health.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <Progress value={health.score} tone={health.score >= 90 ? "success" : health.score >= 70 ? "primary" : "warning"} className="mt-2" />
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
              <p className="text-sm font-medium">No clauses yet</p>
              <p className="max-w-[220px] text-xs text-muted-foreground">Ask Merlin to scaffold a contract or add clauses — they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clauses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onAskAbout(`§${c.number} ${c.title}`)}
                  className={`w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-merlin-border ${
                    c.risk !== "none" ? "border-l-2" : ""
                  }`}
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
                        <span className={`truncate text-right font-medium ${!f.value ? "text-risk-med" : ""}`}>{f.value || "Missing"}</span>
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
        <Button className="w-full" onClick={onSubmit}>
          <ShieldCheck className="size-4" /> Submit for approval
        </Button>
      </div>
    </aside>
  );
}
