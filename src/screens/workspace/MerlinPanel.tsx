import * as React from "react";
import { Button, Badge, Progress, Separator } from "@/components/ui/primitives";
import {
  MerlinMark,
  ConfidenceMeter,
  RiskDot,
  RISK_META,
} from "@/components/shared";
import { useStore } from "@/store";
import { MISSING_CLAUSES } from "@/lib/data";
import type { Clause } from "@/lib/types";
import { useHealth } from "./LeftRail";
import {
  Sparkles,
  ShieldAlert,
  Plus,
  Wand2,
  GitCompare,
  BookOpen,
  History,
  Lightbulb,
  ArrowRight,
  Check,
  ArrowUpRight,
  MinusCircle,
  PlusCircle,
  Languages,
  Scissors,
  Maximize2,
  Scale,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "generate", label: "Generate", icon: Plus },
  { id: "rewrite", label: "Rewrite", icon: Wand2 },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "explain", label: "Explain", icon: BookOpen },
  { id: "risk", label: "Risk", icon: ShieldAlert },
  { id: "history", label: "History", icon: History },
];

/* streaming typewriter */
function useStream() {
  const [text, setText] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const run = React.useCallback((full: string, done?: () => void) => {
    if (timer.current) clearInterval(timer.current);
    setText("");
    setStreaming(true);
    const words = full.split(" ");
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      setText(words.slice(0, i).join(" "));
      if (i >= words.length) {
        if (timer.current) clearInterval(timer.current);
        setStreaming(false);
        done?.();
      }
    }, 28);
  }, []);

  const reset = React.useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setText("");
    setStreaming(false);
  }, []);

  React.useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    []
  );
  return { text, streaming, run, reset };
}

export function MerlinPanel() {
  const { merlinTab, setMerlinTab, clauses, selectedClauseId } = useStore();
  const selected = clauses.find((c) => c.id === selectedClauseId) ?? null;
  const health = useHealth();

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-card">
      {/* header */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <MerlinMark size={30} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              Merlin
              <Badge tone="merlin" className="ml-0.5">
                Co-pilot
              </Badge>
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {selected ? `Focused on §${selected.number} ${selected.title}` : "Watching the whole contract"}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contract health
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">{health.score}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge tone={health.ready ? "low" : "med"}>
              {health.ready ? "Ready" : "In progress"}
            </Badge>
          </div>
          <Progress
            value={health.score}
            tone={health.score >= 90 ? "success" : health.score >= 70 ? "primary" : "warning"}
            className="mt-3"
          />
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <RiskDot risk="high" /> {health.openRisks} risks
            </span>
            <span className="inline-flex items-center gap-1">
              <RiskDot risk="medium" /> {health.openMissing} missing
            </span>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="overflow-x-auto border-b border-border px-2 py-2 scrollbar-thin">
        <div className="flex min-w-max gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = merlinTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setMerlinTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
        </div>
      </div>

      {/* body */}
      <div className="min-w-0 flex-1 overflow-y-auto break-words scrollbar-thin">
        {merlinTab === "insights" && <InsightsTab />}
        {merlinTab === "generate" && <GenerateTab />}
        {merlinTab === "rewrite" && <RewriteTab clause={selected} />}
        {merlinTab === "compare" && <CompareTab clause={selected} />}
        {merlinTab === "explain" && <ExplainTab clause={selected} />}
        {merlinTab === "risk" && <RiskTab clause={selected} />}
        {merlinTab === "history" && <HistoryTab clause={selected} />}
      </div>
    </div>
  );
}

/* ---------- Insights ---------- */
function InsightsTab() {
  const {
    insights,
    resolveInsight,
    insertMissingClause,
    setSelectedClause,
    setMerlinTab,
    isBlank,
    clauses,
    scaffoldContract,
    addClause,
  } = useStore();
  const open = insights.filter((i) => !i.resolved);
  const risks = open.filter((i) => i.type === "risk");
  const missing = open.filter((i) => i.type === "missing");
  const other = open.filter((i) => i.type !== "risk" && i.type !== "missing");

  // Blank canvas — proactive onboarding instead of "all clear"
  if (isBlank && clauses.length === 0) {
    return (
      <div className="space-y-3 p-3">
        <div className="rounded-lg bg-merlin-soft/40 p-3 text-sm">
          <span className="font-medium">You're on a blank canvas.</span>{" "}
          <span className="text-muted-foreground">
            Tell me what you're building and I'll get you moving — nothing is added without your go-ahead.
          </span>
        </div>
        {[
          {
            title: "Scaffold a Purchase Agreement",
            detail: "I'll drop in 5 standard, policy-aligned clauses you can tailor.",
            cta: "Scaffold now",
            run: scaffoldContract,
          },
          {
            title: "Add a specific clause",
            detail: "Pick from the governed clause library and insert with one click.",
            cta: "Open library",
            run: () => setMerlinTab("generate"),
          },
          {
            title: "Write your own",
            detail: "Start an empty clause and I'll help you draft or tighten it.",
            cta: "New blank clause",
            run: () => {
              const id = addClause({ title: "Untitled clause", body: "", edit: true });
              setSelectedClause(id);
            },
          },
          {
            title: "Set up contract metadata",
            detail: "Capture supplier, value, dates and jurisdiction to unlock risk checks.",
            cta: "Go to metadata",
            run: () => setMerlinTab("insights"),
          },
        ].map((s) => (
          <div key={s.title} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-merlin" />
              <span className="text-sm font-medium">{s.title}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
            <Button size="sm" variant="merlin" className="mt-2.5 h-7" onClick={s.run}>
              {s.cta}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">
      {/* summary line */}
      <div className="rounded-2xl border border-merlin-border/30 bg-merlin-soft/30 px-3 py-2.5 text-sm">
        <span className="font-medium">Focus here first.</span>{" "}
        <span className="text-muted-foreground">
          Resolve open risks and missing clauses to improve approval readiness.
        </span>
      </div>

      {open.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-risk-low-soft">
            <Check className="size-6 text-success" />
          </div>
          <p className="text-sm font-medium">All clear</p>
          <p className="text-xs text-muted-foreground">
            No open risks or missing clauses. This contract is approval-ready.
          </p>
        </div>
      )}

      {risks.length > 0 && (
        <Group title="Risks" count={risks.length}>
          {risks.map((i) => (
            <InsightCard
              key={i.id}
              insight={i}
              onGoto={() => {
                if (i.clauseId) {
                  setSelectedClause(i.clauseId);
                }
              }}
              onCompare={() => {
                if (i.clauseId) setSelectedClause(i.clauseId);
                setMerlinTab("compare");
              }}
              onExplain={() => {
                if (i.clauseId) setSelectedClause(i.clauseId);
                setMerlinTab("explain");
              }}
              onAccept={() => resolveInsight(i.id, "accept")}
              onIgnore={() => resolveInsight(i.id, "ignore")}
            />
          ))}
        </Group>
      )}

      {missing.length > 0 && (
        <Group title="Missing clauses" count={missing.length}>
          {MISSING_CLAUSES.map((m) => {
            const insight = missing.find(
              (i) => (m.id === "m1" && i.id === "i4") || (m.id === "m2" && i.id === "i5")
            );
            if (!insight) return null;
            return (
              <div
                key={m.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <RiskDot risk={m.risk} />
                  <span className="text-sm font-medium">{m.title}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {m.reason}
                </p>
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  Basis: {insight.basis}
                </div>
                <Button
                  size="sm"
                  variant="merlin"
                  className="mt-2.5 w-full"
                  onClick={() => insertMissingClause(m.id)}
                >
                  <Sparkles className="size-3.5" /> Draft & insert with Merlin
                </Button>
              </div>
            );
          })}
        </Group>
      )}

      {other.length > 0 && (
        <Group title="Benchmarks & tips" count={other.length}>
          {other.map((i) => (
            <div key={i.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-3.5 text-merlin" />
                <span className="text-sm font-medium">{i.title}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{i.detail}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{i.basis}</span>
                <ConfidenceMeter value={i.confidence} />
              </div>
            </div>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InsightCard({
  insight,
  onGoto,
  onCompare,
  onExplain,
  onAccept,
  onIgnore,
}: {
  insight: import("@/lib/types").MerlinInsight;
  onGoto: () => void;
  onCompare: () => void;
  onExplain: () => void;
  onAccept: () => void;
  onIgnore: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border p-4 transition-colors hover:border-merlin-border">
      <div className="flex items-start gap-2">
        <RiskDot risk={insight.severity} />
        <div className="min-w-0 flex-1">
          <button
            onClick={onGoto}
            className="group inline-flex items-center gap-1 text-left text-sm font-medium hover:text-primary"
          >
            {insight.title}
            <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="truncate text-[11px] text-muted-foreground" title={insight.basis}>
          Basis: {insight.basis}
        </span>
        <ConfidenceMeter value={insight.confidence} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-7 border-merlin-border text-primary hover:bg-merlin-soft" onClick={onAccept}>
          <Check className="size-3" /> Apply fix
        </Button>
        <Button size="sm" variant="outline" className="h-7" onClick={onCompare}>
          Compare
        </Button>
        <Button size="sm" variant="outline" className="h-7" onClick={onExplain}>
          Explain
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs">
        {insight.actions.includes("escalate") && (
          <button className="font-medium text-muted-foreground transition-colors hover:text-foreground">
            Escalate
          </button>
        )}
        <button
          onClick={onIgnore}
          className="font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* ---------- Generate ---------- */
const LIBRARY = [
  { id: "g1", title: "Force Majeure", body: "Neither Party shall be liable for any failure or delay in performance caused by events beyond its reasonable control, including acts of God, war, epidemic, or government action, provided the affected Party gives prompt notice and uses reasonable efforts to mitigate." },
  { id: "g2", title: "Anti-Bribery & Corruption", body: "Each Party shall comply with all applicable anti-bribery and anti-corruption laws, including the Prevention of Corruption Act, 1988, and shall not offer or accept any improper payment in connection with this Agreement." },
  { id: "g3", title: "Audit Rights", body: "Buyer may, on reasonable notice, audit Supplier's records relating to this Agreement no more than once per year to verify compliance, at Buyer's cost." },
];

function GenerateTab() {
  const { addClause, setSelectedClause, logActivity, toast } = useStore();
  const { text, streaming, run, reset } = useStream();
  const [picked, setPicked] = React.useState<(typeof LIBRARY)[number] | null>(null);
  const [inserted, setInserted] = React.useState(false);

  function generate(item: (typeof LIBRARY)[number]) {
    setPicked(item);
    setInserted(false);
    run(item.body);
  }

  return (
    <div className="space-y-4 p-3">
      <div className="rounded-lg bg-merlin-soft/40 p-3 text-xs text-muted-foreground">
        Generate a new clause from the governed library or a prompt. Merlin drafts it —
        you review and insert. Nothing is added silently.
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Suggested from library
        </div>
        <div className="space-y-1.5">
          {LIBRARY.map((item) => (
            <button
              key={item.id}
              onClick={() => generate(item)}
              className="flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-left text-sm hover:border-merlin-border"
            >
              <span className="font-medium">{item.title}</span>
              <Plus className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {picked && (
        <div className="rounded-lg border border-merlin-border bg-card p-3 animate-in-up">
          <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
            <MerlinMark size={22} />
            {picked.title}
            {streaming && <span className="text-[11px] font-normal text-merlin">drafting…</span>}
          </div>
          <p className="text-xs leading-relaxed text-foreground/90">
            {text}
            {streaming && <span className="animate-caret">▋</span>}
          </p>
          {!streaming && !inserted && (
            <div className="mt-3 flex gap-1.5">
              <Button
                size="sm"
                variant="merlin"
                className="h-7"
                onClick={() => {
                  const id = addClause({
                    title: picked.title,
                    body: text,
                    status: "ai-generated",
                    aiGenerated: true,
                  });
                  setSelectedClause(id);
                  setInserted(true);
                  logActivity({
                    actor: "Merlin",
                    action: "inserted AI-drafted clause",
                    target: picked.title,
                    kind: "ai",
                  });
                  toast({
                    title: "Clause inserted",
                    detail: `${picked.title} — drafted by Merlin, flagged for review`,
                    tone: "merlin",
                  });
                }}
              >
                <Check className="size-3" /> Insert into document
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={reset}>
                Discard
              </Button>
            </div>
          )}
          {inserted && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-success">
              <Check className="size-3" /> Inserted — review flagged in document
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Rewrite ---------- */
const REWRITE_MODES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "simplify", label: "Simplify", icon: Wand2 },
  { id: "legal", label: "Legal language", icon: Scale },
  { id: "business", label: "Business-friendly", icon: BookOpen },
  { id: "shorten", label: "Shorten", icon: Scissors },
  { id: "expand", label: "Expand", icon: Maximize2 },
  { id: "translate", label: "Translate (हिं)", icon: Languages },
];

function rewriteOutput(clause: Clause, mode: string): string {
  const t = clause.title;
  switch (mode) {
    case "simplify":
      return `In plain terms: ${t.toLowerCase()} sets out what each side must do. ${clause.body.split(".")[0]}. This keeps obligations clear and easy to follow.`;
    case "legal":
      return `Notwithstanding anything to the contrary herein, the provisions governing ${t} shall be construed in accordance with applicable law, and each Party's rights and obligations thereunder shall survive to the extent required to give effect to the intent of the Parties.`;
    case "business":
      return `What this means for us: ${clause.body.split(".")[0]}. Bottom line — it protects the commercial relationship without adding operational friction for either team.`;
    case "shorten":
      return `${clause.body.split(".")[0]}.`;
    case "expand":
      return `${clause.body} For the avoidance of doubt, the foregoing shall include any amendments agreed in writing, and neither Party shall unreasonably withhold consent where approval is required under this clause.`;
    case "translate":
      return `${t} (अनुवाद): इस खंड के अंतर्गत, प्रत्येक पक्ष अपने दायित्वों का पालन करेगा तथा लागू कानून के अनुसार कार्य करेगा।`;
    default:
      return clause.body;
  }
}

function RewriteTab({ clause }: { clause: Clause | null }) {
  const { commitClauseBody, toast, logActivity } = useStore();
  const { text, streaming, run, reset } = useStream();
  const [mode, setMode] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(false);

  if (!clause) return <EmptyClauseState action="rewrite" />;

  function doRewrite(m: string) {
    setMode(m);
    setApplied(false);
    run(rewriteOutput(clause!, m));
  }

  return (
    <div className="space-y-4 p-3">
      <div className="rounded-lg border border-border p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Current · §{clause.number} {clause.title}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{clause.body}</p>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Rewrite as
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {REWRITE_MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => doRewrite(m.id)}
                className={`inline-flex min-w-0 items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-colors ${
                  mode === m.id
                    ? "border-merlin-border bg-merlin-soft text-merlin"
                    : "border-border hover:border-merlin-border"
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {mode && (
        <div className="rounded-lg border border-merlin-border bg-card p-3 animate-in-up">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-medium">
            <MerlinMark size={20} /> Merlin suggestion
            {streaming && <span className="font-normal text-merlin">drafting…</span>}
          </div>
          <p className="text-xs leading-relaxed text-foreground/90">
            {text}
            {streaming && <span className="animate-caret">▋</span>}
          </p>
          {!streaming && !applied && (
            <div className="mt-3 flex gap-1.5">
              <Button
                size="sm"
                variant="merlin"
                className="h-7"
                onClick={() => {
                  commitClauseBody(clause.id, text);
                  setApplied(true);
                  logActivity({
                    actor: "Jitendra Kumar",
                    action: `applied Merlin rewrite (${mode}) to`,
                    target: clause.title,
                    kind: "ai",
                  });
                  toast({ title: "Rewrite applied", detail: clause.title, tone: "success" });
                }}
              >
                <Check className="size-3" /> Replace clause
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={reset}>
                Discard
              </Button>
            </div>
          )}
          {applied && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-success">
              <Check className="size-3" /> Applied · tracked in version history
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Compare ---------- */
function CompareTab({ clause }: { clause: Clause | null }) {
  const { applyVariant, resolveInsight, insights } = useStore();
  if (!clause) return <EmptyClauseState action="compare" />;

  const standard =
    clause.variants?.find((v) => v.kind === "standard") ?? null;
  const linked = insights.find((i) => i.clauseId === clause.id && !i.resolved);

  return (
    <div className="space-y-3 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        §{clause.number} {clause.title} — current vs. company standard
      </div>

      <div className="rounded-lg border border-risk-high/30 bg-risk-high-soft/30 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-risk-high">
          <MinusCircle className="size-3.5" /> Current draft
        </div>
        <p className="text-xs leading-relaxed">{clause.body}</p>
      </div>

      <div className="flex justify-center">
        <ArrowRight className="size-4 rotate-90 text-muted-foreground" />
      </div>

      <div className="rounded-lg border border-risk-low/30 bg-risk-low-soft/30 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-success">
          <PlusCircle className="size-3.5" /> Company standard
        </div>
        <p className="text-xs leading-relaxed">
          {standard ? standard.body : "60 days' notice for termination for convenience, with a 30-day cure period before termination for breach — per the Legal Standard Clause Library."}
        </p>
      </div>

      {linked && (
        <div className="rounded-lg bg-muted/50 p-2.5 text-[11px] text-muted-foreground">
          Basis: {linked.basis} · Confidence {linked.confidence}%
        </div>
      )}

      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="merlin"
          className="flex-1"
          onClick={() => {
            if (standard) applyVariant(clause.id, standard.id);
            else if (linked) resolveInsight(linked.id, "accept");
          }}
        >
          <Check className="size-3.5" /> Accept standard
        </Button>
        <Button size="sm" variant="outline">
          Keep current
        </Button>
      </div>
    </div>
  );
}

/* ---------- Explain ---------- */
function ExplainTab({ clause }: { clause: Clause | null }) {
  if (!clause) return <EmptyClauseState action="explain" />;
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookOpen className="size-4 text-merlin" /> Plain-language explainer
      </div>
      <div className="rounded-lg border border-border p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          §{clause.number} {clause.title}
        </div>
        <p className="mt-2 text-xs leading-relaxed">
          This clause governs <strong>{clause.title.toLowerCase()}</strong>. In practical terms:{" "}
          {clause.body.split(".")[0]}.
        </p>
        <Separator className="my-3" />
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-semibold">Why it matters: </span>
            <span className="text-muted-foreground">
              {clause.risk === "high"
                ? "It carries high commercial or legal exposure and diverges from your standard playbook."
                : clause.risk === "medium"
                ? "It has been modified from the template and is worth a second look."
                : "It follows the standard template with low risk."}
            </span>
          </div>
          <div>
            <span className="font-semibold">What to watch: </span>
            <span className="text-muted-foreground">
              {clause.merlinNote ?? "No specific deviations detected against company policy."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Risk ---------- */
function RiskTab({ clause }: { clause: Clause | null }) {
  const { clauses } = useStore();
  const counts = { high: 0, medium: 0, low: 0, none: 0 };
  clauses.forEach((c) => counts[c.risk]++);
  const total = clauses.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <ShieldAlert className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No clauses to score yet</p>
        <p className="text-xs text-muted-foreground">
          Add clauses and Merlin will score risk across the contract.
        </p>
      </div>
    );
  }

  const score = Math.round(
    ((counts.none + counts.low) / total) * 100 - counts.high * 4
  );

  return (
    <div className="space-y-4 p-3">
      <div className="rounded-lg border border-border p-4 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Contract risk score
        </div>
        <div className="mt-1 text-3xl font-bold tabular-nums">
          {Math.max(0, score)}
          <span className="text-base font-normal text-muted-foreground">/100</span>
        </div>
        <div className="mt-2 flex justify-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <RiskDot risk="high" /> {counts.high} high
          </span>
          <span className="inline-flex items-center gap-1">
            <RiskDot risk="medium" /> {counts.medium} med
          </span>
          <span className="inline-flex items-center gap-1">
            <RiskDot risk="low" /> {counts.low + counts.none} low
          </span>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Risk by clause
        </div>
        <div className="space-y-1">
          {clauses
            .filter((c) => c.risk !== "none")
            .sort((a, b) => rank(b.risk) - rank(a.risk))
            .map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                  clause?.id === c.id ? "border-primary" : "border-border"
                }`}
              >
                <RiskDot risk={c.risk} />
                <span className="font-mono text-[10px] text-muted-foreground">{c.number}</span>
                <span className="flex-1 truncate">{c.title}</span>
                <Badge tone={RISK_META[c.risk].tone}>{c.risk}</Badge>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
const rank = (r: string) => (r === "high" ? 3 : r === "medium" ? 2 : r === "low" ? 1 : 0);

/* ---------- History ---------- */
function HistoryTab({ clause }: { clause: Clause | null }) {
  const { activity } = useStore();
  return (
    <div className="space-y-4 p-3">
      {clause && clause.versions && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            §{clause.number} versions
          </div>
          <div className="space-y-2">
            {[...clause.versions].reverse().map((v, i) => (
              <div key={v.id} className="rounded-lg border border-border p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{v.label}</span>
                  {i === 0 && <Badge tone="primary">Current</Badge>}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {v.author} · {v.timestamp}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{v.summary}</p>
                {i !== 0 && (
                  <button className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                    <RotateCcw className="size-3" /> Restore this version
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </div>
        <div className="space-y-3">
          {activity.slice(0, 8).map((e) => (
            <div key={e.id} className="flex gap-2.5 text-xs">
              <span
                className="mt-1 size-1.5 shrink-0 rounded-full"
                style={{
                  background:
                    e.kind === "ai"
                      ? "var(--merlin)"
                      : e.kind === "risk"
                      ? "var(--risk-high)"
                      : e.kind === "comment"
                      ? "var(--info)"
                      : "var(--muted-foreground)",
                }}
              />
              <div className="min-w-0">
                <span className="font-medium">{e.actor}</span>{" "}
                <span className="text-muted-foreground">{e.action}</span>{" "}
                {e.target && <span className="font-medium">{e.target}</span>}
                <div className="text-[10px] text-muted-foreground">{e.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- shared empty ---------- */
function EmptyClauseState({ action }: { action: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-accent">
        <MerlinMark size={28} active={false} />
      </div>
      <p className="text-sm font-medium">Select a clause to {action}</p>
      <p className="text-xs text-muted-foreground">
        Click any clause in the document and Merlin will focus its {action} tools here.
      </p>
    </div>
  );
}
