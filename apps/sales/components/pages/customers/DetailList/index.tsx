// Label and value pairs on a record's page, as a description list, so each value is read with its
// label. Empty values show a dash in the subtle ink, never a blank.
import type { ReactNode } from "react";

export type DetailItem = { label: ReactNode; value: ReactNode; wide?: boolean };

export default function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className={item.wide ? "flex min-w-0 flex-col gap-1 sm:col-span-2" : "flex min-w-0 flex-col gap-1"}>
          <dt className="text-caption text-fg-muted">{item.label}</dt>
          <dd className="min-w-0 break-words text-body text-fg">{item.value == null || item.value === "" ? <span className="text-fg-subtle">—</span> : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
