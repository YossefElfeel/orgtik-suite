"use client";

import { cn } from "@/lib/utils";

type Props = {
  code: string;
  highlight?: boolean;
};

export default function ZoneCodeChip({ code, highlight = false }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-12 font-medium uppercase",
        highlight ? "bg-orange/10 text-orange" : "bg-muted text-secondary",
      )}
    >
      {code}
    </span>
  );
}
