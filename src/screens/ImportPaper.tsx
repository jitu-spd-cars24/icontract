import * as React from "react";
import { TopBar } from "@/components/TopBar";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { MerlinMark, SectionLabel, RiskDot } from "@/components/shared";
import { useStore } from "@/store";
import { CLAUSES } from "@/lib/data";
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  FileText,
  Check,
  Loader2,
  Sparkles,
  ShieldAlert,
  X,
} from "lucide-react";

type Phase = "drop" | "analyzing" | "review";

const ANALYSIS_STEPS = [
  "Uploading ABC_Manufacturing_supplier_paper.pdf",
  "Running OCR & extracting text (14 pages)",
  "Detecting parties, dates & commercial terms",
  "Mapping 11 clauses to the iContract clause library",
  "Comparing against company playbook & policy",
  "Flagging deviations and missing clauses",
];

/* what Merlin "extracted" from the paper */
const EXTRACTED = [
  { label: "Supplier", value: "ABC Manufacturing Pvt. Ltd." },
  { label: "Contract value", value: "₹2.00 Cr" },
  { label: "Payment terms", value: "Net 90" },
  { label: "Term", value: "3 years from 01 Aug 2026" },
  { label: "Governing law", value: "Not stated — flagged" },
];

export function ImportPaper() {
  const { go, startDraft } = useStore();
  const [phase, setPhase] = React.useState<Phase>("drop");
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (phase !== "analyzing") return;
    if (active >= ANALYSIS_STEPS.length) {
      const t = setTimeout(() => setPhase("review"), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), 700);
    return () => clearTimeout(t);
  }, [phase, active]);

  const deviations = CLAUSES.filter((c) => c.nonStandard).length;
  const modified = CLAUSES.filter((c) => c.status === "modified").length;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-[880px] px-6 py-10">
        <button
          onClick={() => go("starting-point")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Starting point
        </button>

        <SectionLabel>New contract · Import third-party paper</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Import the supplier's contract
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Merlin reads the document, maps it to your clause library, and flags every deviation
          before you start editing. Nothing is changed without your review.
        </p>

        {/* DROP */}
        {phase === "drop" && (
          <div className="mt-8 animate-in-fade">
            <button
              onClick={() => {
                setActive(0);
                setPhase("analyzing");
              }}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card py-16 transition-colors hover:border-primary/50 hover:bg-accent/30"
            >
              <div className="grid size-14 place-items-center rounded-full bg-accent text-primary">
                <UploadCloud className="size-7" />
              </div>
              <div className="text-sm font-medium">
                Drop the supplier paper here, or click to browse
              </div>
              <div className="text-xs text-muted-foreground">
                PDF, DOCX or scanned image · up to 300 pages · OCR ready
              </div>
              <Badge tone="merlin" className="mt-1">
                <Sparkles /> Merlin will mark it up automatically
              </Badge>
            </button>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border p-4">
              <div className="grid size-9 place-items-center rounded-lg bg-accent text-primary">
                <FileText className="size-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Recently received (from Supplier Portal)</div>
                <div className="text-xs text-muted-foreground">
                  ABC_Manufacturing_supplier_paper.pdf · 1.2 MB · shared 1h ago
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setActive(0);
                  setPhase("analyzing");
                }}
              >
                Use this file
              </Button>
            </div>
          </div>
        )}

        {/* ANALYZING */}
        {phase === "analyzing" && (
          <Card className="mt-8 p-6 animate-in-up">
            <div className="flex items-center gap-3">
              <MerlinMark size={36} />
              <div>
                <div className="text-sm font-semibold">Merlin is reading the document…</div>
                <div className="text-[11px] text-muted-foreground">
                  ABC_Manufacturing_supplier_paper.pdf
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-1">
              {ANALYSIS_STEPS.map((s, i) => {
                const state = i < active ? "done" : i === active ? "active" : "todo";
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      state === "active"
                        ? "bg-merlin-soft/50"
                        : state === "todo"
                        ? "text-muted-foreground/50"
                        : ""
                    }`}
                  >
                    <span className="grid size-5 shrink-0 place-items-center">
                      {state === "done" ? (
                        <span className="grid size-5 place-items-center rounded-full bg-success text-success-foreground">
                          <Check className="size-3" />
                        </span>
                      ) : state === "active" ? (
                        <Loader2 className="size-4 animate-spin text-merlin" />
                      ) : (
                        <span className="size-2 rounded-full bg-current opacity-40" />
                      )}
                    </span>
                    {s}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* REVIEW */}
        {phase === "review" && (
          <div className="mt-8 space-y-5 animate-in-up">
            <Card className="border-merlin-border">
              <div className="flex items-start gap-3 border-b border-border bg-merlin-soft/40 p-4">
                <MerlinMark size={32} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Mark-up complete</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    I mapped <strong className="text-foreground">11 clauses</strong>, extracted the
                    metadata, and found <strong className="text-foreground">{deviations} deviations</strong>{" "}
                    and <strong className="text-foreground">2 missing clauses</strong> against your playbook.
                  </p>
                </div>
              </div>

              {/* extracted metadata */}
              <div className="grid gap-px bg-border sm:grid-cols-2">
                {EXTRACTED.map((e) => (
                  <div key={e.label} className="bg-card p-3">
                    <div className="text-[11px] text-muted-foreground">{e.label}</div>
                    <div
                      className={`mt-0.5 text-sm font-medium ${
                        e.value.includes("flagged") ? "text-risk-med" : ""
                      }`}
                    >
                      {e.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* clause mapping */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <SectionLabel>Clause mapping</SectionLabel>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <RiskDot risk="high" /> {deviations} deviation
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <RiskDot risk="medium" /> {modified} modified
                  </span>
                </div>
              </div>
              <Card className="divide-y divide-border">
                {CLAUSES.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {c.number}
                    </span>
                    <span className="flex-1 truncate text-sm">{c.title}</span>
                    {c.nonStandard ? (
                      <Badge tone="high">
                        <ShieldAlert /> Deviation
                      </Badge>
                    ) : c.status === "modified" ? (
                      <Badge tone="med">Modified</Badge>
                    ) : (
                      <Badge tone="low">
                        <Check /> Matches standard
                      </Badge>
                    )}
                  </div>
                ))}
              </Card>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-dashed border-border p-4">
              <p className="text-xs text-muted-foreground">
                All deviations are surfaced as tracked redlines in the workspace — accept, reject,
                or ask Merlin to counter.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPhase("drop")}>
                  <X className="size-4" /> Replace file
                </Button>
                <Button size="lg" onClick={() => startDraft()}>
                  Open marked-up draft <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
