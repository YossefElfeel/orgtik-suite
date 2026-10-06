"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import PriceDisplay from "@/components/shared/PriceDisplay";
import type { ZoneMoneyGroup } from "@/types/money";

export type ZoneMoneyStackProps = {
  groups: ZoneMoneyGroup[] | null | undefined;
  className?: string;
  amountClassName?: string;
  showZoneName?: boolean;
  emptyLabel?: string;
  /** When true, show currency code next to each amount. */
  showCode?: boolean;
};

function ZoneMoneyStack({
  groups,
  className,
  amountClassName,
  showZoneName = true,
  emptyLabel,
  showCode = true,
}: ZoneMoneyStackProps) {
  const t = useTranslations("common");
  const items = groups ?? [];

  if (items.length === 0) {
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>
        {emptyLabel ?? t("noMoneyInZones")}
      </span>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {items.map((group) => {
        const key = group.zoneId ?? `unassigned-${group.currencyCode}`;
        return (
          <li
            key={key}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
          >
            {showZoneName ? (
              <span className="text-muted-foreground text-sm">
                {group.zoneName}
              </span>
            ) : null}
            <PriceDisplay
              price={group.amount}
              currency={group.currencyCode}
              className={amountClassName}
              showCode={showCode}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default ZoneMoneyStack;
