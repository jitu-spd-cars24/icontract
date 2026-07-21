import * as React from "react";
import { Button } from "@/components/ui/primitives";
import { MerlinMark, ConfidenceMeter } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./LeftRail";
import { CONTRACT, INSIGHTS, STANDARD_FIX, APPROVERS } from "@/lib/data";
import { Send, Sparkles, Check, Paperclip, FileText, Image as ImageIcon, X, ShieldAlert, ShieldCheck, FilePlus2, GitCompare, Minus, Plus, LayoutTemplate, ChevronDown, ArrowRight, Clock } from "lucide-react";

interface Card {
  kind: "risk" | "missing";
  refId: string;
  title: string;
  detail: string;
  basis: string;
  confidence?: number;
  done?: boolean;
}
interface Attachment {
  name: string;
  kind: "image" | "pdf" | "doc" | "file";
  size: string;
}
interface Diff {
  title: string;
  before: string;
  after: string;
}
interface Msg {
  id: string;
  role: "merlin" | "user";
  text?: string;
  cards?: Card[];
  files?: Attachment[];
  diff?: Diff;
  confirm?: "approval" | "sent";
  streaming?: boolean;
}

function fileKind(name: string, type: string): Attachment["kind"] {
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(name)) return "image";
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (/\.(docx?|rtf|txt)$/i.test(name)) return "doc";
  return "file";
}
function humanSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  sessionStatus = "Draft",
  onOpenApproval,
}: {
  sessionKey: string | number;
  sessionStatus?: "Draft" | "In Review" | "In Approval" | "Signed";
  onOpenApproval: () => void;
}) {
  const { isBlank, intakeMode, insights, clauses, resolveInsight, insertMissingClause, updateField, generateFromIntake, submitted } = useStore();
  const health = useHealth();

  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [phase, setPhase] = React.useState<"intake" | "ready" | "authoring">("authoring");
  const [step, setStep] = React.useState(0);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const askedApprovalRef = React.useRef(false);
  const sentNotifiedRef = React.useRef(false);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setAttachments((prev) => [
        ...prev,
        ...files.map((f) => ({ name: f.name, kind: fileKind(f.name, f.type), size: humanSize(f.size) })),
      ]);
    }
    e.target.value = "";
  }
  function ackFiles(files: Attachment[]): string {
    const hasContract = files.some((f) => f.kind === "pdf" || f.kind === "doc");
    const hasImage = files.some((f) => f.kind === "image");
    const first = files[0]?.name;
    if (hasContract) return `Thanks — I've read ${files.length > 1 ? `${files.length} files` : first}, extracted the parties, dates and commercial terms into the artifact, and mapped the clauses. Want me to flag deviations against your playbook?`;
    if (hasImage) return `Got ${files.length > 1 ? `${files.length} images` : first}. I ran OCR and pulled the text — I can attach it as an exhibit or extract terms from it. Which would you like?`;
    return `Attached ${files.length > 1 ? `${files.length} files` : first} to this contract. I'll reference them where relevant.`;
  }

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
    askedApprovalRef.current = false;
    // Baseline to current submit state so opening an already-routed contract
    // doesn't replay the "sent" message.
    sentNotifiedRef.current = submitted;
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
    const riskCount = cards.filter((c) => c.kind === "risk").length;
    const missingCount = cards.filter((c) => c.kind === "missing").length;
    const intro: Msg[] = [
      {
        id: uid(),
        role: "merlin",
        text: isBlank
          ? "Blank canvas — tell me what you're drafting and I'll build it. The contract appears as an artifact on the right."
          : sessionStatus === "Signed"
          ? `This ${CONTRACT.type} for ${CONTRACT.supplier} is already signed. I can summarise the executed terms, pull out obligations, or recap the key negotiated changes.`
          : sessionStatus === "In Approval"
          ? `This ${CONTRACT.type} for ${CONTRACT.supplier} is already in approval. I can summarise what was submitted, explain the readiness, or help with pending approver questions.`
          : sessionStatus === "In Review"
          ? `This ${CONTRACT.type} for ${CONTRACT.supplier} is in review. I’d focus on the open commercial edits, the remaining risk items, and what still blocks approval readiness.`
          : `I've read the ${CONTRACT.type} for ${CONTRACT.supplier}. The full contract is the artifact on the right — here's what I'd look at first.`,
      },
    ];
    if (cards.length && sessionStatus !== "Signed") {
      intro.push({ id: uid(), role: "merlin", text: `I found ${riskCount} risks and ${missingCount} missing clauses. Act on any of these right here.`, cards });
    }
    if (sessionStatus === "Signed") {
      intro.push({ id: uid(), role: "merlin", text: "Ask for a summary, upcoming obligations, or what changed before signature." });
    }
    setMessages(intro);
    // eslint-disable-next-line
  }, [sessionKey, sessionStatus]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Once every step is done and the draft is approval-ready, Merlin proactively
  // asks for confirmation to send it for approval — right inside the chat.
  React.useEffect(() => {
    if (
      phase === "authoring" &&
      sessionStatus === "Draft" &&
      !health.empty &&
      health.openRisks === 0 &&
      health.openMissing === 0 &&
      !askedApprovalRef.current
    ) {
      askedApprovalRef.current = true;
      merlinReply(
        `That's every open risk and missing clause handled — the draft is at ${health.score}/100. Do you want me to send it for approval?`,
        undefined,
        undefined,
        "approval"
      );
    }
    // eslint-disable-next-line
  }, [health.openRisks, health.openMissing, phase, sessionStatus]);

  // When the contract is actually routed, confirm it in the chat and surface
  // the approval chain so you can see (and review) who's approving.
  React.useEffect(() => {
    if (submitted && !sentNotifiedRef.current) {
      sentNotifiedRef.current = true;
      merlinReply(
        `Sent for approval. I've routed it through the ${APPROVERS.length}-person chain — here's who's reviewing and where each stands. I'll track sign-off and nudge anyone who stalls.`,
        undefined,
        undefined,
        "sent"
      );
    }
    // eslint-disable-next-line
  }, [submitted]);

  const push = (m: Msg) => setMessages((prev) => [...prev, m]);
  // Streamed reply — brief "thinking", then reveal word-by-word; cards/diff land after
  function merlinReply(text: string, cards?: Card[], diff?: Diff, confirm?: "approval" | "sent") {
    setTyping(true);
    const id = uid();
    window.setTimeout(() => {
      setTyping(false);
      push({ id, role: "merlin", text: "", streaming: true });
      const words = text.split(" ");
      let i = 0;
      const iv = window.setInterval(() => {
        i += 1;
        const partial = words.slice(0, i).join(" ");
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: partial } : m)));
        if (i >= words.length) {
          window.clearInterval(iv);
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, streaming: false, cards, diff, confirm } : m)));
        }
      }, 20);
    }, 360);
  }

  function handleCard(card: Card) {
    if (card.kind === "risk") {
      // Capture the before/after BEFORE the store mutates, so we can show the change
      const insight = insights.find((i) => i.id === card.refId);
      const clause = clauses.find((c) => c.id === insight?.clauseId);
      const before = clause?.body ?? "";
      const after =
        clause?.variants?.find((v) => v.kind === "standard")?.body ??
        (insight?.clauseId ? STANDARD_FIX[insight.clauseId] : undefined) ??
        before;
      resolveInsight(card.refId, "accept");
      merlinReply(
        `Applied the policy-standard fix to “${card.title}”. Here's exactly what changed — nothing else in the clause was touched, and it's saved to version history so you can revert:`,
        undefined,
        clause ? { title: `§${clause.number} ${clause.title}`, before, after } : undefined
      );
    } else {
      insertMissingClause(card.refId);
      merlinReply(`Added “${card.title}” — drafted from the standard and flagged for your review. Nothing's final until you approve.`);
    }
    setMessages((prev) => prev.map((m) => (m.cards ? { ...m, cards: m.cards.map((c) => (c.refId === card.refId ? { ...c, done: true } : c)) } : m)));
  }

  function confirmApproval(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, confirm: undefined } : m)));
    onOpenApproval();
  }
  function dismissApproval(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, confirm: undefined } : m)));
    merlinReply("No rush — the draft stays approval-ready. Just say the word when you want me to route it.");
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
      setPhase("authoring");
      const cards = INSIGHTS.filter((i) => i.type === "risk" || i.type === "missing").map((i) =>
        i.type === "risk"
          ? { kind: "risk" as const, refId: i.id, title: i.title, detail: i.detail, basis: i.basis, confidence: i.confidence }
          : { kind: "missing" as const, refId: i.id === "i4" ? "m1" : "m2", title: i.title.replace("Missing clause — ", ""), detail: i.detail, basis: i.basis, confidence: i.confidence });
      merlinReply("Done — I generated your Purchase Agreement from the Supplier Agreement (India, FY26) template, injected the details and ran it against policy. The full contract is on the right. Three things need a decision:", cards);
    }, 1200);
  }

  function process(text: string) {
    const t = text.toLowerCase();
    const openRisks = insights.filter((i) => !i.resolved && i.type === "risk");
    const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");
    if (sessionStatus === "Signed") {
      if (/obligation|renew|coming up|due/.test(t)) return merlinReply("Key post-signature actions are to track renewal/notice dates, maintain the agreed insurance coverage, and monitor the committed commercial terms through the contract period.");
      if (/change|diff|before signature|negotiat/.test(t)) return merlinReply("The biggest negotiated changes before signature were payment terms, indemnity alignment, and completing the mandatory DPA and insurance clauses. The executed version reflects those approved positions.");
      if (/summary|term|status|overview/.test(t)) return merlinReply(`Signed status. ${CONTRACT.type} with ${CONTRACT.supplier}, value ${CONTRACT.value}, effective ${CONTRACT.effectiveDate}, term ${CONTRACT.term}. I can also extract obligations or clause summaries from the signed draft.`);
      if (/approve|submit|route|ready/.test(t)) return merlinReply("This contract is already signed, so there’s nothing left to route for approval. I can help with the executed terms or the obligation summary instead.");
      return merlinReply("This contract is already signed. Ask me for the final terms, obligations, or the key negotiated changes.");
    }
    if (sessionStatus === "In Approval") {
      if (/who|next|approver|route|status/.test(t)) return merlinReply("This draft is already in approval. Finance and legal are in the route, and Merlin can help you prepare answers for approvers or summarise what was submitted.");
      if (/ready|why|approval-ready/.test(t)) return merlinReply(`It was routed because the contract reached ${health.score}/100 and the major risk items were resolved. The remaining task is approver sign-off, not drafting cleanup.`);
    }
    if (sessionStatus === "In Review") {
      if (/review|comment|decision|open point/.test(t)) return merlinReply("This contract is still in review. I’d focus on the payment terms, any non-standard commercial edits, and whether the remaining comments still block approval readiness.");
    }
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
    const files = attachments;
    if (!v && files.length === 0) return;
    push({ id: uid(), role: "user", text: v || undefined, files: files.length ? files : undefined });
    setDraft("");
    setAttachments([]);
    // Files always get an acknowledgement first
    if (files.length) {
      merlinReply(ackFiles(files));
      if (!v) return;
    }
    if (phase === "ready" && /generate|draft|yes|go ahead|do it|ready/i.test(v)) return doGenerate();
    if (phase === "intake") return handleIntakeAnswer(v);
    if (v) process(v);
  }

  // Adaptive chips — always suggest what to do next
  const openRisks = insights.filter((i) => !i.resolved && i.type === "risk");
  const openMissing = insights.filter((i) => !i.resolved && i.type === "missing");
  let chips: string[] = [];
  if (phase === "intake") chips = INTAKE[step]?.chips ?? [];
  else if (phase === "ready") chips = ["⚡ Generate the draft", "Add another requirement"];
  else {
    if (sessionStatus === "Signed") {
      chips = ["Summarise the final terms", "What obligations are coming up?", "What changed before signature?", "Open the signed draft"];
    } else if (sessionStatus === "In Approval") {
      chips = ["Who's next to approve?", "Summarise the open points", "Why was this approval-ready?", "Open approval status"];
    } else if (sessionStatus === "In Review") {
      chips = ["Summarise review changes", "What still needs a decision?", "Fix the payment terms", "Am I ready to submit?"];
    } else {
      const s: string[] = [];
      if (openRisks.some((i) => i.clauseId === "c4")) s.push("Fix the payment terms");
      if (openMissing.length) s.push("Add the missing clauses");
      if (openRisks.length > 1) s.push("Fix everything");
      s.push("Summarise the risks");
      s.push(health.ready ? "Submit for approval" : "Am I ready to submit?");
      chips = s.slice(0, 4);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl px-4 pb-48 pt-24">
          {messages.map((m, idx) => {
            const grouped = m.role === "merlin" && messages[idx - 1]?.role === "merlin";
            return m.role === "merlin" ? (
              <div key={m.id} className={`flex gap-3 animate-in-up ${grouped ? "mb-3" : "mb-6"}`}>
                {grouped ? (
                  <span className="w-7 shrink-0" aria-hidden="true" />
                ) : (
                  <MerlinMark size={28} active={false} />
                )}
                <div className="min-w-0 flex-1">
                  {(m.text || m.streaming) && (
                    <div className="text-[15px] leading-relaxed text-foreground">
                      {m.text}
                      {m.streaming && <span className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[2px] animate-caret rounded-full bg-merlin align-baseline" />}
                    </div>
                  )}
                  {m.cards && (
                    <div className="mt-3 space-y-2.5">
                      {m.cards.map((c) => {
                        const isRisk = c.kind === "risk";
                        return (
	                          <div key={c.refId} className="group animate-in-up rounded-2xl border border-border/60 bg-card p-4 shadow-xs transition-shadow duration-200 hover:border-merlin-border/60 hover:shadow-sm">
	                            <div className="flex items-center justify-between gap-3">
	                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isRisk ? "bg-risk-high-soft text-risk-high" : "bg-risk-med-soft text-risk-med"}`}>
	                                {isRisk ? <ShieldAlert className="size-3.5" /> : <FilePlus2 className="size-3.5" />}
	                                {isRisk ? "Policy risk" : "Missing clause"}
	                              </span>
	                              {c.done && (
	                                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-success">
	                                  <Check className="size-3.5" /> {isRisk ? "Resolved" : "Added"}
	                                </span>
	                              )}
	                            </div>
	                            <div className="mt-3 flex items-end justify-between gap-4">
	                              <div className="min-w-0 flex-1">
	                                <h4 className="text-[15px] font-semibold leading-snug tracking-[-0.01em]">{c.title}</h4>
	                                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{c.detail}</p>
	                              </div>
	                              {!c.done && (
	                                <Button
	                                  size="sm"
	                                  variant="outline"
	                                  className="h-8 shrink-0 rounded-full border-merlin-border px-3 text-primary hover:bg-merlin-soft"
	                                  onClick={() => handleCard(c)}
	                                >
	                                  {isRisk ? <Check className="size-3.5" /> : <Sparkles className="size-3.5" />} {isRisk ? "Apply fix" : "Draft"}
	                                </Button>
	                              )}
	                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {m.diff && (
                    <div className="mt-3 animate-in-up overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                            <GitCompare className="size-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold">{m.diff.title}</div>
                            <div className="text-[11px] text-muted-foreground">Policy-standard change applied</div>
                          </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-risk-low-soft px-2 py-1 text-[11px] font-medium text-success">
                          <Check className="size-3" /> Saved
                        </span>
                      </div>
                      <div className="grid gap-0 sm:grid-cols-2">
                        <div className="border-b border-border/60 bg-risk-high-soft/35 p-4 sm:border-b-0 sm:border-r">
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-risk-high">
                            <Minus className="size-3" /> Before
                          </div>
                          <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{m.diff.before}</p>
                        </div>
                        <div className="bg-risk-low-soft/45 p-4">
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-success">
                            <Plus className="size-3" /> After
                          </div>
                          <p className="line-clamp-3 text-[13px] leading-relaxed text-foreground">{m.diff.after}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[11px] text-muted-foreground">
                        <span>Version history updated</span>
                        <button className="font-medium text-primary hover:underline">Revert</button>
                      </div>
                    </div>
                  )}
                  {m.confirm === "approval" && (
                    <div className="mt-3 animate-in-up rounded-2xl border border-merlin-border/70 bg-merlin-soft/40 p-4">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                        <ShieldCheck className="size-4 text-success" /> Ready to send for approval
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        I'll route this to the approval chain — finance and legal — and track sign-off for you.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => confirmApproval(m.id)}>
                          <ShieldCheck className="size-3.5" /> Send for approval
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => dismissApproval(m.id)}>
                          Not yet
                        </Button>
                      </div>
                    </div>
                  )}
                  {m.confirm === "sent" && (
                    <div className="mt-3 animate-in-up overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-risk-low-soft text-success">
                            <ShieldCheck className="size-4" />
                          </span>
                          <div>
                            <div className="text-[13px] font-semibold">Sent for approval</div>
                            <div className="text-[11px] text-muted-foreground">Routed to {APPROVERS.length} approvers</div>
                          </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-risk-low-soft px-2 py-1 text-[11px] font-medium text-success">
                          <Check className="size-3" /> Routed
                        </span>
                      </div>
                      <div className="divide-y divide-border/60">
                        {APPROVERS.map((a) => {
                          const tone =
                            a.status === "ready"
                              ? { label: "Ready", cls: "bg-risk-low-soft text-success" }
                              : a.status === "pending"
                              ? { label: "Pending", cls: "bg-risk-med-soft text-risk-med" }
                              : { label: "On leave", cls: "bg-muted text-muted-foreground" };
                          const initials = a.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                          return (
                            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{initials}</span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-medium">{a.name}</div>
                                <div className="truncate text-[11px] text-muted-foreground">Stage {a.stage} · {a.role}</div>
                              </div>
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.cls}`}>{tone.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="size-3.5" /> Merlin is tracking sign-off
                        </span>
                        <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={onOpenApproval}>
                          Review route <ArrowRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={m.id} className="mb-6 flex flex-col items-end gap-1.5 animate-in-up">
                {m.files && (
                  <div className="flex max-w-[80%] flex-wrap justify-end gap-1.5">
                    {m.files.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px]">
                        {f.kind === "image" ? <ImageIcon className="size-3.5 text-merlin" /> : <FileText className="size-3.5 text-merlin" />}
                        <span className="max-w-[160px] truncate font-medium">{f.name}</span>
                        {f.size && <span className="text-[11px] text-muted-foreground">{f.size}</span>}
                      </span>
                    ))}
                  </div>
                )}
                {m.text && <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground">{m.text}</div>}
              </div>
            );
          })}
          {typing && (
            <div className="mb-6 flex items-center gap-3 animate-in-fade">
              <MerlinMark size={28} active />
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-merlin/70" style={{ animationDelay: `${d * 0.14}s` }} />)}
                </span>
                <span>Merlin is thinking…</span>
              </div>
            </div>
          )}

          {/* Quick replies — live in the conversation, under Merlin's latest turn */}
          {!typing && chips.length > 0 && messages.length > 0 &&
            messages[messages.length - 1].role === "merlin" &&
            !messages[messages.length - 1].streaming && (
              <div className="-mt-2 mb-2 flex flex-wrap gap-2 pl-10 animate-in-up">
                {chips.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="press rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-xs transition-all hover:-translate-y-px hover:border-merlin-border hover:text-foreground hover:shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background/90 via-55% to-transparent pb-3 pt-24">
        <div className="pointer-events-auto mx-auto max-w-2xl px-4">
          <div className="rounded-[24px] border border-border/80 bg-card/95 p-3 shadow-[0_18px_50px_rgba(15,15,20,0.12)] transition-shadow focus-within:border-merlin-border focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--merlin)_13%,transparent)]">
            {/* attachment preview */}
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5 px-1">
                {attachments.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[12px]">
                    {f.kind === "image" ? <ImageIcon className="size-3.5 text-merlin" /> : <FileText className="size-3.5 text-merlin" />}
                    <span className="max-w-[140px] truncate font-medium">{f.name}</span>
                    <button onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${f.name}`}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-start gap-3 px-2 pt-2">
              <Sparkles className="mt-1 size-4 shrink-0 text-merlin" />
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); } }}
                rows={2}
                placeholder="Ask Merlin to draft a contract, or describe the deal in plain language..."
                className="max-h-32 min-h-[52px] flex-1 resize-none bg-transparent py-0.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70 scrollbar-thin"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.rtf,.txt" className="hidden" onChange={onPickFiles} />
              <button
                onClick={() => fileRef.current?.click()}
                className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Attach image or PDF"
                title="Attach image or PDF"
              >
                <Paperclip className="size-3.5" /> Attach
              </button>
              <button className="press inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <LayoutTemplate className="size-3.5" /> Template <ChevronDown className="size-3.5 opacity-60" />
              </button>
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden text-[13px] text-muted-foreground sm:inline">Merlin drafts &amp; de-risks</span>
                <Button size="icon" onClick={() => send(draft)} disabled={!draft.trim() && attachments.length === 0} aria-label="Send" className="press size-11 rounded-2xl shadow-md shadow-primary/15">
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-1.5 text-center text-[11px] text-muted-foreground">Merlin acts on your contract — it never changes legal terms without your confirmation.</div>
        </div>
      </div>
    </div>
  );
}
