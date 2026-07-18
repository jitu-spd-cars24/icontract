import * as React from "react";
import { Badge } from "@/components/ui/primitives";
import { MerlinMark } from "@/components/shared";
import { useStore } from "@/store";
import { useHealth } from "./LeftRail";
import { CONTRACT } from "@/lib/data";
import { X, Printer, ShieldAlert, Eye, EyeOff } from "lucide-react";

export function ContractPreview({
  onClose,
  statusLabel = "Draft",
}: {
  onClose: () => void;
  statusLabel?: "Draft" | "In Review" | "In Approval" | "Signed";
}) {
  const { clauses, metadata, isBlank, submitted } = useStore();
  const health = useHealth();
  const [showFlags, setShowFlags] = React.useState(true);

  const get = (id: string) => metadata.find((f) => f.id === id)?.value || "";
  const buyer = get("entity") || CONTRACT.entity;
  const supplier = get("supplierName") || CONTRACT.supplier;
  const value = get("value") || CONTRACT.value;
  const effective = get("effectiveDate") || CONTRACT.effectiveDate;
  const term = get("term") || CONTRACT.term;
  const jurisdiction = get("jurisdiction") || "—";
  const signer = get("signer") || "—";

  const serif = { fontFamily: 'Georgia, "Times New Roman", serif' } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-foreground/50 backdrop-blur-sm animate-in-fade" onClick={onClose}>
      {/* toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
        <MerlinMark size={26} active={false} />
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">Contract preview</div>
          <div className="text-[11px] leading-tight text-muted-foreground">
            {isBlank ? "" : `${CONTRACT.id} · `}
            {statusLabel === "Signed" ? (
              <span className="font-medium text-success">Signed</span>
            ) : statusLabel === "In Approval" || submitted ? (
              <span className="font-medium text-success">In approval</span>
            ) : statusLabel === "In Review" ? (
              <span className="font-medium text-risk-med">In review</span>
            ) : (
              "Draft"
            )}{" "}
            · {clauses.length} clauses
          </div>
        </div>
        <Badge tone={health.ready ? "low" : "med"} className="ml-2">Health {health.score}/100</Badge>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setShowFlags((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground">
            {showFlags ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} {showFlags ? "Hide" : "Show"} risk flags
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground">
            <Printer className="size-3.5" /> Print / PDF
          </button>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Close preview"><X className="size-4" /></button>
        </div>
      </div>

      {/* document */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin" onClick={onClose}>
        <div
          className="mx-auto max-w-[760px] rounded-xl bg-white px-8 py-12 text-[#1a1a1a] shadow-2xl sm:px-16"
          style={serif}
          onClick={(e) => e.stopPropagation()}
        >
          {clauses.length === 0 ? (
            <div className="grid place-items-center gap-3 py-20 text-center" style={{ fontFamily: "system-ui" }}>
              <MerlinMark size={34} active={false} />
              <div className="text-base font-semibold text-[#1a1a1a]">Nothing to preview yet</div>
              <p className="max-w-sm text-sm text-[#6b6675]">Merlin is still gathering details. Once the draft is generated, the full contract will render here as a formatted document.</p>
            </div>
          ) : (
            <>
              {/* title block */}
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-[0.25em] text-[#8a8594]" style={{ fontFamily: "system-ui" }}>Zycus iContract</div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#111]">PURCHASE AGREEMENT</h1>
                <div className="mx-auto mt-3 h-px w-16 bg-[#ccc]" />
              </div>

              <p className="mt-8 text-[15px] leading-[1.9] text-justify">
                This Purchase Agreement (the “Agreement”) is entered into and effective as of{" "}
                <b>{effective}</b>, by and between <b>{buyer}</b> (the “Buyer”) and <b>{supplier}</b>{" "}
                (the “Supplier”), for a term of <b>{term}</b>, with a total estimated value of <b>{value}</b>.
                This Agreement is governed by the laws of <b>{jurisdiction}</b>.
              </p>

              {/* clauses */}
              <div className="mt-6 space-y-6">
                {clauses.map((c) => (
                  <section key={c.id}>
                    <h2 className="flex items-baseline gap-2 text-[15px] font-bold text-[#111]">
                      <span className="tabular-nums">{c.number}.</span>
                      <span className="uppercase tracking-wide">{c.title}</span>
                      {showFlags && (c.nonStandard || c.risk === "high") && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-normal" style={{ fontFamily: "system-ui", background: "#fbecee", color: "#c0392b" }}>
                          <ShieldAlert style={{ width: 11, height: 11 }} /> Non-standard
                        </span>
                      )}
                      {showFlags && c.approved && (
                        <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium tracking-normal" style={{ fontFamily: "system-ui", background: "#e6f4ee", color: "#2b7a55" }}>Approved</span>
                      )}
                    </h2>
                    <p className="mt-1.5 pl-6 text-[14px] leading-[1.85] text-justify text-[#2a2a2a]">
                      {c.body || <span className="italic text-[#9a94a8]">[ To be drafted ]</span>}
                    </p>
                  </section>
                ))}
              </div>

              {/* signatures */}
              <div className="mt-14 border-t border-[#e0e0e0] pt-8">
                <p className="text-[13px] text-[#555]">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.</p>
                <div className="mt-8 grid grid-cols-2 gap-10">
                  {[{ role: "For the Buyer", name: signer, org: buyer }, { role: "For the Supplier", name: "Authorised Signatory", org: supplier }].map((s) => (
                    <div key={s.role}>
                      <div className="h-10 border-b border-[#333]" />
                      <div className="mt-2 text-[12px] leading-relaxed text-[#333]">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-[#777]">{s.role}</div>
                        <div className="text-[#777]">{s.org}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 text-center text-[10px] text-[#b0aab8]" style={{ fontFamily: "system-ui" }}>
                Draft preview · generated by Merlin · not for execution until approved
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
