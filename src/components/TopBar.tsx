import { Logo } from "@/components/shared";
import { Button, Avatar, Tooltip } from "@/components/ui/primitives";
import { useStore } from "@/store";
import { Moon, Sun, Bell, Search, HelpCircle, Sparkles } from "lucide-react";

export function TopBar({ onNew }: { onNew?: () => void }) {
  const { theme, toggleTheme, go, setAppMode } = useStore();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <button
        onClick={() => go("dashboard")}
        className="cursor-pointer"
        aria-label="Go to dashboard"
      >
        <Logo />
      </button>

      <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
        {["Home", "Contracts", "Suppliers", "Clause Library", "Reports"].map(
          (item, i) => (
            <button
              key={item}
              onClick={() => go("dashboard")}
              className={
                i === 1
                  ? "rounded-md px-3 py-1.5 font-medium text-foreground bg-accent"
                  : "rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              }
            >
              {item}
            </button>
          )
        )}
      </nav>

      <div className="relative ml-auto hidden w-72 items-center lg:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          placeholder="Search contracts, clauses, suppliers…"
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <kbd className="absolute right-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <Tooltip content="Try the NextGen AI experience">
        <Button variant="outline" size="sm" onClick={() => setAppMode("nextgen")} className="hidden md:inline-flex">
          <Sparkles className="size-3.5 text-merlin" /> NextGen AI
        </Button>
      </Tooltip>

      {onNew && (
        <Button size="sm" onClick={onNew} className="hidden sm:inline-flex">
          New contract
        </Button>
      )}

      <div className="flex items-center gap-0.5">
        <Tooltip content="Toggle theme">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </Tooltip>
        <Tooltip content="Notifications">
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
          </Button>
        </Tooltip>
        <Tooltip content="Help">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="size-4" />
          </Button>
        </Tooltip>
        <Avatar name="Jitendra Kumar" className="ml-1 size-8" />
      </div>
    </header>
  );
}
