import * as React from "react";
import { TopBar } from "@/components/TopBar";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { MerlinMark, SectionLabel } from "@/components/shared";
import { useStore } from "@/store";
import { INTAKE_SCRIPT, METADATA } from "@/lib/data";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Check,
  Sparkles,
  AlertCircle,
  CornerDownLeft,
  Upload,
  LayoutTemplate,
  ChevronDown,
} from "lucide-react";

interface Turn {
  role: "merlin" | "user";
  text: string;
  missing?: boolean;
}

export function MerlinIntake() {
  const { go } = useStore();
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [typing, setTyping] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [filled, setFilled] = React.useState<Set<string>>(new Set());
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const total = INTAKE_SCRIPT.length;
  const current = INTAKE_SCRIPT[idx];
  const done = idx >= total;

  // Merlin asks the next question after a short "typing" beat
  React.useEffect(() => {
    if (done) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setTurns((prev) => [...prev, { role: "merlin", text: current.question }]);
    }, 650);
    return () => clearTimeout(t);
  }, [idx, done]); // eslint-disable-line

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, typing]);

  function answer(text: string, missing = false) {
    setTurns((prev) => [...prev, { role: "user", text: missing ? "Skip for now" : text, missing }]);
    if (current.fills && !missing) {
      setFilled((prev) => new Set([...prev, ...current.fills!]));
    }
    setDraft("");
    setIdx((i) => i + 1);
  }

  const progress = Math.round((Math.min(idx, total) / total) * 100);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto grid max-w-[1180px] gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        {/* Conversation */}
        <div>
          <button
            onClick={() => go("starting-point")}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Starting point
          </button>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SectionLabel>New contract · Step 2 of 5 · Merlin Intake</SectionLabel>
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {Math.min(idx, total)}/{total}
            </span>
          </div>

          <Card className="flex h-[560px] flex-col overflow-hidden">
            {/* header */}
            <div className="flex items-center gap-3 border-b border-border bg-merlin-soft/40 px-4 py-3">
              <MerlinMark size={32} />
              <div>
                <div className="text-sm font-semibold">Merlin Intake</div>
                <div className="text-[11px] text-muted-foreground">
                  Answering fills your metadata automatically — no duplicate entry.
                </div>
              </div>
              <Badge tone="merlin" className="ml-auto">
                <Sparkles /> Live
              </Badge>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
              <div className="flex gap-2.5">
                <MerlinMark size={26} active={false} />
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm">
                  Hi Jitendra — I'll set up your contract. I'll ask a few quick
                  questions and fill everything in as we go. Ready when you are.
                </div>
              </div>

              {turns.map((t, i) =>
                t.role === "merlin" ? (
                  <div key={i} className="flex gap-2.5 animate-in-up">
                    <MerlinMark size={26} active={false} />
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm">
                      {t.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end animate-in-up">
                    <div
                      className={`max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm ${
                        t.missing
                          ? "border border-dashed border-risk-med bg-risk-med-soft text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {t.missing && (
                        <span className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-risk-med">
                          <AlertCircle className="size-3" /> Marked missing — won't block progress
                        </span>
                      )}
                      {t.text}
                    </div>
                  </div>
                )
              )}

              {typing && (
                <div className="flex gap-2.5">
                  <MerlinMark size={26} active={false} />
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}

              {done && (
                <div className="rounded-xl border border-risk-low/40 bg-risk-low-soft p-4 animate-in-up">
                  <div className="flex items-center gap-2 text-sm font-semibold text-success">
                    <Check className="size-4" /> Intake complete
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    I've filled <strong className="text-foreground">{filled.size} fields</strong> and
                    marked <strong className="text-foreground">1 as missing</strong> (authorised
                    signer). Let's review the metadata before picking a template.
                  </p>
                  <Button className="mt-3" onClick={() => go("metadata")}>
                    Review metadata <ArrowRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* input / suggestions */}
            {!done && !typing && current && (
              <div className="border-t border-border/40 bg-gradient-to-t from-background via-background/90 to-transparent p-3 pt-8">
                {current.missing ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => answer("", true)}
                      className="press inline-flex items-center gap-1.5 rounded-full border border-risk-med/30 bg-risk-med-soft px-3 py-1.5 text-xs font-medium text-risk-med transition-colors hover:bg-risk-med hover:text-white"
                    >
                      <AlertCircle className="size-3" /> Skip for now
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => answer(current.answer)}
                      className="press inline-flex items-center gap-1.5 rounded-full border border-merlin-border bg-merlin-soft px-3 py-1.5 text-xs font-medium text-merlin transition-colors hover:bg-merlin hover:text-merlin-foreground"
                    >
                      <Sparkles className="size-3" />
                      {current.answer}
                    </button>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                      <CornerDownLeft className="size-3" /> or type your own
                    </span>
                  </div>
                )}
                <div className="rounded-[24px] border border-border/80 bg-card/95 p-3 shadow-[0_18px_50px_rgba(15,15,20,0.12)] transition-shadow focus-within:border-merlin-border focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--merlin)_13%,transparent)]">
                  <div className="flex items-start gap-3 px-2 pt-2">
                    <Sparkles className="mt-1 size-4 shrink-0 text-merlin" />
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={current.missing ? "Type the signer's name..." : "Type your answer, or describe the deal in plain language..."}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && draft) {
                          e.preventDefault();
                          answer(draft);
                        }
                      }}
                      rows={2}
                      className="max-h-28 min-h-[52px] flex-1 resize-none bg-transparent py-0.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70 scrollbar-thin"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                    <button className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                      <Upload className="size-3.5" /> Attach
                    </button>
                    <button className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                      <LayoutTemplate className="size-3.5" /> Template <ChevronDown className="size-3.5 opacity-60" />
                    </button>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="hidden text-[13px] text-muted-foreground sm:inline">Merlin drafts &amp; de-risks</span>
                      <Button size="icon" disabled={!draft} onClick={() => answer(draft)} aria-label="Send answer" className="press size-11 rounded-2xl shadow-md shadow-primary/15">
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Live metadata panel */}
        <aside className="lg:pt-[52px]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Metadata forming</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {filled.size} filled
              </span>
            </div>
            <div className="p-2">
              <div className="mb-1 px-2">
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-merlin transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="max-h-[440px] space-y-0.5 overflow-y-auto p-1 scrollbar-thin">
                {METADATA.filter((f) => f.source === "Merlin intake" || f.confidence === "missing")
                  .slice(0, 14)
                  .map((f) => {
                    const isFilled = filled.has(f.id);
                    return (
                      <div
                        key={f.id}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                          isFilled ? "bg-accent/50" : "opacity-45"
                        }`}
                      >
                        <span
                          className={`grid size-4 place-items-center rounded-full border ${
                            isFilled
                              ? "border-merlin bg-merlin text-merlin-foreground"
                              : "border-border"
                          }`}
                        >
                          {isFilled && <Check className="size-2.5" />}
                        </span>
                        <span className="flex-1 text-muted-foreground">{f.label}</span>
                        {isFilled && (
                          <span className="max-w-[45%] truncate font-medium">{f.value}</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>
          <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
            Merlin never overwrites a field you've typed. Anything it can't infer is marked
            <span className="mx-1 rounded bg-risk-med-soft px-1 py-0.5 font-medium text-risk-med">
              Missing
            </span>
            rather than blocking you.
          </p>
        </aside>
      </main>
    </div>
  );
}
