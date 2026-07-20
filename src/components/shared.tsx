import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";
import { useStore } from "@/store";
import {
  Sparkles,
  ShieldAlert,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { ClauseStatus, RiskLevel, FieldConfidence } from "@/lib/types";

/* Zycus wordmark */
export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm">
        Z
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">
            Zycus <span className="text-muted-foreground font-normal">iContract</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Merlin AI mark with subtle animated aura */
export function MerlinMark({
  size = 28,
  active = true,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative grid place-items-center text-white shrink-0",
        active && "merlin-glow"
      )}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(7, size * 0.28),
        background: "linear-gradient(140deg, var(--primary) 0%, var(--merlin) 62%, color-mix(in oklch, var(--merlin) 72%, #ff86cf) 100%)",
      }}
    >
      <Sparkles style={{ width: size * 0.52, height: size * 0.52 }} />
    </span>
  );
}

/* Animated hero AI orb — pulsing glow + a slow rotating sheen ring */
export function MerlinOrb({ size = 60 }: { size?: number }) {
  const ringMask =
    "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <span
        aria-hidden="true"
        className="orb-glow absolute rounded-full"
        style={{
          inset: -size * 0.28,
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--merlin) 42%, transparent), transparent 68%)",
        }}
      />
      <span
        aria-hidden="true"
        className="orb-spin absolute"
        style={{
          inset: -3,
          borderRadius: size * 0.34,
          background:
            "conic-gradient(from 0deg, transparent 0%, color-mix(in oklch, var(--merlin) 70%, transparent) 18%, transparent 42%)",
          WebkitMask: ringMask,
          mask: ringMask,
        }}
      />
      <span
        className="relative grid place-items-center text-white shadow-lg"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          background:
            "linear-gradient(140deg, var(--primary) 0%, var(--merlin) 60%, color-mix(in oklch, var(--merlin) 72%, #ff86cf) 100%)",
        }}
      >
        <Sparkles className="orb-breath" style={{ width: size * 0.46, height: size * 0.46 }} />
      </span>
    </div>
  );
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; tone: "high" | "med" | "low" | "neutral"; color: string }
> = {
  high: { label: "High risk", tone: "high", color: "var(--risk-high)" },
  medium: { label: "Medium risk", tone: "med", color: "var(--risk-med)" },
  low: { label: "Low risk", tone: "low", color: "var(--risk-low)" },
  none: { label: "No risk", tone: "neutral", color: "var(--muted-foreground)" },
};

export function RiskDot({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className="inline-block size-2 rounded-full shrink-0"
      style={{ background: RISK_META[risk].color }}
      aria-label={RISK_META[risk].label}
    />
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  if (risk === "none") return null;
  const m = RISK_META[risk];
  return (
    <Badge tone={m.tone}>
      <ShieldAlert /> {m.label}
    </Badge>
  );
}

const STATUS_META: Record<
  ClauseStatus,
  { label: string; tone: "neutral" | "primary" | "merlin" | "high" | "low" | "med"; icon: LucideIcon }
> = {
  standard: { label: "Standard", tone: "neutral", icon: CircleDot },
  modified: { label: "Modified", tone: "med", icon: AlertTriangle },
  risk: { label: "At risk", tone: "high", icon: ShieldAlert },
  missing: { label: "Missing", tone: "high", icon: AlertTriangle },
  "ai-generated": { label: "AI-drafted", tone: "merlin", icon: Sparkles },
  approved: { label: "Approved", tone: "low", icon: CheckCircle2 },
};

export function ClauseStatusBadge({ status }: { status: ClauseStatus }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <Badge tone={m.tone}>
      <Icon /> {m.label}
    </Badge>
  );
}

const CONF_META: Record<
  FieldConfidence,
  { label: string; tone: "low" | "primary" | "high" | "med"; dot: string }
> = {
  auto: { label: "Auto-imported", tone: "primary", dot: "var(--merlin)" },
  manual: { label: "Manual", tone: "primary", dot: "var(--muted-foreground)" },
  missing: { label: "Missing", tone: "high", dot: "var(--risk-high)" },
  review: { label: "Needs review", tone: "med", dot: "var(--risk-med)" },
};

export function ConfidencePill({ c }: { c: FieldConfidence }) {
  const m = CONF_META[c];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const tone =
    value >= 90 ? "var(--risk-low)" : value >= 75 ? "var(--merlin)" : "var(--risk-med)";
  return (
    <span className="inline-flex items-center gap-1.5" title={`Confidence ${value}%`}>
      <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
        {value}%
      </span>
    </span>
  );
}

/* Toast host — bottom right */
export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  const toneStyles: Record<string, string> = {
    default: "bg-card border-border",
    merlin: "bg-card border-merlin-border",
    success: "bg-card border-risk-low/40",
    warning: "bg-card border-risk-med/40",
    destructive: "bg-card border-destructive/40",
  };
  const iconFor: Record<string, React.ReactNode> = {
    default: <FileText className="size-4 text-muted-foreground" />,
    merlin: <Sparkles className="size-4 text-merlin" />,
    success: <CheckCircle2 className="size-4 text-success" />,
    warning: <AlertTriangle className="size-4 text-warning" />,
    destructive: <ShieldAlert className="size-4 text-destructive" />,
  };
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[340px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3 shadow-lg animate-in-up",
            toneStyles[t.tone]
          )}
        >
          <div className="mt-0.5">{iconFor[t.tone]}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{t.title}</div>
            {t.detail && (
              <div className="mt-0.5 text-xs text-muted-foreground">{t.detail}</div>
            )}
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
