"use client";

// A post label: its name and the colour its owner picked (stored with the label, so it is data,
// not a theme colour). The name carries the meaning; the dot only helps scanning.
import { Tag } from "@orgtik/ui";

export function LabelTag({ name, color, onRemove }: { name: string; color?: string | null; onRemove?: () => void }) {
  return (
    <Tag onRemove={onRemove}>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        {color ? <span aria-hidden className="size-2 shrink-0 rounded-pill" style={{ backgroundColor: color }} /> : null}
        <span className="truncate">{name}</span>
      </span>
    </Tag>
  );
}
