import * as React from "react";
import { Card, Button, Badge, Input, Textarea, Avatar, Separator } from "@/components/ui/primitives";
import {
  SectionLabel,
  ConfidencePill,
  RiskDot,
  MerlinMark,
  ConfidenceMeter,
} from "@/components/shared";
import { useStore, CURRENT_USER, MENTIONABLE } from "@/store";
import { APPROVERS, CONTRACT, MISSING_CLAUSES } from "@/lib/data";
import {
  Check,
  MessageSquare,
  Paperclip,
  Upload,
  FileText,
  AlertTriangle,
  Clock,
  CircleUserRound,
  Sparkles,
  ShieldAlert,
  Lightbulb,
  ArrowUpRight,
  GitCompare,
  BookOpen,
  X,
  RotateCcw,
  Send,
  AtSign,
  CheckCircle2,
} from "lucide-react";

/* ---------- AI Suggestions (full page) ---------- */
export function AISuggestionsView({
  onGotoClause,
  onOpenMerlin,
}: {
  onGotoClause: () => void;
  onOpenMerlin: () => void;
}) {
  const {
    insights,
    clauses,
    resolveInsight,
    insertMissingClause,
    setSelectedClause,
    setMerlinTab,
    isBlank,
    scaffoldContract,
  } = useStore();

  const open = insights.filter((i) => !i.resolved);
  const resolved = insights.filter((i) => i.resolved);
  const risks = open.filter((i) => i.type === "risk");
  const missing = open.filter((i) => i.type === "missing");
  const tips = open.filter((i) => i.type !== "risk" && i.type !== "missing");
  const total = insights.length;
  const progress = total ? Math.round((resolved.length / total) * 100) : 0;

  function goToClause(id?: string) {
    if (id) setSelectedClause(id);
    onGotoClause();
  }
  function openMerlinTab(id: string | undefined, tab: string) {
    if (id) setSelectedClause(id);
    setMerlinTab(tab);
    onOpenMerlin();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="flex items-start gap-3">
        <MerlinMark size={34} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">AI suggestions</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Everything Merlin flagged on this contract — risks, missing clauses and benchmarks.
            Each shows what it found, why, the policy basis and its confidence.
          </p>
        </div>
      </div>

      {/* blank / empty */}
      {isBlank && total === 0 ? (
        <Card className="mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <Sparkles className="size-8 text-merlin" />
          <div className="text-sm font-medium">No suggestions yet</div>
          <p className="max-w-sm text-xs text-muted-foreground">
            Merlin analyses your clauses and metadata as you build. Add a few clauses and risk,
            policy and missing-clause checks will appear here.
          </p>
          <Button size="sm" variant="merlin" onClick={scaffoldContract}>
            <Sparkles className="size-3.5" /> Scaffold a contract to see checks
          </Button>
        </Card>
      ) : total === 0 ? (
        <Card className="mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-risk-low-soft">
            <Check className="size-6 text-success" />
          </div>
          <div className="text-sm font-medium">All clear</div>
          <p className="text-xs text-muted-foreground">
            No open suggestions. This contract is aligned with policy.
          </p>
        </Card>
      ) : (
        <>
          {/* summary */}
          <Card className="mt-5 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <RiskDot risk="high" /> <strong>{risks.length}</strong> open risk
                {risks.length !== 1 && "s"}
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <RiskDot risk="medium" /> <strong>{missing.length}</strong> missing
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Lightbulb className="size-3.5 text-merlin" /> <strong>{tips.length}</strong> tips
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                {resolved.length}/{total} resolved
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-success transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </div>
            </div>
          </Card>

          {risks.length > 0 && (
            <PageGroup title="Risks" icon={<ShieldAlert className="size-4 text-risk-high" />}>
              {risks.map((i) => (
                <SuggestionRow
                  key={i.id}
                  insight={i}
                  clauseLabel={labelFor(clauses, i.clauseId)}
                  onGoto={() => goToClause(i.clauseId)}
                  onCompare={() => openMerlinTab(i.clauseId, "compare")}
                  onExplain={() => openMerlinTab(i.clauseId, "explain")}
                  onApply={() => resolveInsight(i.id, "accept")}
                  onIgnore={() => resolveInsight(i.id, "ignore")}
                />
              ))}
            </PageGroup>
          )}

          {missing.length > 0 && (
            <PageGroup title="Missing clauses" icon={<AlertTriangle className="size-4 text-risk-med" />}>
              {MISSING_CLAUSES.map((m) => {
                const ins = missing.find(
                  (i) => (m.id === "m1" && i.id === "i4") || (m.id === "m2" && i.id === "i5")
                );
                if (!ins) return null;
                return (
                  <Card key={m.id} className="p-4">
                    <div className="flex items-center gap-2">
                      <RiskDot risk={m.risk} />
                      <span className="text-sm font-semibold">{m.title}</span>
                      <Badge tone="merlin" className="ml-auto">
                        <Sparkles /> Draftable
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {m.reason}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Basis: {ins.basis}</span>
                      <ConfidenceMeter value={ins.confidence} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="merlin" onClick={() => insertMissingClause(m.id)}>
                        <Sparkles className="size-3.5" /> Draft & insert
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => resolveInsight(ins.id, "ignore")}>
                        Dismiss
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </PageGroup>
          )}

          {tips.length > 0 && (
            <PageGroup title="Benchmarks & tips" icon={<Lightbulb className="size-4 text-merlin" />}>
              {tips.map((i) => (
                <Card key={i.id} className="p-4">
                  <div className="text-sm font-semibold">{i.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.detail}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{i.basis}</span>
                    <ConfidenceMeter value={i.confidence} />
                  </div>
                  {i.clauseId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-7"
                      onClick={() => goToClause(i.clauseId)}
                    >
                      View clause <ArrowUpRight className="size-3" />
                    </Button>
                  )}
                </Card>
              ))}
            </PageGroup>
          )}

          {resolved.length > 0 && (
            <PageGroup
              title={`Resolved (${resolved.length})`}
              icon={<CheckCircle2 className="size-4 text-success" />}
            >
              {resolved.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                >
                  <Check className="size-4 text-success" />
                  <span className="line-through">{i.title}</span>
                  <span className="ml-auto text-[11px]">{i.basis}</span>
                </div>
              ))}
            </PageGroup>
          )}
        </>
      )}
    </div>
  );
}

function labelFor(clauses: { id: string; number: string; title: string }[], id?: string) {
  const c = clauses.find((x) => x.id === id);
  return c ? `§${c.number} ${c.title}` : undefined;
}

function PageGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <SectionLabel>{title}</SectionLabel>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SuggestionRow({
  insight,
  clauseLabel,
  onGoto,
  onCompare,
  onExplain,
  onApply,
  onIgnore,
}: {
  insight: import("@/lib/types").MerlinInsight;
  clauseLabel?: string;
  onGoto: () => void;
  onCompare: () => void;
  onExplain: () => void;
  onApply: () => void;
  onIgnore: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-2.5">
        <RiskDot risk={insight.severity} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{insight.title}</span>
            {clauseLabel && (
              <button
                onClick={onGoto}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-primary hover:underline"
              >
                {clauseLabel} <ArrowUpRight className="size-3" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{insight.basis}</span>
            <ConfidenceMeter value={insight.confidence} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="merlin" onClick={onApply}>
              <Check className="size-3.5" /> Apply fix
            </Button>
            <Button size="sm" variant="outline" onClick={onCompare}>
              <GitCompare className="size-3.5" /> Compare
            </Button>
            <Button size="sm" variant="outline" onClick={onExplain}>
              <BookOpen className="size-3.5" /> Explain
            </Button>
            {insight.actions.includes("escalate") && (
              <Button size="sm" variant="ghost">
                Escalate to Legal
              </Button>
            )}
            <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={onIgnore}>
              <X className="size-3.5" /> Ignore
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Metadata (editable) ---------- */
export function MetadataView({ commercialOnly = false }: { commercialOnly?: boolean }) {
  const { metadata, updateField } = useStore();
  const groups = commercialOnly
    ? (["Commercial", "Financial"] as const)
    : (["Supplier", "Commercial", "Financial", "Legal", "Renewal", "Compliance"] as const);

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h2 className="text-lg font-semibold">
        {commercialOnly ? "Commercial details" : "Contract metadata"}
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Edit inline. Changes sync everywhere and are tracked in the audit log.
      </p>
      <div className="mt-5 space-y-5">
        {groups.map((g) => (
          <Card key={g} className="overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-2.5">
              <SectionLabel>{g}</SectionLabel>
            </div>
            <div className="divide-y divide-border">
              {metadata
                .filter((f) => f.group === g)
                .map((f) => (
                  <div key={f.id} className="grid grid-cols-[1fr_1.4fr] items-center gap-3 px-4 py-2.5">
                    <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      {f.label}
                      {f.required && <span className="text-destructive">*</span>}
                    </label>
                    <div>
                      <Input
                        value={f.value}
                        placeholder={f.confidence === "missing" ? "Required" : ""}
                        onChange={(e) => updateField(f.id, e.target.value)}
                        className={
                          f.confidence === "missing"
                            ? "h-8 border-risk-high/50"
                            : f.confidence === "review"
                            ? "h-8 border-risk-med/50"
                            : "h-8"
                        }
                      />
                      <div className="mt-1">
                        <ConfidencePill c={f.confidence} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Comments ---------- */
export function CommentsView() {
  const { comments, clauses, addComment } = useStore();
  const [showComposer, setShowComposer] = React.useState(false);
  const [filter, setFilter] = React.useState<"open" | "all">("open");

  const threads = comments.filter((c) => !c.parentId);
  const openCount = threads.filter((c) => !c.resolved).length;
  const visible = threads.filter((t) => (filter === "open" ? !t.resolved : true));

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Comments & collaboration</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {openCount} open thread{openCount !== 1 && "s"} · mention teammates with @
          </p>
        </div>
        <Button size="sm" onClick={() => setShowComposer((s) => !s)}>
          <MessageSquare className="size-3.5" /> New comment
        </Button>
      </div>

      {/* new-comment composer */}
      {showComposer && (
        <Composer
          clauses={clauses}
          onCancel={() => setShowComposer(false)}
          onPost={(clauseId, body) => {
            addComment({ clauseId, body });
            setShowComposer(false);
          }}
        />
      )}

      {/* filter */}
      <div className="mt-5 flex items-center gap-1.5">
        {(["open", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {f === "open" ? "Open" : "All"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="mt-3 flex flex-col items-center gap-2 p-10 text-center">
          <MessageSquare className="size-8 text-muted-foreground/40" />
          <div className="text-sm font-medium">
            {filter === "open" ? "No open comments" : "No comments yet"}
          </div>
          <p className="text-xs text-muted-foreground">
            Start a thread on any clause — tag Legal, Finance or the business owner with @.
          </p>
        </Card>
      ) : (
        <div className="mt-3 space-y-3">
          {visible.map((cm) => (
            <CommentThread key={cm.id} comment={cm} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentThread({ comment: cm }: { comment: import("@/lib/types").Comment }) {
  const { comments, clauses, resolveComment, reopenComment, addComment, setSelectedClause } =
    useStore();
  const [replying, setReplying] = React.useState(false);
  const [reply, setReply] = React.useState("");
  const clause = clauses.find((c) => c.id === cm.clauseId);
  const replies = comments.filter((r) => r.parentId === cm.id);

  return (
    <Card className={`p-4 ${cm.resolved ? "opacity-70" : ""}`}>
      <CommentBody cm={cm} clause={clause} onGoto={() => clause && setSelectedClause(clause.id)} />

      {/* replies */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-3 border-l-2 border-border pl-3">
          {replies.map((r) => (
            <CommentBody key={r.id} cm={r} compact />
          ))}
        </div>
      )}

      {/* actions */}
      <div className="mt-3 flex items-center gap-2">
        {cm.resolved ? (
          <Button size="sm" variant="ghost" className="h-7" onClick={() => reopenComment(cm.id)}>
            <RotateCcw className="size-3" /> Reopen
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="h-7" onClick={() => setReplying((v) => !v)}>
              Reply
            </Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => resolveComment(cm.id)}>
              <Check className="size-3" /> Resolve
            </Button>
          </>
        )}
        {cm.resolved && (
          <span className="ml-1 inline-flex items-center gap-1 text-[11px] font-medium text-success">
            <Check className="size-3" /> Resolved
          </span>
        )}
      </div>

      {/* reply box */}
      {replying && !cm.resolved && (
        <div className="mt-3 flex items-start gap-2">
          <Avatar name={CURRENT_USER.name} className="size-7" />
          <div className="flex-1">
            <Textarea
              autoFocus
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply… use @ to mention"
              className="min-h-[60px]"
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="h-7"
                disabled={!reply.trim()}
                onClick={() => {
                  addComment({ clauseId: cm.clauseId, body: reply.trim(), parentId: cm.id });
                  setReply("");
                  setReplying(false);
                }}
              >
                <Send className="size-3" /> Reply
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setReplying(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function CommentBody({
  cm,
  clause,
  compact,
  onGoto,
}: {
  cm: import("@/lib/types").Comment;
  clause?: { number: string; title: string };
  compact?: boolean;
  onGoto?: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={cm.author} className={compact ? "size-6" : "size-8"} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{cm.author}</span>
          <Badge tone="outline">{cm.role}</Badge>
          <span className="text-[11px] text-muted-foreground">{cm.timestamp}</span>
        </div>
        {!compact && clause && onGoto && (
          <button
            onClick={onGoto}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <MessageSquare className="size-3" /> §{clause.number} {clause.title}
          </button>
        )}
        <p className="mt-1.5 text-sm leading-relaxed">{renderMentions(cm.body)}</p>
      </div>
    </div>
  );
}

function renderMentions(body: string) {
  return body.split(/(@[A-Za-z]+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-primary">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function Composer({
  clauses,
  onPost,
  onCancel,
}: {
  clauses: { id: string; number: string; title: string }[];
  onPost: (clauseId: string, body: string) => void;
  onCancel: () => void;
}) {
  const { selectedClauseId } = useStore();
  const [clauseId, setClauseId] = React.useState(
    selectedClauseId ?? clauses[0]?.id ?? ""
  );
  const [body, setBody] = React.useState("");

  if (clauses.length === 0) {
    return (
      <Card className="mt-4 p-4 text-sm text-muted-foreground">
        Add a clause first — comments are anchored to a clause.
      </Card>
    );
  }

  return (
    <Card className="mt-4 p-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Comment on</span>
        <select
          value={clauseId}
          onChange={(e) => setClauseId(e.target.value)}
          className="h-8 flex-1 rounded-lg border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {clauses.map((c) => (
            <option key={c.id} value={c.id}>
              §{c.number} {c.title}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment… use @ to mention a teammate"
        className="mt-3"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <AtSign className="size-3 text-muted-foreground" />
        {MENTIONABLE.slice(0, 4).map((name) => (
          <button
            key={name}
            onClick={() => setBody((b) => `${b}${b && !b.endsWith(" ") ? " " : ""}@${name.split(" ")[0]} `)}
            className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            @{name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={!body.trim()} onClick={() => onPost(clauseId, body.trim())}>
          <Send className="size-3.5" /> Post comment
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

/* ---------- Versions ---------- */
export function VersionsView() {
  const { activity } = useStore();
  const versions = [
    { v: "v3 · Working draft", who: "Jitendra Kumar", when: "Just now", note: "Current — clause edits in progress", current: true },
    { v: "v2 · Supplier redlines imported", who: "Import", when: "1h ago", note: "Applied ABC Manufacturing changes to Payment & Termination" },
    { v: "v1 · Merlin generated draft", who: "Merlin", when: "1h ago", note: "Generated from Supplier Agreement India (FY26)" },
  ];
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h2 className="text-lg font-semibold">Version history</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Full document snapshots. Compare or restore any version.</p>
      <div className="mt-5 space-y-3">
        {versions.map((v) => (
          <Card key={v.v} className={`p-4 ${v.current ? "border-primary" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{v.v}</span>
              {v.current && <Badge tone="primary">Current</Badge>}
              <span className="ml-auto text-[11px] text-muted-foreground">{v.who} · {v.when}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{v.note}</p>
            {!v.current && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="h-7">Compare</Button>
                <Button size="sm" variant="ghost" className="h-7">Restore</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Separator className="my-6" />
      <SectionLabel className="mb-3">Recent activity</SectionLabel>
      <div className="space-y-3">
        {activity.slice(0, 6).map((e) => (
          <div key={e.id} className="flex gap-2.5 text-xs">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
            <div>
              <span className="font-medium">{e.actor}</span>{" "}
              <span className="text-muted-foreground">{e.action}</span>{" "}
              {e.target && <span className="font-medium">{e.target}</span>}
              <span className="ml-1 text-muted-foreground/60">· {e.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Audit ---------- */
export function AuditView() {
  const { activity } = useStore();
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h2 className="text-lg font-semibold">Audit trail</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Immutable, timestamped record of every action — export-ready for compliance.
      </p>
      <Card className="mt-5 divide-y divide-border">
        {activity.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full text-white"
              style={{
                background:
                  e.kind === "ai"
                    ? "var(--merlin)"
                    : e.kind === "risk"
                    ? "var(--risk-high)"
                    : e.kind === "comment"
                    ? "var(--info)"
                    : "var(--primary)",
              }}
            >
              <CircleUserRound className="size-4" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{e.actor}</span>{" "}
              <span className="text-muted-foreground">{e.action}</span>{" "}
              {e.target && <span className="font-medium">{e.target}</span>}
            </div>
            <span className="text-[11px] text-muted-foreground">{e.timestamp}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- Approvals ---------- */
export function ApprovalsView({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h2 className="text-lg font-semibold">Approval workflow</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        4-stage chain for {CONTRACT.value} · {CONTRACT.businessUnit}
      </p>
      <div className="mt-5 space-y-2">
        {APPROVERS.map((a, i) => (
          <Card key={a.id} className="flex items-center gap-3 p-4">
            <div className="relative">
              <Avatar name={a.name} className="size-9" />
              {i < APPROVERS.length - 1 && (
                <span className="absolute left-1/2 top-full h-3 w-px -translate-x-1/2 bg-border" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{a.name}</span>
                <span className="text-[11px] text-muted-foreground">Stage {a.stage} · {a.role}</span>
              </div>
              {a.note && <div className="mt-0.5 text-[11px] text-muted-foreground">{a.note}</div>}
            </div>
            <ApproverStatus status={a.status} />
          </Card>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-risk-med/30 bg-risk-med-soft/40 p-3 text-xs text-risk-med">
        <AlertTriangle className="mr-1 inline size-3.5" />
        Ananya Rao (Legal) is on leave until 22 Jul. A delegate is available — routing will offer to reassign.
      </div>
      <Button className="mt-5 w-full" size="lg" onClick={onSubmit}>
        Check readiness & submit
      </Button>
    </div>
  );
}

function ApproverStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "low" | "med" | "high" | "neutral"; icon: typeof Check }> = {
    ready: { label: "Ready", tone: "low", icon: Check },
    pending: { label: "Pending", tone: "med", icon: Clock },
    "on-leave": { label: "On leave", tone: "high", icon: AlertTriangle },
    delegated: { label: "Delegated", tone: "neutral", icon: CircleUserRound },
  };
  const m = map[status] ?? map.pending;
  const Icon = m.icon;
  return (
    <Badge tone={m.tone}>
      <Icon /> {m.label}
    </Badge>
  );
}

/* ---------- Attachments ---------- */
export function AttachmentsView() {
  const files = [
    { name: "ABC_Manufacturing_supplier_paper.pdf", size: "1.2 MB", tag: "Source paper", by: "Import" },
    { name: "Supplier_insurance_certificate.pdf", size: "480 KB", tag: "Compliance", by: "Priya Nair" },
    { name: "Price_schedule_ScheduleB.xlsx", size: "88 KB", tag: "Commercial", by: "Rahul Mehta" },
  ];
  const missing = ["Signed NDA (referenced in Clause 10)", "DPDP data-processing addendum"];
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h2 className="text-lg font-semibold">Attachments</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Supporting documents linked to this contract.</p>
      <Card className="mt-5 divide-y divide-border">
        {files.map((f) => (
          <div key={f.name} className="flex items-center gap-3 p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-accent text-primary">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{f.name}</div>
              <div className="text-[11px] text-muted-foreground">{f.size} · {f.by}</div>
            </div>
            <Badge tone="outline">{f.tag}</Badge>
          </div>
        ))}
      </Card>

      <div className="mt-4 rounded-lg border border-risk-med/30 bg-risk-med-soft/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-risk-med">
          <AlertTriangle className="size-3.5" /> Merlin: 2 referenced attachments are missing
        </div>
        <ul className="mt-1.5 space-y-1">
          {missing.map((m) => (
            <li key={m} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RiskDot risk="medium" /> {m}
            </li>
          ))}
        </ul>
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
        <Upload className="size-4" /> Drop files or click to upload
      </button>
    </div>
  );
}
