import * as React from "react";

/**
 * Rotating dot-sphere (anime.js "LMrRNW" style), recreated dependency-free
 * with CSS 3D transforms. Dots are distributed with a Fibonacci spiral so
 * they're evenly spread; the rotor spins in 3D and each dot gently pulses.
 * Decorative, theme-aware (uses --merlin), reduced-motion safe.
 */
export function SphereAnimation({ size = 152, dots = 150 }: { size?: number; dots?: number }) {
  const radius = size * 0.42;
  const points = React.useMemo(() => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: dots }, (_, i) => {
      const y = 1 - (i / (dots - 1)) * 2; // -1 .. 1
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      return {
        x: Math.cos(theta) * r * radius,
        y: y * radius,
        z: Math.sin(theta) * r * radius,
        delay: ((i % 24) / 24) * 3.2,
      };
    });
  }, [dots, radius]);

  return (
    <div className="sphere-scene" style={{ width: size, height: size }} aria-hidden="true">
      <div className="sphere-glow" />
      <div className="sphere-rotor">
        {points.map((p, i) => (
          <span
            key={i}
            className="sphere-dot"
            style={{
              transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px)`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
