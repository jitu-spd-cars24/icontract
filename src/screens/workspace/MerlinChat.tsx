import * as React from "react";
import { Button } from "@/components/ui/primitives";
import { MerlinMark, RiskDot } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./LeftRail";
import { CONTRACT, INSIGHTS } from "@/lib/data";
import { Send, Sparkles, Check } from "lucide-react";

interface Card {
  kind: "risk" | "missing";
  refId: string;
  title: string;
  detail: string;
  basis: string;
  confidence?: number;
  done?: boolean;
}
interface Msg {
  id: string;
  role: "merlin" | "user";
  text?: string;
  cards?: Card[];
}

let seq = 0;
const uid = () => `m${++seq}`;

interface IntakeQ {
  id: string;
  ask: string;
  ack: string;
  chips: string[];
  apply: { id: string; value: string }[];
}
const INTAKE: IntakeQ[] = [
  {
    id: "method",
    ask: "Would you like to start from a governed template, or build from scratch?",
    ack: "Great — I'll base this on the recommended India template and adapt it.",
    chips: ["Use a recommended template", "Build from scratch"],
    apply: [],
  },
  {
    id: "kind",
    ask: "What kind of agreement are you creating?",
    ack: "A Purchase Agreement — good choice, it exercises almost every clause type.",
    chips: ["Purchase Agreement", "NDA", "Master Services Agreement", "Service Agreement"],
    apply: [{ id: "contractType", value: "Procurement / Purchase Agreement" }],
  },
  {
    id: "supplier",
    ask: "Who's the supplier or counterparty?",
    ack: "Got it — I found ABC Manufacturing in your supplier master (2 prior contracts).",
    chips: ["ABC Manufacturing Pvt. Ltd.", "Cloudspring Technologies", "Someone else"],
    apply: [{ id: "supplierName", value: "ABC Manufacturing Pvt. Ltd." }, { id: "supplierId", value: "SUP-004471" }],
  },
  {
    id: "value",
    ask: "Rough contract value and region?",
    ack: "Noted — ₹2 Cr, India, Manufacturing.",
    chips: ["₹2 Cr · India", "₹85 L · India", "Not sure yet"],
    apply: [{ id: "value", value: "₹2.00 Cr" }, { id: "region", value: "India" }, { id: "businessUnit", value: "Manufacturing" }],
  },
  {
    id: "dates",
    ask: "Effective date and duration?",
    ack: "Set — 01 Aug 2026, running three years.",
    chips: ["01 Aug 2026 · 3 years", "Today · 1 year", "Decide later"],
    apply: [{ id: "effectiveDate", value: "01 Aug 2026" }, { id: "term", value: "3 years" }, { id: "endDate", value: "31 Jul 2029" }],
  },
  {
    id: "protect",
    ask: "Any special protections this deal needs?",
    ack: "I'll require insurance and a data-privacy (DPA) clause.",
    chips: ["Insurance + Data privacy", "Standard terms only"],
    apply: [{ id: "insurance", value: "Yes" }, { id: "dataPrivacy", value: "Required" }],
  },
];
const SKIP_RE = /not sure|later|someone else|standard terms only|decide|skip/i;

export function MerlinChat({
  sessionKey,
  onOpenApproval,
}: {
  sessionKey: string | number;
  onOpenApproval: () => void;
}) {
  const { isBlank, intakeMode, insights, resolveInsight, insertMissingClause, updateField, generateFromIntake } = useStore();
  const health = useHealth();

  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [phase, setPhase] = React.useState<"intake" | "ready" | "authoring">("authoring");
  const [step, setStep] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  function findingCards(): Card[] {
    const r = insights.filter((i) => !i.resolved && i.type === "risk");
    const m = insights.filter((i) => !i.resolved && i.type === "missing");
    return [
      ...r.map((i) => ({ kind: "risk" as const, refId: i.id, title: i.title, detail: i.detail, basis: i.basis, confidence: i.confidence })),
      ...m.map((i) => ({ kind: "missing" as const, refId: i.id === "i4" ? "m1" : "m2", title: i.title.replace("Missing clause — ", ""), detail: i.detail, basis: i.basis, confidence: i.confidence })),
    ];
  }

  // (Re)initialise the conversation when a new session starts
  React.useEffect(() => {
    setStep(0);
    if (intakeMode) {
      setPhase("intake");
      setMessages([
        { id: uid(), role: "merlin", text: "Let's create this contract together. I'll ask a few quick questions, fill the details into the artifact on the right, then draft the whole thing — no forms." },
        { id: uid(), role: "merlin", text: INTAKE[0].ask },
      ]);
      return;
    }
    setPhase("authoring");
    const cards = findingCards();
    const intro: Msg[] = [
      { id: uid(), role: "merlin", text: isBlank
          ? "Blank canvas — tell me what you're drafting and I'll build it. The contract appears as an artifact on the right."
          : `I've read the ${CONTRACT.type} for ${CONTRACT.supplier}. The full contract is the artifact on the right — here's what I'd look at first.` },
    ];
    if (cards.length) intro.push({ id: uid(), role: "merlin", text: `I found ${cards.filter((c) => c.kind === "risk").length} risks and ${cards.filter((c) => c.kind === "missing").length} missing clauses. Act on any of these right here.`, cards });
    setMessages(intro);
    // eslint-disable-next-line
  }, [sessionKey]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const push = (m: Msg) => setMessages((prev) => [...prev, m]);
  function merlinReply(text: string, cards?: Card[]) {
    setTyping(true);
    window.setTimeout(() => { setTyping(false); push({ id: uid(), role: "merlin", text, cards }); }, 600);
  }

  function handleCard(card: Card) {
    if (card.kind === "risk") { resolveInsight(card.refId, "accept"); merlinReply(`Done — applied the policy-standard fix to “${card.title}” and logged it. Your health score is climbing.`); }
    else { insertMissingClause(card.refId); merlinReply(`Added “${card.title}” — drafted from the standard and flagged for your review. Nothing's final until you approve.`); }
    setMessages((prev) => prev.map((m) => (m.cards ? { ...m, cards: m.cards.map((c) => (c.refId === card.refId ? { ...c, done: true } : c)) } : m)));
  }

  function handleIntakeAnswer(text: string) {
    const q = INTAKE[step];
    if (!q) return;
    if (!SKIP_RE.test(text)) q.apply.forEach((a) => updateField(a.id, a.value));
    let ack = SKIP_RE.test(text) ? "No problem — I'll leave that for now." : q.ack;
    if (q.id === "method" && /scratch/i.test(text)) ack = "Building from scratch — I'll assemble and check clauses as we go.";
    const next = step + 1;
    setStep(next);
    if (next < INTAKE.length) merlinReply(`${ack} ${INTAKE[next].ask}`);
    else { setPhase("ready"); merlinReply(`${ack} That's enough for a strong first draft — I'll pick the template, inject these details, assemble clauses and run a policy check. Ready?`); }
  }

  function doGenerate() {
    setTyping(true);
    window.setTimeout(() => {
      generateFromIntake();
      setTyping(false);
      setPhase("authoring");
      const cards = INSIGHTS.filter((i) => i.type === "risk" || i.type === "missing").map((i) =>
        i.type === "risk"
          ? { kind: "risk" as const, refId: i.id, title: i.title, detail: i.detail, basis: i.basis, confidence: i.confidence }
          : { kind: "missing" as const, refId: i.id === "i4" ? "m1" : "m2", title: i.title.replace("Missing clause — ", ""), detail: i.detail, basis: i.basis, confidence: i.confidence });
      push({ id: uid(), role: "merlin", text: "Done — I generated your Purchase Agreement from the Supplier Agreement (India, FY26) template, injected the details and ran it against policy. The full contract is on the right. Three things need a decision:", cards });
    }, 1200);
  }

  function process(text: string) {
    const t = text.toLowerCase();
    const openRisks = insights.filter((i) => !i.resolved && i.type === "risk");
    const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");
    if (/(fix|resolve).*(all|everything)|clean.*up/.test(t)) { openRisks.forEach((i) => resolveInsight(i.id, "accept")); insertMissingClause("m1"); insertMissingClause("m2"); return merlinReply("On it — applied the standard fix to every open risk and inserted the two missing clauses as drafts. Check the artifact and the health score."); }
    if (/payment|net\s?\d|dso/.test(t)) { const p = openRisks.find((i) => i.clauseId === "c4"); if (p) { resolveInsight(p.id, "accept"); return merlinReply("Switched Payment Terms from Net 90 to the policy-standard Net 45 — your biggest cash-flow exposure, resolved."); } return merlinReply("Payment Terms already follow the policy standard (Net 45)."); }
    if (/indemn/.test(t)) { const p = openRisks.find((i) => i.clauseId === "c7"); if (p) { resolveInsight(p.id, "accept"); return merlinReply("Aligned indemnity to the company standard — uncapped for IP and personal-injury claims."); } return merlinReply("Indemnity already matches the standard."); }
    if (/terminat/.test(t)) { const p = openRisks.find((i) => i.clauseId === "c9"); if (p) { resolveInsight(p.id, "accept"); return merlinReply("Reset Termination to 60-day notice with a 30-day cure period, per the playbook."); } return merlinReply("Termination already follows the standard."); }
    if (/dpa|data|privacy/.test(t)) { if (openMissing.some((i) => i.id === "i4")) { insertMissingClause("m1"); return merlinReply("Added a Data Protection (DPA) clause drafted to the India DPDP Act 2023 — flagged for review."); } return merlinReply("A DPA clause is already in place."); }
    if (/insurance|coverage/.test(t)) { if (openMissing.some((i) => i.id === "i5")) { insertMissingClause("m2"); return merlinReply("Added an Insurance & Coverage clause with the template minimums — flagged for review."); } return merlinReply("Insurance coverage is already handled."); }
    if (/missing/.test(t)) { insertMissingClause("m1"); insertMissingClause("m2"); return merlinReply("Inserted both missing clauses — Data Protection (DPA) and Insurance & Coverage — as drafts for review."); }
    if (/risk|summar|overview|status|what.*wrong/.test(t)) return merlinReply(openRisks.length || openMissing.length ? `Right now: ${openRisks.length} open risks${openRisks.length ? " — " + openRisks.map((i) => i.title.toLowerCase()).join("; ") : ""}. ${openMissing.length} missing clauses. Health ${health.score}/100. Say “fix everything” and I'll handle the routine ones.` : `Clean bill — no open risks or missing clauses. Health ${health.score}/100. You're approval-ready.`);
    if (/approve|submit|sign|route|ready/.test(t)) { onOpenApproval(); return merlinReply(`Opening approval readiness — you're at ${health.score}/100. I'll walk you through the checklist and routing.`); }
    if (/supplier|abc|history/.test(t)) return merlinReply(`${CONTRACT.supplier} is an existing supplier (SUP-004471) with 2 prior contracts. Risk moved Low → Medium last quarter. They accepted Net 45 on both prior deals — which is why the requested Net 90 stood out.`);
    if (/template|metadata|value|term|date/.test(t)) return merlinReply(`Generated from the “Supplier Agreement — India (FY26)” template. Key metadata: ${CONTRACT.value}, ${CONTRACT.region}, effective ${CONTRACT.effectiveDate} for ${CONTRACT.term}. Edit any field in the artifact's Metadata tab.`);
    if (/scaffold|build|create|clause/.test(t)) return merlinReply("Tell me the contract type and I'll scaffold a policy-aligned set of clauses — or say “fix everything” to clean up what's here.");
    if (/hi|hello|hey|thanks|thank/.test(t)) return merlinReply("Anytime. Ask me to fix a clause, explain a risk, add something, or check if you're ready to submit.");
    return merlinReply("I can act on this contract directly. Try: “fix the payment terms”, “add the missing clauses”, “summarise the risks”, or “am I ready to submit?”");
  }

  function send(text: string) {
    const v = text.trim();
    if (!v) return;
    push({ id: uid(), role: "user", text: v });
    setDraft("");
    if (phase === "ready" && /generate|draft|yes|go ahead|do it|ready/i.test(v)) return doGenerate();
    if (phase === "intake") return handleIntakeAnswer(v);
    process(v);
  }

  // Adaptive chips — always suggest what to do next
  const openRisks = insights.filter((i) => !i.resolved && i.type === "risk");
  const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");
  let chips: string[] = [];
  if (phase === "intake") chips = INTAKE[step]?.chips ?? [];
  else if (phase === "ready") chips = ["⚡ Generate the draft", "Add another requirement"];
  else {
    const s: string[] = [];
    if (openRisks.some((i) => i.clauseId === "c4")) s.push("Fix the payment terms");
    if (openMissing.length) s.push("Add the missing clauses");
    if (openRisks.length > 1) s.push("Fix everything");
    s.push("Summarise the risks");
    s.push(health.ready ? "Submit for approval" : "Am I ready to submit?");
    chips = s.slice(0, 4);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {messages.map((m) =>
            m.role === "merlin" ? (
              <div key={m.id} className="mb-6 flex gap-3 animate-in-up">
                <MerlinMark size={28} active={false} />
                <div className="min-w-0 flex-1">
                  {m.text && <div className="text-[15px] leading-relaxed text-foreground">{m.text}</div>}
                  {m.cards && (
                    <div className="mt-3 space-y-2">
                      {m.cards.map((c) => (
                        <div key={c.refId} className="rounded-xl border border-border bg-card p-3">
                          <div className="flex items-center gap-2">
                            <RiskDot risk={c.kind === "risk" ? "high" : "medium"} />
                            <span className="text-sm font-medium">{c.title}</span>
                            {c.confidence && <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{c.confidence}%</span>}
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.detail}</p>
                          <div className="mt-1 text-[11px] text-muted-foreground">Basis: {c.basis}</div>
                          <div className="mt-2.5">
                            {c.done ? (
                              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-success"><Check className="size-3.5" /> {c.kind === "risk" ? "Fixed" : "Added"}</span>
                            ) : (
                              <Button size="sm" variant="merlin" className="h-7" onClick={() => handleCard(c)}><Sparkles className="size-3" /> {c.kind === "risk" ? "Apply fix" : "Draft & add"}</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={m.id} className="mb-6 flex justify-end animate-in-up">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground">{m.text}</div>
              </div>
            )
          )}
          {typing && (
            <div className="mb-6 flex gap-3">
              <MerlinMark size={28} active={false} />
              <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                {[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d * 0.15}s` }} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {chips.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-merlin-border hover:text-foreground">{s}</button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); } }}
              rows={1}
              placeholder="Ask Merlin to draft, fix, explain, or check readiness…"
              className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground scrollbar-thin"
            />
            <Button size="icon" onClick={() => send(draft)} disabled={!draft.trim()} aria-label="Send"><Send className="size-4" /></Button>
          </div>
          <div className="mt-1.5 text-center text-[11px] text-muted-foreground">Merlin acts on your contract — it never changes legal terms without your confirmation.</div>
        </div>
      </div>
    </div>
  );
}
