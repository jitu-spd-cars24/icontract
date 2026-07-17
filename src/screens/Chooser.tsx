import { useStore } from "@/store";
import { Logo, MerlinMark } from "@/components/shared";
import { Badge, Button } from "@/components/ui/primitives";
import { Moon, Sun, ArrowRight, Check, LayoutDashboard, Sparkles } from "lucide-react";

export function Chooser() {
  const { setAppMode, go, theme, toggleTheme } = useStore();

  function nextgen() { setAppMode("nextgen"); }
  function traditional() { setAppMode("traditional"); go("dashboard"); }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center px-5">
        <Logo />
        <button onClick={toggleTheme} className="ml-auto grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Toggle theme">
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[1040px] flex-col justify-center px-6 py-12">
        <div className="text-center">
          <Badge tone="merlin" className="mb-4"><Sparkles className="size-3" /> Contract Authoring</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How do you want to work today?</h1>
          <p className="mx-auto mt-2 max-w-xl text-[15px] text-muted-foreground">
            Two ways into the same contracts. Start a conversation with Merlin, or work hands-on in the classic workspace.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* NextGen */}
          <button onClick={nextgen} className="group relative overflow-hidden rounded-2xl border border-merlin-border bg-gradient-to-b from-merlin-soft to-card p-7 text-left transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <MerlinMark size={44} />
              <Badge tone="merlin"><Check className="size-3" /> Recommended</Badge>
            </div>
            <h2 className="mt-5 text-xl font-semibold">NextGen AI Contract</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
              A Merlin-led workspace. Chat in the centre, your contracts on the left, the live document as an artifact on the right. Describe what you need and Merlin drafts, checks and de-risks it with you.
            </p>
            <ul className="mt-4 space-y-2 text-[13px]">
              {["Conversational drafting — no long forms", "Proactive risk & compliance checks", "Suggestions at every step to reduce the busywork"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-ink-soft"><Check className="mt-0.5 size-3.5 shrink-0 text-merlin" /> <span className="text-foreground/90">{f}</span></li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-merlin-ink">Enter NextGen <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
          </button>

          {/* Traditional */}
          <button onClick={traditional} className="group rounded-2xl border border-border bg-card p-7 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary"><LayoutDashboard className="size-5" /></span>
              <Badge tone="neutral">Classic</Badge>
            </div>
            <h2 className="mt-5 text-xl font-semibold">Traditional Contract</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
              The full enterprise workspace. A portfolio dashboard, guided creation flow, and a document editor with clause cards, metadata, versions and approvals — Merlin assisting from a side panel.
            </p>
            <ul className="mt-4 space-y-2 text-[13px]">
              {["Dashboard, templates & guided steps", "Document editor with clause-level control", "Full metadata, versions, audit & approvals"].map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> <span className="text-foreground/90">{f}</span></li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Enter workspace <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
          </button>
        </div>

        <p className="mt-8 text-center text-[12px] text-muted-foreground">You can switch between them anytime from inside either experience.</p>
      </main>
    </div>
  );
}
