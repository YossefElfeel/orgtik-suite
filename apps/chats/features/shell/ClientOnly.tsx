"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * SOMION HQ - CLIENT-ONLY GATE
 *
 * The entire workspace is client-side mock state seeded at module load, and the
 * demo clock is captured when that module first runs. The server process and the
 * browser therefore capture different clocks, which would make every rendered
 * timestamp a potential hydration mismatch - intermittent, timing-dependent, and
 * exactly the kind of console error nobody wants appearing mid-demo.
 *
 * Rather than paper over it per timestamp, the prototype is honest about what it
 * is: a client-rendered application. The server emits the shape of the shell -
 * the top bar, the rail, the sidebar - so the first paint already looks like
 * the app, and the real interface mounts in the browser over it.
 *
 * This disappears with the backend, when data arrives from an API and the server
 * has something real to render.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <ShellSkeleton />;
  return <>{children}</>;
}

/** Static, no state, no data: what the shell looks like before it is alive. */
function ShellSkeleton() {
  const block = (w: number | string, h: number, r = 6): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: r,
    background: "var(--color-surface-sunken)",
    flexShrink: 0,
  });
  return (
    <div aria-hidden="true" className="flex h-[100dvh] w-full flex-col overflow-hidden" style={{ background: "var(--color-ground)" }}>
      <div
        className="flex h-[52px] shrink-0 items-center gap-3 px-4"
        style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-hairline)" }}
      >
        <span style={{ ...block(28, 28, 8), background: "var(--color-accent-soft)" }} />
        <span style={block(64, 12)} />
        <span style={block(120, 20, 999)} />
        <span className="mx-auto" style={{ ...block(440, 34, 10), maxWidth: "40%" }} />
        <span style={block(72, 34, 10)} />
        <span style={block(34, 34, 10)} />
        <span style={block(128, 34, 999)} />
      </div>
      <div className="flex min-h-0 flex-1">
        <div
          className="hidden w-[56px] shrink-0 flex-col items-center gap-2 py-3 md:flex"
          style={{ background: "var(--color-rail)", borderInlineEnd: "1px solid var(--color-hairline)" }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} style={block(24, 24, 7)} />
          ))}
        </div>
        <div className="hidden w-[248px] shrink-0 flex-col gap-2 px-3 py-4 lg:flex" style={{ borderInlineEnd: "1px solid var(--color-hairline)" }}>
          {[132, 96, 118, 104, 110].map((w, i) => (
            <span key={i} className="flex items-center gap-2.5 px-2" style={{ height: 36 }}>
              <span style={block(16, 16, 5)} />
              <span style={block(w, 12)} />
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1" />
      </div>
    </div>
  );
}
