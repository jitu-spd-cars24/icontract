import * as React from "react";
import { Button, Badge, Separator, Switch } from "@/components/ui/primitives";
import { MerlinMark } from "@/components/shared";
import { useHealth } from "./LeftRail";
import { useStore } from "@/store";
import { APPROVERS, CONTRACT } from "@/lib/data";
import {
  X,
  Check,
  AlertTriangle,
  ShieldCheck,
  PenLine,
  ArrowRight,
  Loader2,
  Send,
  CircleUserRound,
} from "lucide-react";

type Stage = "readiness" | "route" | "signing" | "done";

export function ApprovalModal({ onClose }: { onClose: () => void }) {
  const health = useHealth();
  const { logActivity, toast, insights } = useStore();
  const [stage, setStage] = React.useState<Stage>("readiness");
  const [delegate, setDelegate] = React.useState(false);
  const [signing, setSigning] = React.useState(false);

  const openRisks = insights.filter((i) => !i.resolved && i.type === "risk").length;
  const openMissing = insights.filter((i) => !i.resolved && i.type === "missing").length;

  const checks = [
    { label: "Required metadata complete", ok: true, detail: "All required fields filled" },
    { label: "Mandatory clauses present", ok: openMissing === 0, detail: openMissing === 0 ? "DPA + insurance included" : `${openMissing} mandatory clause(s) missing` },
    { label: "Open risks resolved", ok: openRisks === 0, detail: openRisks === 0 ? "No high risks outstanding" : `${openRisks} risk(s) need attention` },
    { label: "Compliance & sanctions", ok: true, detail: "Sanctions cleared · DPDP addendum attached" },
    { label: "Approval chain available", ok: true, detail: "4 approvers — 1 on leave, delegate available" },
  ];
  const ready = checks.every((c) => c.ok);

  function startSigning() {
    setStage("signing");
    setSigning(true);
    setTimeout(() => {
      setSigning(false);
      setStage("done");
      logActivity({
        actor: "Jitendra Kumar",
        action: "submitted for approval & routed to e-sign",
        target: CONTRACT.id,
        kind: "approval",
      });
      toast({
        title: "Submitted for approval",
        detail: "Routed to 4 approvers · e-sign envelope prepared",
        tone: "success",
      });
    }, 1900);
  }

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-in-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <MerlinMark size={28} />
            <div>
              <div className="text-sm font-semibold">
                {stage === "done" ? "Submitted" : "Approval readiness"}
              </div>
              <div className="text-[11px] text-muted-foreground">{CONTRACT.id}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* stepper */}
        {stage !== "done" && (
          <div className="flex items-center gap-1.5 border-b border-border px-5 py-2.5 text-[11px]">
            {(["readiness", "route", "signing"] as Stage[]).map((s, i) => (
              <React.Fragment key={s}>
                <span
                  className={`inline-flex items-center gap-1 font-medium capitalize ${
                    stage === s ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[9px] ${
                      stage === s ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {s === "signing" ? "e-Sign" : s}
                </span>
                {i < 2 && <span className="h-px flex-1 bg-border" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* body */}
        <div className="max-h-[60vh] overflow-y-auto p-5 scrollbar-thin">
          {stage === "readiness" && (
            <>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="grid size-11 place-items-center rounded-full bg-accent text-lg font-bold tabular-nums">
                  {health.score}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Contract health {health.score}/100</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ready ? "Everything checks out — ready to route." : "Resolve the items below for a clean submission."}
                  </div>
                </div>
                <Badge tone={ready ? "low" : "med"}>{ready ? "Ready" : "Review"}</Badge>
              </div>

              <div className="space-y-1.5">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                        c.ok ? "bg-risk-low-soft text-success" : "bg-risk-med-soft text-risk-med"
                      }`}
                    >
                      {c.ok ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
                    </span>
                    <div>
                      <div className="text-xs font-medium">{c.label}</div>
                      <div className="text-[11px] text-muted-foreground">{c.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {!ready && (
                <div className="mt-3 rounded-lg bg-merlin-soft/40 p-2.5 text-[11px] text-muted-foreground">
                  <MerlinMark size={18} active={false} />{" "}
                  You can submit with an exception, but Merlin recommends resolving open risks first.
                  Legal will be auto-flagged.
                </div>
              )}
            </>
          )}

          {stage === "route" && (
            <>
              <p className="text-xs text-muted-foreground">
                Merlin predicts this routes in <strong className="text-foreground">~2 days</strong> with a{" "}
                <strong className="text-foreground">92% first-pass approval</strong> likelihood.
              </p>
              <div className="mt-3 space-y-2">
                {APPROVERS.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
                      {a.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-medium">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">Stage {a.stage} · {a.role}</div>
                    </div>
                    {a.status === "on-leave" ? (
                      <Badge tone="high">
                        <AlertTriangle /> On leave
                      </Badge>
                    ) : (
                      <Badge tone="low">
                        <Check /> Ready
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-lg border border-risk-med/30 bg-risk-med-soft/40 p-3">
                <div className="flex-1">
                  <div className="text-xs font-medium">Ananya Rao is on leave until 22 Jul</div>
                  <div className="text-[11px] text-muted-foreground">
                    Delegate to Sanjay Iyer (Senior Legal Counsel) to avoid a bottleneck.
                  </div>
                </div>
                <Switch checked={delegate} onChange={setDelegate} label="Delegate legal review" />
              </div>
              {delegate && (
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-success">
                  <Check className="size-3" /> Legal review will route to Sanjay Iyer
                </div>
              )}
            </>
          )}

          {stage === "signing" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              {signing ? (
                <>
                  <Loader2 className="size-8 animate-spin text-merlin" />
                  <div className="text-sm font-medium">Preparing e-sign envelope…</div>
                  <div className="text-[11px] text-muted-foreground">
                    Generating signature blocks · notifying approvers · locking version
                  </div>
                </>
              ) : (
                <>
                  <PenLine className="size-8 text-primary" />
                  <div className="text-sm font-medium">Ready for signature handoff</div>
                </>
              )}
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-risk-low-soft">
                <ShieldCheck className="size-7 text-success" />
              </div>
              <div className="text-base font-semibold">Sent for approval</div>
              <p className="max-w-xs text-xs text-muted-foreground">
                {CONTRACT.title} is now with{" "}
                <strong className="text-foreground">Priya Nair</strong> (Stage 1). An e-sign
                envelope is prepared and will trigger automatically once all approvals clear.
              </p>
              <div className="mt-2 w-full space-y-1.5 rounded-lg border border-border p-3 text-left">
                {[
                  { icon: Send, text: "Routed to 4 approvers" },
                  { icon: CircleUserRound, text: delegate ? "Legal delegated to Sanjay Iyer" : "Legal review assigned to Ananya Rao" },
                  { icon: PenLine, text: "e-Sign envelope ready (DocuSign)" },
                ].map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.text} className="flex items-center gap-2 text-xs">
                      <Icon className="size-3.5 text-success" /> {r.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center gap-2 border-t border-border px-5 py-3">
          {stage === "readiness" && (
            <>
              <Button variant="ghost" onClick={onClose} className="mr-auto">
                Cancel
              </Button>
              {!ready && <Button variant="outline">Submit with exception</Button>}
              <Button onClick={() => setStage("route")}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </>
          )}
          {stage === "route" && (
            <>
              <Button variant="ghost" onClick={() => setStage("readiness")} className="mr-auto">
                Back
              </Button>
              <Button onClick={startSigning}>
                Route & prepare e-sign <ArrowRight className="size-4" />
              </Button>
            </>
          )}
          {stage === "done" && (
            <Button className="w-full" onClick={onClose}>
              Back to workspace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
