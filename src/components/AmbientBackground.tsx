import { cn } from "@/lib/utils";

/**
 * Reusable ambient backdrop for AI surfaces.
 * Two slowly-drifting mesh layers (mostly neutral, one Merlin-violet highlight),
 * a fine grain to kill banding, and a fade so it dissolves into the canvas.
 * Purely decorative — pointer-events:none, behind content, theme-aware,
 * and frozen under prefers-reduced-motion.
 */
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden", className)}
      style={{ height: "100%" }}
    >
      <div className="ambient-layer ambient-a" />
      <div className="ambient-layer ambient-b" />
      <div className="ambient-grain" />
      <div className="ambient-fade" />
    </div>
  );
}
