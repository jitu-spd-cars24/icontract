import * as React from "react";
import { TopBar } from "@/components/TopBar";
import { Card, Button, Badge, Input, Switch } from "@/components/ui/primitives";
import { SectionLabel, RiskDot } from "@/components/shared";
import { useStore } from "@/store";
import { DUPLICATABLE } from "@/lib/data";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Copy,
  Check,
  FileText,
  Building2,
  Layers,
  Clock,
} from "lucide-react";

export function DuplicateContract() {
  const { go, startDraft, toast } = useStore();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [carryParties, setCarryParties] = React.useState(false);
  const [carryPricing, setCarryPricing] = React.useState(true);

  const results = DUPLICATABLE.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.supplier.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase().includes(query.toLowerCase())
  );
  const source = DUPLICATABLE.find((c) => c.id === selected) ?? null;

  function duplicate() {
    if (!source) return;
    startDraft({ duplicatedFrom: source.title });
    toast({
      title: "Contract duplicated",
      detail: `New draft created from ${source.title}`,
      tone: "success",
    });
  }

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

        <SectionLabel>New contract · Duplicate existing</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Which contract do you want to duplicate?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll copy the structure, clauses and template. Signatures, approvals and dates always
          reset on the new draft.
        </p>

        {/* search */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by contract, supplier or ID…"
            className="h-10 pl-9"
          />
        </div>

        {/* list */}
        <div className="mt-4 space-y-2">
          {results.map((c) => {
            const active = selected === c.id;
            return (
              <Card
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`cursor-pointer p-4 transition-all ${
                  active ? "border-primary ring-2 ring-primary/15" : "hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{c.title}</span>
                      <Badge tone="outline">{c.type}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{c.id}</span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="size-3.5" /> {c.supplier}
                      </span>
                      <span>{c.value}</span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3.5" /> {c.clauses} clauses
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {c.updated}
                      </span>
                    </div>
                  </div>
                  <Badge tone={c.status === "Signed" ? "low" : c.status === "In Approval" ? "primary" : "med"}>
                    {c.status}
                  </Badge>
                  <div
                    className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {active && <Check className="size-3" />}
                  </div>
                </div>
              </Card>
            );
          })}
          {results.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No contracts match "{query}".
            </Card>
          )}
        </div>

        {/* what carries over */}
        {source && (
          <Card className="mt-5 p-4 animate-in-up">
            <SectionLabel>What to copy from “{source.title}”</SectionLabel>
            <div className="mt-3 space-y-2 text-sm">
              <ToggleRow
                label="Clause structure & wording"
                detail="All standard, fallback and custom clauses"
                checked
                locked
              />
              <ToggleRow
                label="Pricing & commercial terms"
                detail="Payment terms, price schedule, values"
                checked={carryPricing}
                onChange={setCarryPricing}
              />
              <ToggleRow
                label="Counterparty & signer details"
                detail="Off by default — usually a new supplier"
                checked={carryParties}
                onChange={setCarryParties}
              />
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
                <RiskDot risk="medium" />
                Signatures, approval history, effective dates and the contract ID always reset — a
                duplicate starts as a fresh draft.
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-border p-4">
          <p className="text-xs text-muted-foreground">
            {source ? (
              <>Creating a copy of <strong className="text-foreground">{source.title}</strong></>
            ) : (
              "Select a contract to duplicate."
            )}
          </p>
          <Button size="lg" disabled={!source} onClick={duplicate}>
            <Copy className="size-4" /> Duplicate & open <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

function ToggleRow({
  label,
  detail,
  checked,
  onChange,
  locked,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
      <div className="flex-1">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{detail}</div>
      </div>
      {locked ? (
        <Badge tone="low">
          <Check /> Always
        </Badge>
      ) : (
        <Switch checked={checked} onChange={onChange ?? (() => {})} label={label} />
      )}
    </div>
  );
}
