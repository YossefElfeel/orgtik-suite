"use client";

// Amounts in more than one currency (one per zone), one per line. They are never added together:
// there is no exchange-rate snapshot to do that honestly (SAL-128).
import { useTeamFormat } from "@/lib/commissions";
import type { CurrencyAmount } from "@/types/commissions";

export default function MoneyList({ amounts, className }: { amounts: CurrencyAmount[]; className?: string }) {
  const f = useTeamFormat();
  if (!amounts.length) return <span className={className}>{f.number(0)}</span>;
  return (
    <ul className={className ? `flex flex-col gap-0.5 ${className}` : "flex flex-col gap-0.5"}>
      {amounts.map((a) => (
        <li key={`${a.currency}-${a.label ?? ""}`} className="tabular-nums">
          {f.money(a.amount, a.currency)}
          {a.label && amounts.length > 1 ? <span dir="auto" className="ms-2 text-caption font-normal text-fg-subtle">{a.label}</span> : null}
        </li>
      ))}
    </ul>
  );
}
