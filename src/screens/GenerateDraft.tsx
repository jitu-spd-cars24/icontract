import * as React from "react";
import { MerlinMark } from "@/components/shared";
import { Button } from "@/components/ui/primitives";
import { useStore } from "@/store";
import { GENERATION_STEPS, CONTRACT } from "@/lib/data";
import { Check, Loader2, Sparkles } from "lucide-react";

export function GenerateDraft() {
  const { startDraft } = useStore();
  const [active, setActive] = React.useState(0);
  const [complete, setComplete] = React.useState(false);

  React.useEffect(() => {
    if (active >= GENERATION_STEPS.length) {
      const t = setTimeout(() => setComplete(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), 800);
    return () => clearTimeout(t);
  }, [active]);

  React.useEffect(() => {
    if (!complete) return;
    const t = setTimeout(() => startDraft(), 1400);
    return () => clearTimeout(t);
  }, [complete, startDraft]);

  const pct = Math.min(100, Math.round((active / GENERATION_STEPS.length) * 100));

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <MerlinMark size={64} />
            {!complete && (
              <span className="absolute -right-1 -top-1 flex size-5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-merlin opacity-40" />
              </span>
            )}
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            {complete ? "Your draft is ready" : "Merlin is drafting your contract"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {complete
              ? CONTRACT.title
              : "Assembling from Supplier Agreement — India (FY26)"}
          </p>
        </div>

        {/* progress bar */}
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-merlin transition-all duration-500 ease-out"
            style={{ width: `${complete ? 100 : pct}%` }}
          />
        </div>

        {/* steps */}
        <div className="mt-6 space-y-1">
          {GENERATION_STEPS.map((s, i) => {
            const state = i < active ? "done" : i === active ? "active" : "todo";
            return (
              <div
                key={s}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  state === "active"
                    ? "bg-merlin-soft/50 text-foreground"
                    : state === "done"
                    ? "text-foreground"
                    : "text-muted-foreground/50"
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

        {complete && (
          <div className="mt-6 animate-in-up rounded-xl border border-merlin-border bg-merlin-soft/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-merlin" />
              Merlin flagged 3 risks and 2 missing clauses to review.
            </div>
            <Button className="mt-3 w-full" onClick={() => startDraft()}>
              Open workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
