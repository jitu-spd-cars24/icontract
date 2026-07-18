import { Badge, Button } from "@/components/ui/primitives";
import { MerlinMark, RiskDot } from "@/components/shared";
import { useStore } from "@/store";
import { ClauseCard } from "./ClauseCard";
import { MISSING_CLAUSES, CONTRACT } from "@/lib/data";
import {
  Sparkles,
  FileText,
  Clock,
  Building2,
  Plus,
  Wand2,
  Library,
  PencilLine,
  Copy,
} from "lucide-react";

export function DocumentCanvas() {
  const {
    clauses,
    insights,
    insertMissingClause,
    setMerlinTab,
    isBlank,
    submitted,
    duplicatedFrom,
    addClause,
    scaffoldContract,
    setSelectedClause,
  } = useStore();
  const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");

  function addManualClause() {
    const id = addClause({ title: "Untitled clause", body: "", edit: true });
    setSelectedClause(id);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* document header */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        {isBlank ? (
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-3.5" />
              <span className="font-mono">New · unsaved</span>
              <span>·</span>
              <Badge tone="med">Blank draft</Badge>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-muted-foreground">
              Untitled agreement
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" /> No supplier selected
              </span>
              <button
                onClick={() => setMerlinTab("insights")}
                className="font-medium text-primary hover:underline"
              >
                Set up metadata →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5" />
                <span className="font-mono">{CONTRACT.id}</span>
                <span>·</span>
                <Badge tone={submitted ? "primary" : "med"}>
                  {submitted ? "In approval" : "Draft"}
                </Badge>
                {duplicatedFrom && (
                  <Badge tone="merlin">
                    <Copy className="size-3" /> Duplicated from {duplicatedFrom}
                  </Badge>
                )}
              </div>
              <h1 className="mt-2 text-xl font-semibold tracking-tight">{CONTRACT.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" /> {CONTRACT.supplier}
                </span>
                <span>{CONTRACT.value}</span>
                <span>{CONTRACT.region} · {CONTRACT.businessUnit}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> {CONTRACT.effectiveDate} · {CONTRACT.term}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* blank empty state */}
      {clauses.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-merlin-border bg-merlin-soft/25 p-8 text-center animate-in-up">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-card shadow-sm">
            <MerlinMark size={40} />
          </div>
          <h2 className="mt-4 text-base font-semibold">Start with a blank editor</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            You're building from scratch. Add clauses one at a time, pull from the governed
            library, or let Merlin scaffold a standard Purchase Agreement you can tailor.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              onClick={scaffoldContract}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-merlin-border bg-card p-4 text-center transition-colors hover:merlin-glow"
            >
              <Wand2 className="size-5 text-merlin" />
              <span className="text-sm font-medium">Scaffold with Merlin</span>
              <span className="text-[11px] text-muted-foreground">5 standard clauses</span>
            </button>
            <button
              onClick={() => setMerlinTab("generate")}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/40"
            >
              <Library className="size-5 text-primary" />
              <span className="text-sm font-medium">Insert from library</span>
              <span className="text-[11px] text-muted-foreground">Browse clauses</span>
            </button>
            <button
              onClick={addManualClause}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/40"
            >
              <PencilLine className="size-5 text-primary" />
              <span className="text-sm font-medium">Write manually</span>
              <span className="text-[11px] text-muted-foreground">Empty clause</span>
            </button>
          </div>
        </div>
      )}

      {/* clauses */}
      {clauses.length > 0 && (
        <div className="space-y-3">
          {clauses.map((c) => (
            <ClauseCard key={c.id} clause={c} />
          ))}
        </div>
      )}

      {/* add clause button (any non-empty document) */}
      {clauses.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={addManualClause}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="size-4" /> Add clause
          </button>
          <button
            onClick={() => setMerlinTab("generate")}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-merlin-border px-4 py-3 text-sm text-merlin transition-colors hover:merlin-glow"
          >
            <Sparkles className="size-4" /> From library
          </button>
        </div>
      )}

      {/* missing clause prompts (draft mode) */}
      {!isBlank && openMissing.length > 0 && (
        <div className="mt-4 space-y-3">
          {MISSING_CLAUSES.map((m) => {
            const insight = openMissing.find(
              (i) => (m.id === "m1" && i.id === "i4") || (m.id === "m2" && i.id === "i5")
            );
            if (!insight) return null;
            return (
              <div
                key={m.id}
                className="rounded-xl border-2 border-dashed border-merlin-border bg-merlin-soft/30 p-5"
              >
                <div className="flex items-start gap-3">
                  <MerlinMark size={28} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <RiskDot risk={m.risk} />
                      <span className="text-sm font-semibold">Missing clause — {m.title}</span>
                      <Badge tone="merlin">Suggested</Badge>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.reason}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="merlin"
                        onClick={() => insertMissingClause(m.id)}
                      >
                        <Sparkles className="size-3.5" /> Draft & insert
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setMerlinTab("insights")}>
                        Why?
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center text-[11px] text-muted-foreground">
        {clauses.length === 0
          ? "Empty document"
          : `End of document · ${clauses.length} clause${clauses.length > 1 ? "s" : ""} · Auto-saved just now`}
      </div>
    </div>
  );
}
