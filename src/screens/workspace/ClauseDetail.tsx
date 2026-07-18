import * as React from "react";
import { Button, Badge } from "@/components/ui/primitives";
import { MerlinMark, ClauseStatusBadge, RiskBadge, ConfidenceMeter } from "@/components/shared";
import { useStore } from "@/store";
import { STANDARD_FIX } from "@/lib/data";
import {
  X, ShieldAlert, Check, GitCompare, Minus, Plus, History, User, Repeat2, ChevronRight, Sparkles,
} from "lucide-react";

export function ClauseDetail({ clauseId, onClose }: { clauseId: string; onClose: () => void }) {
  const { clauses, insights, resolveInsight, applyVariant, toast } = useStore();
  const clause = clauses.find((c) => c.id === clauseId);
  const insight = insights.find((i) => i.clauseId === clauseId && !i.resolved && i.type === "risk");
  const [showCompare, setShowCompare] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!clause) return null;

  const standardBody =
    clause.variants?.find((v) => v.kind === "standard")?.body ?? STANDARD_FIX[clause.id];

  return (
    <div className="fixed inset-0 z-[92] flex justify-end bg-foreground/30 backdrop-blur-[2px] animate-in-fade" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[440px] flex-col border-l border-border bg-card shadow-2xl"
        style={{ animation: "sheetIn .32s var(--ease-out) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] tracking-wide text-muted-foreground">Clause §{clause.number}</div>
            <h2 className="mt-1 text-[19px] font-semibold leading-tight tracking-[-0.01em]">{clause.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <ClauseStatusBadge status={clause.status} />
              <RiskBadge risk={clause.risk} />
              {clause.nonStandard && <Badge tone="high">Non-standard</Badge>}
            </div>
          </div>
          <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Close"><X className="size-4" /></button>
        </div>

        {/* body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 scrollbar-thin">
          {/* clause text */}
          <section>
            <SectionLabel>Clause text</SectionLabel>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-foreground/90">
              {clause.body || <span className="italic text-muted-foreground">This clause is empty.</span>}
            </p>
          </section>

          {/* Merlin flag */}
          {insight && (
            <section className="rounded-2xl border border-border/70 bg-merlin-soft/30 p-4">
              <div className="flex items-center gap-2">
                <MerlinMark size={24} />
                <span className="text-[13px] font-semibold">Why Merlin flagged this</span>
                {insight.confidence != null && <span className="ml-auto"><ConfidenceMeter value={insight.confidence} /></span>}
              </div>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{insight.detail}</p>
              <p className="mt-2 text-[11.5px] text-muted-foreground/75">Basis · {insight.basis}</p>

              {standardBody && (
                <>
                  <button
                    onClick={() => setShowCompare((v) => !v)}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline"
                  >
                    <GitCompare className="size-3.5" /> {showCompare ? "Hide comparison" : "Compare with standard"}
                    <ChevronRight className={`size-3.5 transition-transform ${showCompare ? "rotate-90" : ""}`} />
                  </button>
                  {showCompare && (
                    <div className="mt-2.5 space-y-2 animate-in-up">
                      <div className="rounded-xl bg-risk-high-soft/50 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-risk-high"><Minus className="size-3" /> Current</div>
                        <p className="text-[13px] leading-relaxed text-muted-foreground">{clause.body}</p>
                      </div>
                      <div className="rounded-xl bg-risk-low-soft/60 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-success"><Plus className="size-3" /> Policy standard</div>
                        <p className="text-[13px] leading-relaxed text-foreground">{standardBody}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <Button
                className="mt-3.5 w-full rounded-xl"
                onClick={() => {
                  resolveInsight(insight.id, "accept");
                  toast({ title: "Fix applied", detail: `${clause.title} → policy standard`, tone: "success" });
                }}
              >
                <Check className="size-4" /> Apply the standard fix
              </Button>
            </section>
          )}

          {!insight && clause.risk === "none" && (
            <div className="flex items-center gap-2 rounded-xl bg-risk-low-soft/50 px-3 py-2.5 text-[13px] text-success">
              <Check className="size-4" /> This clause matches the standard — no action needed.
            </div>
          )}

          {/* variants */}
          {clause.variants && clause.variants.length > 0 && (
            <section>
              <SectionLabel>Clause variants</SectionLabel>
              <div className="mt-2 space-y-1.5">
                {clause.variants.map((v) => {
                  const active = clause.activeVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => applyVariant(clause.id, v.id)}
                      className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${active ? "border-primary/50 bg-accent/60" : "border-border/70 hover:bg-accent/40"}`}
                    >
                      <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                        {active && <Check className="size-2.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-medium">{v.name}</span>
                          <Badge tone={v.kind === "standard" ? "low" : v.kind === "fallback" ? "med" : "high"}>{v.kind}</Badge>
                        </span>
                        <span className="mt-0.5 block text-[12px] text-muted-foreground">{v.note}</span>
                      </span>
                      {!active && <Repeat2 className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* meta */}
          <section className="space-y-2.5 border-t border-border/60 pt-4">
            {clause.owner && (
              <MetaRow icon={<User className="size-3.5" />} label="Owner">{clause.owner}</MetaRow>
            )}
            <MetaRow icon={<History className="size-3.5" />} label="Versions">
              {clause.versions?.length ?? 1} version{(clause.versions?.length ?? 1) > 1 ? "s" : ""}
            </MetaRow>
            {clause.aiGenerated && (
              <MetaRow icon={<Sparkles className="size-3.5" />} label="Source">Drafted by Merlin · pending review</MetaRow>
            )}
          </section>

          {/* version history */}
          {clause.versions && clause.versions.length > 0 && (
            <section>
              <SectionLabel>History</SectionLabel>
              <div className="mt-2 space-y-2">
                {[...clause.versions].reverse().map((v, i) => (
                  <div key={v.id} className="flex gap-2.5">
                    <div className="mt-1 flex flex-col items-center">
                      <span className={`size-2 rounded-full ${i === 0 ? "bg-primary" : "bg-border"}`} />
                      {i < clause.versions!.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-1">
                      <div className="text-[12.5px] font-medium">{v.label}</div>
                      <div className="text-[11px] text-muted-foreground">{v.author} · {v.timestamp} — {v.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* footer */}
        <div className="border-t border-border px-5 py-3">
          <Button variant="outline" className="w-full" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{children}</div>;
}
function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-20 text-muted-foreground">{label}</span>
      <span className="flex-1 font-medium">{children}</span>
    </div>
  );
}
