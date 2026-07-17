import * as React from "react";
import { TopBar } from "@/components/TopBar";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { MerlinMark, SectionLabel } from "@/components/shared";
import { useStore } from "@/store";
import { TEMPLATES } from "@/lib/data";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  FileText,
  Scale,
  Layers,
  Sparkles,
} from "lucide-react";

export function TemplateSelection() {
  const { go } = useStore();
  const [selected, setSelected] = React.useState(TEMPLATES[0].id);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-[1080px] px-6 py-8">
        <button
          onClick={() => go("metadata")}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Metadata
        </button>

        <SectionLabel>New contract · Step 4 of 5</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Choose a template
        </h1>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-merlin-border bg-merlin-soft/40 px-3 py-2 text-sm">
          <MerlinMark size={24} />
          <span className="text-muted-foreground">
            Ranked against your metadata: India · Manufacturing · Purchase Agreement ·
            DPA + insurance required.
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {TEMPLATES.map((t) => {
            const active = selected === t.id;
            return (
              <Card
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`cursor-pointer p-4 transition-all ${
                  active
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* score ring */}
                  <ScoreRing score={t.score} recommended={t.status === "recommended"} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{t.name}</h3>
                      {t.status === "recommended" && (
                        <Badge tone="merlin">
                          <Sparkles /> Best match
                        </Badge>
                      )}
                      {t.status === "warning" && (
                        <Badge tone="med">
                          <AlertTriangle /> Needs localisation
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Scale className="size-3.5" /> {t.jurisdiction}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3.5" /> {t.clauses} clauses
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3.5" /> {t.version}
                      </span>
                    </div>

                    {/* why */}
                    <div className="mt-3 space-y-1">
                      {t.why.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                          <span className="text-muted-foreground">{w}</span>
                        </div>
                      ))}
                    </div>

                    {t.warning && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-risk-med-soft px-2.5 py-1.5 text-[11px] font-medium text-risk-med">
                        <AlertTriangle className="size-3.5" /> {t.warning}
                      </div>
                    )}
                  </div>

                  <div
                    className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {active && <Check className="size-3" />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-border p-4">
          <p className="text-xs text-muted-foreground">
            Templates are governed by Legal. Expired or draft templates are hidden from this list.
          </p>
          <Button size="lg" onClick={() => go("generating")}>
            Generate draft <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

function ScoreRing({ score, recommended }: { score: number; recommended: boolean }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  const color = recommended ? "var(--merlin)" : score >= 88 ? "var(--primary)" : "var(--risk-med)";
  return (
    <div className="relative grid size-14 shrink-0 place-items-center">
      <svg className="size-14 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--muted)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums">{score}</span>
    </div>
  );
}
