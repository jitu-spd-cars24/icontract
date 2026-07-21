import * as React from "react";
import { cn } from "@/lib/utils";
import { RECENT_CONTRACTS } from "@/lib/data";
import { ArrowUpRight, ArrowDownRight, ArrowRight, TrendingUp } from "lucide-react";

/* Shared card shell — matches the clean NextGen home language */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-5 shadow-xs", className)}>
      {children}
    </div>
  );
}
function CardHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
      {action ?? <ArrowRight className="size-4 text-muted-foreground/70" />}
    </div>
  );
}

/* Multi-segment SVG donut */
function Donut({
  segments,
  size = 128,
  stroke = 14,
  centerLabel,
  centerValue,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`}
              strokeDashoffset={-acc}
              strokeLinecap="round"
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerLabel && <span className="text-[11px] text-muted-foreground">{centerLabel}</span>}
        {centerValue && <span className="text-[22px] font-semibold tabular-nums leading-none">{centerValue}</span>}
      </div>
    </div>
  );
}

/* 1 — Portfolio value with trend mini-bars */
function PortfolioValueCard() {
  const bars = [46, 58, 52, 74];
  const labels = ["Apr", "May", "Jun", "Jul"];
  const max = Math.max(...bars);
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-medium text-muted-foreground">₹</span>
            <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] tabular-nums">18.4</span>
            <span className="text-[15px] font-medium text-muted-foreground">Cr</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Active portfolio value, up <span className="font-semibold text-success">+₹2.1 Cr</span> this quarter.
          </p>
        </div>
        <div className="flex h-16 items-end gap-1.5">
          {bars.map((b, i) => (
            <span
              key={i}
              className="w-3 rounded-full"
              style={{
                height: `${(b / max) * 100}%`,
                background: i === bars.length - 1 ? "var(--primary)" : "color-mix(in oklch, var(--muted-foreground) 20%, transparent)",
              }}
              title={labels[i]}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

/* 2 — Approval readiness gauge */
function ReadinessGaugeCard() {
  const ready = 16;
  const total = 20;
  const pct = Math.round((ready / total) * 100);
  const ring = `conic-gradient(var(--primary) ${pct * 3.6}deg, color-mix(in oklch, var(--muted-foreground) 18%, transparent) 0deg)`;
  return (
    <Card>
      <CardHead title="Approval readiness" />
      <div className="flex items-center gap-4">
        <div className="relative grid size-[92px] shrink-0 place-items-center">
          <span
            className="size-[92px] rounded-full"
            style={{ background: ring, WebkitMask: "radial-gradient(farthest-side, transparent 62%, #000 64%)", mask: "radial-gradient(farthest-side, transparent 62%, #000 64%)" }}
          />
          <span className="absolute text-[20px] font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold">
            {ready} <span className="font-normal text-muted-foreground">/ {total} ready</span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            4 drafts still need policy fixes before they can be routed.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* 3 — On-time approval rate */
function OnTimeCard() {
  const people = ["PN", "RM", "AR"];
  return (
    <Card>
      <CardHead title="On-time approval rate" />
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] tabular-nums">92%</span>
            <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-success">
              <ArrowUpRight className="size-3.5" /> 12%
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Contracts approved within SLA this quarter.</p>
        </div>
        <div className="flex -space-x-2">
          {people.map((p) => (
            <span key={p} className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
              {p}
            </span>
          ))}
          <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-accent text-[10px] font-semibold text-muted-foreground">+9</span>
        </div>
      </div>
    </Card>
  );
}

/* 4 — Portfolio by status donut + legend */
function StatusDonutCard() {
  const rows = [
    { label: "Draft", status: "Draft", color: "var(--risk-med)", delta: -2, down: true },
    { label: "In Review", status: "In Review", color: "var(--merlin)", delta: 3, down: false },
    { label: "In Approval", status: "In Approval", color: "var(--primary)", delta: 1, down: false },
    { label: "Signed", status: "Signed", color: "var(--risk-low)", delta: 5, down: false },
  ].map((r) => ({ ...r, count: RECENT_CONTRACTS.filter((c) => c.status === r.status).length }));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <Card>
      <CardHead title="Portfolio by status" />
      <div className="flex items-center gap-5">
        <Donut segments={rows.map((r) => ({ value: r.count, color: r.color }))} centerLabel="Total" centerValue={String(total)} />
        <div className="min-w-0 flex-1 space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: r.color }} />
              <span className="flex-1 truncate text-[13px] text-muted-foreground">{r.label}</span>
              <span className="text-[14px] font-semibold tabular-nums">{r.count}</span>
              <span className={cn("inline-flex w-11 items-center justify-end gap-0.5 text-[12px] font-medium", r.down ? "text-risk-high" : "text-success")}>
                {r.down ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                {Math.abs(r.delta)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* 5 — Contracts signed by month (stacked bars) */
function SignedByMonthCard({ className }: { className?: string }) {
  const data = [
    { m: "Feb", nw: 4, rn: 2 },
    { m: "Mar", nw: 6, rn: 3 },
    { m: "Apr", nw: 5, rn: 4 },
    { m: "May", nw: 8, rn: 3 },
    { m: "Jun", nw: 7, rn: 5 },
  ];
  const max = Math.max(...data.map((d) => d.nw + d.rn));
  return (
    <Card className={className}>
      <CardHead
        title="Contracts signed by month"
        action={
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-success">
            <TrendingUp className="size-3.5" /> +18% vs H1
          </span>
        }
      />
      <div className="flex h-40 items-stretch justify-between gap-3 sm:gap-5">
        {data.map((d) => {
          const totalH = ((d.nw + d.rn) / max) * 100;
          const nwShare = d.nw / (d.nw + d.rn);
          return (
            <div key={d.m} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end justify-center">
                <div className="flex w-full max-w-[46px] flex-col justify-end overflow-hidden rounded-lg" style={{ height: `${totalH}%` }}>
                  <div style={{ height: `${(1 - nwShare) * 100}%`, background: "color-mix(in oklch, var(--primary) 28%, transparent)" }} />
                  <div style={{ height: `${nwShare * 100}%`, background: "var(--primary)" }} />
                </div>
              </div>
              <span className="text-[12px] text-muted-foreground">{d.m}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-5 border-t border-border/60 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="size-2.5 rounded-[3px]" style={{ background: "var(--primary)" }} /> New
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="size-2.5 rounded-[3px]" style={{ background: "color-mix(in oklch, var(--primary) 28%, transparent)" }} /> Renewal
        </span>
      </div>
    </Card>
  );
}

export function CommandWidgets() {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      <PortfolioValueCard />
      <ReadinessGaugeCard />
      <OnTimeCard />
      <StatusDonutCard />
      <SignedByMonthCard className="lg:col-span-2" />
    </section>
  );
}
