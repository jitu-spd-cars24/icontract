import { TopBar } from "@/components/TopBar";
import { Card, Badge, Button } from "@/components/ui/primitives";
import { MerlinMark, SectionLabel } from "@/components/shared";
import { useStore } from "@/store";
import {
  Sparkles,
  LayoutTemplate,
  Upload,
  FilePlus2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FlowStep } from "@/lib/types";

interface Option {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  meta: string;
  recommended?: boolean;
  go: FlowStep;
  merlin?: boolean;
}

const OPTIONS: Option[] = [
  {
    id: "merlin",
    icon: Sparkles,
    title: "Generate with Merlin Intake",
    desc: "Answer a few questions in plain language. Merlin drafts the contract, fills metadata, and picks clauses.",
    meta: "Fastest · ~2 min",
    recommended: true,
    go: "intake",
    merlin: true,
  },
  {
    id: "template",
    icon: LayoutTemplate,
    title: "Start from a template",
    desc: "Assemble from a governed, clause-based template. Full control over structure.",
    meta: "24 templates · India",
    go: "template",
  },
  {
    id: "import",
    icon: Upload,
    title: "Import third-party paper",
    desc: "Upload the supplier's contract. Merlin marks it up, maps clauses, and flags deviations.",
    meta: "PDF, DOCX · OCR ready",
    go: "import",
  },
  {
    id: "blank",
    icon: FilePlus2,
    title: "Create from blank",
    desc: "Open an empty editor and build clause by clause with Merlin on the side.",
    meta: "Advanced authors",
    go: "workspace",
  },
  {
    id: "duplicate",
    icon: Copy,
    title: "Duplicate existing contract",
    desc: "Clone a similar prior agreement and update the parties and terms.",
    meta: "From your recent contracts",
    go: "workspace",
  },
];

export function StartingPoint() {
  const { go, startBlank } = useStore();

  function choose(o: Option) {
    if (o.id === "blank") return startBlank();
    if (o.id === "duplicate") return go("duplicate");
    go(o.go); // merlin → "intake" (guided screen), template/import → their screens
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-[1080px] px-6 py-10">
        <button
          onClick={() => go("dashboard")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </button>

        <div className="flex items-center gap-2">
          <SectionLabel>New contract · Step 1 of 5</SectionLabel>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          How would you like to start?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every path lands in the same workspace. You can switch approaches at any time.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <Card
                key={o.id}
                onClick={() => choose(o)}
                className={`group relative cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  o.merlin
                    ? "border-merlin-border bg-merlin-soft/40 hover:merlin-glow"
                    : "hover:border-primary/40"
                } ${o.id === "duplicate" ? "md:col-span-2" : ""}`}
              >
                {o.recommended && (
                  <Badge tone="merlin" className="absolute right-4 top-4">
                    <Check className="size-3" /> Recommended
                  </Badge>
                )}
                <div className="flex items-start gap-4">
                  {o.merlin ? (
                    <MerlinMark size={40} />
                  ) : (
                    <div className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                      <Icon className="size-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-base font-semibold">{o.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {o.desc}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {o.meta}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Continue <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          <MerlinMark size={28} active={false} />
          <span>
            <strong className="font-medium text-foreground">Not sure?</strong> Merlin
            Intake is fastest for a first draft and you keep full editing control after.
          </span>
          <Button size="sm" variant="merlin" className="ml-auto" onClick={() => go("intake")}>
            <Sparkles className="size-4" /> Start with Merlin
          </Button>
        </div>
      </main>
    </div>
  );
}
