import * as React from "react";
import { Button, Badge, Avatar, Input, Textarea } from "@/components/ui/primitives";
import {
  ClauseStatusBadge,
  RiskBadge,
  MerlinMark,
} from "@/components/shared";
import { useStore } from "@/store";
import type { Clause } from "@/lib/types";
import {
  MessageSquare,
  History,
  Repeat2,
  Sparkles,
  ChevronDown,
  Check,
  ShieldCheck,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const VARIANT_TONE = {
  standard: "low",
  fallback: "med",
  custom: "high",
} as const;

export function ClauseCard({ clause }: { clause: Clause }) {
  const {
    selectedClauseId,
    setSelectedClause,
    setMerlinTab,
    applyVariant,
    resolveInsight,
    insights,
    editingClauseId,
    setEditingClause,
    updateClause,
    removeClause,
  } = useStore();
  const [showVariants, setShowVariants] = React.useState(false);
  const selected = selectedClauseId === clause.id;
  const editing = editingClauseId === clause.id;
  const [draftTitle, setDraftTitle] = React.useState(clause.title);
  const [draftBody, setDraftBody] = React.useState(clause.body);
  const ref = React.useRef<HTMLDivElement>(null);

  const linkedInsight = insights.find(
    (i) => i.clauseId === clause.id && !i.resolved && i.type === "risk"
  );

  React.useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

  React.useEffect(() => {
    if (editing) {
      setDraftTitle(clause.title);
      setDraftBody(clause.body);
    }
  }, [editing]); // eslint-disable-line

  function select(tab?: string) {
    setSelectedClause(clause.id);
    if (tab) setMerlinTab(tab);
  }

  function startEdit() {
    setDraftTitle(clause.title);
    setDraftBody(clause.body);
    setEditingClause(clause.id);
    setSelectedClause(clause.id);
  }

  function saveEdit() {
    if (!draftTitle.trim() && !draftBody.trim()) {
      removeClause(clause.id);
      return;
    }
    updateClause(clause.id, {
      title: draftTitle.trim() || "Untitled clause",
      body: draftBody.trim(),
      status: clause.status === "standard" ? "modified" : clause.status,
    });
    setEditingClause(null);
  }

  function cancelEdit() {
    // discard a never-saved empty clause entirely
    if (!clause.title.trim() && !clause.body.trim()) removeClause(clause.id);
    else setEditingClause(null);
  }

  if (editing) {
    return (
      <div
        ref={ref}
        className="scroll-mt-24 rounded-xl border border-primary bg-card p-5 ring-2 ring-primary/15"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
            {clause.number}
          </span>
          <Input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Clause title"
            className="h-8 font-semibold"
          />
        </div>
        <Textarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          placeholder="Write the clause text, or ask Merlin to draft it…"
          className="mt-3 min-h-[120px]"
        />
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={saveEdit}>
            <Check className="size-3.5" /> Save clause
          </Button>
          <Button
            size="sm"
            variant="merlin"
            onClick={() => {
              setEditingClause(null);
              select("rewrite");
            }}
          >
            <Sparkles className="size-3.5" /> Draft with Merlin
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit} className="ml-auto">
            <X className="size-3.5" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      id={`clause-${clause.id}`}
      onClick={() => select()}
      className={`group relative scroll-mt-24 rounded-xl border bg-card p-5 transition-all ${
        selected
          ? "border-primary ring-2 ring-primary/15"
          : "border-border hover:border-primary/30"
      }`}
    >
      {/* risk accent bar */}
      {clause.risk !== "none" && (
        <span
          className="absolute inset-y-4 left-0 w-1 rounded-full"
          style={{
            background:
              clause.risk === "high"
                ? "var(--risk-high)"
                : clause.risk === "medium"
                ? "var(--risk-med)"
                : "var(--risk-low)",
          }}
        />
      )}

      {/* header */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 font-mono text-xs font-semibold text-muted-foreground tabular-nums">
          {clause.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold">{clause.title}</h3>
            <ClauseStatusBadge status={clause.status} />
            <RiskBadge risk={clause.risk} />
            {clause.nonStandard && (
              <Badge tone="high">Non-standard</Badge>
            )}
            {clause.approved && (
              <Badge tone="low">
                <ShieldCheck /> Approved
              </Badge>
            )}
          </div>
        </div>
        {clause.owner && (
          <div className="hidden items-center gap-1.5 sm:flex">
            <Avatar name={clause.owner.split(" · ")[0]} className="size-6" />
            <span className="text-[11px] text-muted-foreground">{clause.owner}</span>
          </div>
        )}
      </div>

      {/* body */}
      {clause.body ? (
        <p className="mt-3 pl-7 text-sm leading-relaxed text-foreground/90">
          {clause.body}
        </p>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
          className="mt-3 ml-7 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <Pencil className="size-3.5" /> Empty clause — click to write, or ask Merlin to draft it
        </button>
      )}

      {/* Merlin inline insight */}
      {clause.merlinNote && (
        <div className="mt-3 ml-7 rounded-lg border border-merlin-border bg-merlin-soft/40 p-3">
          <div className="flex items-start gap-2.5">
            <MerlinMark size={24} />
            <div className="flex-1">
              <p className="text-xs leading-relaxed text-foreground">{clause.merlinNote}</p>
              {linkedInsight && (
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  Basis: {linkedInsight.basis} · Confidence {linkedInsight.confidence}%
                </div>
              )}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {clause.variants && (
                  <Button
                    size="sm"
                    variant="merlin"
                    className="h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVariants((v) => !v);
                      select();
                    }}
                  >
                    <Repeat2 className="size-3" /> Swap variant
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    select("compare");
                  }}
                >
                  Compare
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    select("explain");
                  }}
                >
                  Explain
                </Button>
                {linkedInsight && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      resolveInsight(linkedInsight.id, "ignore");
                    }}
                  >
                    Ignore
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* variant swapper */}
      {showVariants && clause.variants && (
        <div className="mt-3 ml-7 space-y-1.5 rounded-lg border border-border bg-muted/30 p-2 animate-in-up">
          <div className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Clause library · variants
          </div>
          {clause.variants.map((v) => {
            const active = clause.activeVariantId === v.id;
            return (
              <button
                key={v.id}
                onClick={(e) => {
                  e.stopPropagation();
                  applyVariant(clause.id, v.id);
                  setShowVariants(false);
                }}
                className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                  active
                    ? "border-primary bg-accent"
                    : "border-transparent bg-card hover:border-border"
                }`}
              >
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {active && <Check className="size-2.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{v.name}</span>
                    <Badge tone={VARIANT_TONE[v.kind]}>{v.kind}</Badge>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {v.note}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* footer */}
      <div className="mt-3 flex items-center gap-3 pl-7 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 has-[:focus]:opacity-100">
        <button
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
        >
          <Pencil className="size-3.5" /> Edit
        </button>
        <button
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            select("rewrite");
          }}
        >
          <Sparkles className="size-3.5" /> Ask Merlin
        </button>
        <button
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            select("history");
          }}
        >
          <History className="size-3.5" /> {clause.versions?.length ?? 1} version
          {(clause.versions?.length ?? 1) > 1 ? "s" : ""}
        </button>
        <button
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageSquare className="size-3.5" /> {clause.commentCount ?? 0}
        </button>
        {clause.variants ? (
          <button
            className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setShowVariants((v) => !v);
            }}
          >
            <Repeat2 className="size-3.5" /> Variants
            <ChevronDown className={`size-3 transition-transform ${showVariants ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <span className="ml-auto" />
        )}
        <button
          className="inline-flex items-center gap-1 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeClause(clause.id);
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
