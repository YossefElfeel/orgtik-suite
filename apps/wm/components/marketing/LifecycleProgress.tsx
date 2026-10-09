"use client";
import type { ReactNode } from "react";
export function LifecycleProgress({
  label,
  stages,
  current,
  visited,
  outcome,
}: {
  label: string;
  stages: { key: string; label: string }[];
  current: string;
  visited: string[];
  outcome: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="rounded-card border border-line bg-raised p-4"
    >
      <ol className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <li
            key={stage.key}
            aria-current={current === stage.key ? "step" : undefined}
            className={`rounded-pill border px-3 py-2 text-body-sm ${current === stage.key ? "border-focus bg-brand-subtle font-semibold text-fg-brand" : visited.includes(stage.key) ? "border-line-strong text-fg" : "border-line text-fg-muted"}`}
          >
            {stage.label}
          </li>
        ))}
      </ol>
      {!stages.some((stage) => stage.key === current) ? (
        <div className="mt-3">{outcome}</div>
      ) : null}
    </section>
  );
}
