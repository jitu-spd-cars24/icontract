import * as React from "react";
import { Logo } from "@/components/shared";
import { Button, Avatar, Tooltip } from "@/components/ui/primitives";
import { useStore } from "@/store";
import {
  Moon,
  Sun,
  Bell,
  Search,
  HelpCircle,
  Sparkles,
  CheckCheck,
  ShieldAlert,
  Clock3,
  CircleUserRound,
  ChevronRight,
  FileCheck2,
  UserRound,
  Building2,
  ShieldCheck,
  Settings2,
  LogOut,
  Command,
  ChevronsUpDown,
} from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "approval" | "risk" | "activity" | "signed";
  unread: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Finance approval is waiting on you",
    detail: "Cloudspring Technologies — MSA is ready for finance sign-off.",
    time: "2m ago",
    tone: "approval",
    unread: true,
  },
  {
    id: "n2",
    title: "Merlin found a policy deviation",
    detail: "Payment terms in ABC Manufacturing exceed the Net 45 standard.",
    time: "12m ago",
    tone: "risk",
    unread: true,
  },
  {
    id: "n3",
    title: "Supplier risk rating changed",
    detail: "ABC Manufacturing moved from Low to Medium risk this quarter.",
    time: "Today",
    tone: "activity",
    unread: true,
  },
  {
    id: "n4",
    title: "Agreement sent for signature",
    detail: "Meridian Logistics — Mutual NDA has been routed to DocuSign.",
    time: "Yesterday",
    tone: "signed",
    unread: false,
  },
];

const notificationMeta = {
  approval: {
    icon: CircleUserRound,
    chip: "Approval",
    iconClass: "text-info bg-accent",
  },
  risk: {
    icon: ShieldAlert,
    chip: "Risk",
    iconClass: "text-risk-high bg-risk-high-soft",
  },
  activity: {
    icon: Clock3,
    chip: "Update",
    iconClass: "text-warning bg-risk-med-soft",
  },
  signed: {
    icon: FileCheck2,
    chip: "Signed",
    iconClass: "text-success bg-risk-low-soft",
  },
} as const;

export function TopBar() {
  const { theme, toggleTheme, go, setAppMode, searchQuery, setSearchQuery } = useStore();
  const [openNotifications, setOpenNotifications] = React.useState(false);
  const [openProfile, setOpenProfile] = React.useState(false);
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);
  const notificationRef = React.useRef<HTMLDivElement | null>(null);
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  const unreadCount = notifications.filter((item) => item.unread).length;
  const unreadNotifications = notifications.filter((item) => item.unread);
  const readNotifications = notifications.filter((item) => !item.unread);
  const notificationCounts = [
    {
      label: "Approvals",
      value: notifications.filter((item) => item.tone === "approval").length,
    },
    {
      label: "Merlin risks",
      value: notifications.filter((item) => item.tone === "risk").length,
    },
    {
      label: "Updates",
      value: notifications.filter((item) => item.tone === "activity" || item.tone === "signed").length,
    },
  ];

  React.useEffect(() => {
    function onPointerDown(event: MouseEvent) {
    const target = event.target as Node;
      if (!notificationRef.current?.contains(target)) {
        setOpenNotifications(false);
      }
      if (!profileRef.current?.contains(target)) {
        setOpenProfile(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenNotifications(false);
        setOpenProfile(false);
      }
    }

    if (openNotifications || openProfile) {
      document.addEventListener("mousedown", onPointerDown);
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openNotifications, openProfile]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4">
      <button
        onClick={() => go("dashboard")}
        className="shrink-0 cursor-pointer"
        aria-label="Go to dashboard"
      >
        <Logo />
      </button>

      <div className="relative ml-2 hidden min-w-[320px] max-w-xl flex-1 items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          placeholder="Search contracts, clauses, suppliers…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <kbd className="absolute right-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Tooltip content="Try the NextGen AI experience">
          <Button variant="outline" size="sm" onClick={() => setAppMode("nextgen")} className="hidden md:inline-flex">
            <Sparkles className="size-3.5 text-merlin" /> NextGen AI
          </Button>
        </Tooltip>

        <div className="flex items-center gap-0.5">
          <Tooltip content="Toggle theme">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </Tooltip>
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className={`relative ${openNotifications ? "bg-accent text-foreground" : ""}`}
              onClick={() => {
                setOpenProfile(false);
                setOpenNotifications((open) => !open);
                setNotifications((prev) =>
                  prev.map((item) => (item.unread ? { ...item, unread: false } : item))
                );
              }}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
              )}
            </Button>

            {openNotifications && (
              <div className="absolute right-0 top-full z-50 mt-3 w-[400px] overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in-up">
                <div className="border-b border-border/70 bg-background/35 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-semibold">Notifications</div>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                          {unreadCount} unread
                        </span>
                      </div>
                      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Approvals, Merlin alerts, and contract activity in one place.
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((item) => ({ ...item, unread: false }))
                        )
                      }
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <CheckCheck className="size-3.5" /> Mark all read
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {notificationCounts.map((metric) => (
                      <div key={metric.label} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground">{metric.label}</span>
                        <span className="text-[11px] font-semibold tabular-nums text-foreground">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="max-h-[440px] overflow-y-auto p-3 scrollbar-thin">
                  <div className="space-y-4">
                    {[
                      { label: "New", items: unreadNotifications },
                      { label: "Earlier", items: readNotifications },
                    ].map((group) =>
                      group.items.length ? (
                        <div key={group.label}>
                          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.label}
                          </div>
                          <div className="space-y-2">
                            {group.items.map((item) => {
                              const meta = notificationMeta[item.tone];
                              const Icon = meta.icon;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() =>
                                    setNotifications((prev) =>
                                      prev.map((entry) =>
                                        entry.id === item.id ? { ...entry, unread: false } : entry
                                      )
                                    )
                                  }
                                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                                    item.unread
                                      ? "border-border bg-accent/20 hover:bg-accent/35"
                                      : "border-border/60 bg-card hover:bg-accent/20"
                                  }`}
                                >
                                  <div className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl ${meta.iconClass}`}>
                                    <Icon className="size-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</span>
                                          {item.unread && <span className="size-2 shrink-0 rounded-full bg-destructive" />}
                                        </div>
                                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                          {item.detail}
                                        </div>
                                      </div>
                                      <span className="shrink-0 text-[11px] text-muted-foreground">{item.time}</span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                      <span className="rounded-full bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                                        {meta.chip}
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                                        Open <ChevronRight className="size-3.5" />
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                <div className="border-t border-border/70 bg-background/25 px-4 py-3">
                  <button className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card px-3 py-2.5 text-left text-xs font-medium text-primary transition-colors hover:bg-accent/30 hover:text-foreground">
                    <span>View all activity</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <Tooltip content="Help">
            <Button variant="ghost" size="icon" aria-label="Help">
              <HelpCircle className="size-4" />
            </Button>
          </Tooltip>
          <div className="relative ml-1" ref={profileRef}>
            <button
              onClick={() => {
                setOpenNotifications(false);
                setOpenProfile((open) => !open);
              }}
              className={`inline-flex items-center gap-1 rounded-full p-0.5 transition-colors ${openProfile ? "bg-accent" : "hover:bg-accent/70"}`}
              aria-label="Open user menu"
            >
              <Avatar name="Jitendra Kumar" className="size-8" />
            </button>

            {openProfile && (
              <div className="absolute right-0 top-full z-50 mt-3 w-[340px] overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in-up">
                <div className="border-b border-border/70 bg-background/35 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <Avatar name="Jitendra Kumar" className="size-12 text-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-base font-semibold">Jitendra Kumar</div>
                        <ChevronsUpDown className="size-4 text-muted-foreground" />
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Procurement Manager · Manufacturing
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-border/70 bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          Zycus India
                        </span>
                        <span className="rounded-full border border-border/70 bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          Contract owner
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Workspace
                  </div>
                  <div className="space-y-1.5">
                    {[
                      {
                        icon: UserRound,
                        title: "My profile",
                        detail: "View role, ownership, and approvals",
                      },
                      {
                        icon: Building2,
                        title: "Business context",
                        detail: "Manufacturing · India entity · Procurement",
                      },
                      {
                        icon: ShieldCheck,
                        title: "Access & permissions",
                        detail: "Contract edit, submit, and approval rights",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.title}
                          className="flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 text-left transition-colors hover:bg-accent/25"
                        >
                          <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground">{item.title}</div>
                            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {item.detail}
                            </div>
                          </div>
                          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border/70 bg-background/25 p-3">
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Preferences
                  </div>
                  <div className="space-y-1.5">
                    <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-accent/25">
                      <div className="grid size-8 place-items-center rounded-xl bg-card text-muted-foreground">
                        <Settings2 className="size-4" />
                      </div>
                      <div className="flex-1 text-sm font-medium">Workspace settings</div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                    <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-accent/25">
                      <div className="grid size-8 place-items-center rounded-xl bg-card text-muted-foreground">
                        <Command className="size-4" />
                      </div>
                      <div className="flex-1 text-sm font-medium">Keyboard shortcuts</div>
                      <span className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        ⌘K
                      </span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-border/70 p-3">
                  <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/25 hover:text-foreground">
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
