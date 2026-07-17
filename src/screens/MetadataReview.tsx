import * as React from "react";
import { TopBar } from "@/components/TopBar";
import { Card, Button, Badge, Input } from "@/components/ui/primitives";
import {
  MerlinMark,
  SectionLabel,
  ConfidencePill,
} from "@/components/shared";
import { useStore } from "@/store";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Wand2,
  AlertTriangle,
  Users,
  Check,
} from "lucide-react";
import type { MetadataField } from "@/lib/types";

const GROUP_ORDER = [
  "Supplier",
  "Commercial",
  "Financial",
  "Legal",
  "Renewal",
  "Compliance",
] as const;

interface Suggestion {
  id: string;
  icon: typeof Wand2;
  title: string;
  detail: string;
  fieldId?: string;
  fix?: { value: string };
  cta: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    icon: AlertTriangle,
    title: "Inconsistent currency",
    detail: "Currency is USD but value and region are India/INR. Set to INR?",
    fieldId: "currency",
    fix: { value: "INR" },
    cta: "Set to INR",
  },
  {
    id: "s2",
    icon: Wand2,
    title: "Missing jurisdiction",
    detail: "No governing law detected. India region → Maharashtra, India.",
    fieldId: "jurisdiction",
    fix: { value: "India · Maharashtra" },
    cta: "Apply suggestion",
  },
  {
    id: "s3",
    icon: Users,
    title: "Supplier already exists",
    detail: "ABC Manufacturing matches SUP-004471 with 2 active contracts. Link to master record.",
    cta: "Linked",
  },
  {
    id: "s4",
    icon: AlertTriangle,
    title: "Missing authorised signer",
    detail: "Required for approval routing. Assign a signer from your org.",
    fieldId: "signer",
    fix: { value: "Vikram Shah (VP, Manufacturing)" },
    cta: "Assign Vikram Shah",
  },
];

export function MetadataReview() {
  const { go, metadata, updateField } = useStore();
  const [applied, setApplied] = React.useState<Set<string>>(new Set(["s3"]));

  const counts = React.useMemo(() => {
    const c = { auto: 0, manual: 0, review: 0, missing: 0 };
    metadata.forEach((f) => c[f.confidence]++);
    return c;
  }, [metadata]);

  const requiredMissing = metadata.filter(
    (f) => f.required && (f.confidence === "missing" || !f.value)
  ).length;

  function applySuggestion(s: Suggestion) {
    if (s.fieldId && s.fix) updateField(s.fieldId, s.fix.value);
    setApplied((prev) => new Set([...prev, s.id]));
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <button
          onClick={() => go("intake")}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Intake
        </button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>New contract · Step 3 of 5</SectionLabel>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Review auto-filled metadata
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Merlin filled what it could infer. Confirm, fix flagged items, and complete anything missing.
            </p>
          </div>
          <Button size="lg" onClick={() => go("template")}>
            Continue to templates <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left — grouped metadata */}
          <div className="space-y-5">
            {GROUP_ORDER.map((group) => {
              const fields = metadata.filter((f) => f.group === group);
              return (
                <Card key={group} className="overflow-hidden">
                  <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                    <SectionLabel>{group}</SectionLabel>
                  </div>
                  <div className="divide-y divide-border">
                    {fields.map((f) => (
                      <FieldRow key={f.id} field={f} onChange={(v) => updateField(f.id, v)} />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Right — confidence + suggestions */}
          <aside className="space-y-4">
            <Card className="sticky top-[72px]">
              <div className="border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Confidence overview</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  { k: "auto", label: "Auto-imported", tone: "var(--merlin)" },
                  { k: "manual", label: "Manual", tone: "var(--muted-foreground)" },
                  { k: "review", label: "Needs review", tone: "var(--risk-med)" },
                  { k: "missing", label: "Missing", tone: "var(--risk-high)" },
                ].map((x) => (
                  <div key={x.k} className="bg-card p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: x.tone }} />
                      <span className="text-2xl font-semibold tabular-nums">
                        {counts[x.k as keyof typeof counts]}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{x.label}</div>
                  </div>
                ))}
              </div>
              {requiredMissing > 0 ? (
                <div className="flex items-center gap-2 border-t border-border bg-risk-med-soft/60 px-4 py-2.5 text-xs text-risk-med">
                  <AlertTriangle className="size-3.5" />
                  {requiredMissing} required field{requiredMissing > 1 ? "s" : ""} still need attention
                </div>
              ) : (
                <div className="flex items-center gap-2 border-t border-border bg-risk-low-soft/60 px-4 py-2.5 text-xs text-success">
                  <Check className="size-3.5" /> All required fields complete
                </div>
              )}
            </Card>

            {/* Merlin suggestions */}
            <Card className="overflow-hidden border-merlin-border">
              <div className="flex items-center gap-2 border-b border-border bg-merlin-soft/40 px-4 py-3">
                <MerlinMark size={26} />
                <span className="text-sm font-semibold">Merlin found {SUGGESTIONS.length} things</span>
              </div>
              <div className="divide-y divide-border">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  const isApplied = applied.has(s.id);
                  return (
                    <div key={s.id} className="p-3">
                      <div className="flex items-start gap-2.5">
                        <Icon className="mt-0.5 size-4 shrink-0 text-merlin" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold">{s.title}</div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                            {s.detail}
                          </p>
                          <div className="mt-2">
                            {isApplied ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                                <Check className="size-3" /> {s.cta.startsWith("Link") ? "Linked" : "Applied"}
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="merlin"
                                className="h-7"
                                onClick={() => applySuggestion(s)}
                              >
                                <Sparkles className="size-3" /> {s.cta}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function FieldRow({
  field,
  onChange,
}: {
  field: MetadataField;
  onChange: (v: string) => void;
}) {
  const flagged = field.confidence === "missing" || field.confidence === "review";
  return (
    <div
      className={`px-4 py-3 ${
        flagged ? "bg-risk-med-soft/25" : ""
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <ConfidencePill c={field.confidence} />
      </div>
      <Input
        value={field.value}
        placeholder={field.confidence === "missing" ? "Required — not filled" : ""}
        onChange={(e) => onChange(e.target.value)}
        className={
          field.confidence === "missing"
            ? "border-risk-high/50 bg-card"
            : field.confidence === "review"
            ? "border-risk-med/50 bg-card"
            : ""
        }
      />
      {field.note && flagged && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Sparkles className="mt-0.5 size-3 shrink-0 text-merlin" />
          {field.note}
        </p>
      )}
      {field.source && !flagged && (
        <p className="mt-1 text-[10px] text-muted-foreground/70">Source: {field.source}</p>
      )}
    </div>
  );
}
