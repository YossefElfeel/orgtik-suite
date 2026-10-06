"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { PlanDto } from "@/types/plans";
import { SectionCard } from "@/components/shared/SectionCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { getPlanPricingEntries } from "@/lib/plan-pricing";

type Props = {
  plan: PlanDto;
};

function formatMoney(symbol: string, value: string) {
  const parsed = Number.parseFloat(value);
  const amount = Number.isFinite(parsed) ? parsed.toFixed(2) : value;

  if (symbol === "$" || symbol === "€") {
    return `${symbol}${amount}`;
  }

  return `${symbol} ${amount}`;
}

export function PlanPricing({ plan }: Props) {
  const pricingEntries = getPlanPricingEntries(plan);
  const durations = useMemo(() => {
    const unique = new Map<
      number,
      (typeof pricingEntries)[number]["duration"]
    >();

    for (const entry of pricingEntries) {
      unique.set(entry.duration.months, entry.duration);
    }

    return Array.from(unique.values()).sort(
      (left, right) => left.months - right.months,
    );
  }, [pricingEntries]);

  const [selectedMonths, setSelectedMonths] = useState(
    durations[0]?.months ?? 12,
  );
  
  const t = useTranslations("planManagement.details");
  const tCommon = useTranslations("common");

  const zonePrices = useMemo(
    () =>
      pricingEntries.filter(
        (entry) => entry.duration.months === selectedMonths,
      ),
    [pricingEntries, selectedMonths],
  );

  const activeZone = plan.zoneDetails[0];
  const activeZoneLabel = activeZone
    ? `${activeZone.name} (${activeZone.currencyCode})`
    : "—";

  if (zonePrices.length === 0) return null;

  return (
    <SectionCard title={t("pricingByDuration")}>
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 px-3.5 py-3 text-sm text-muted-foreground">
          <Icon
            icon="solar:global-linear"
            className="mt-0.5 size-4 shrink-0 text-secondary"
          />
          <p>
            {t("activeZoneIs")}
            <span className="font-semibold text-foreground">
              {activeZoneLabel}
            </span>
            {t("activeZoneHighlight")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {durations.map((duration) => {
            const isActive = selectedMonths === duration.months;
            const discount = Number.parseFloat(duration.discountPercentage);

            return (
              <Button
                key={duration.durationId}
                type="button"
                onClick={() => setSelectedMonths(duration.months)}
                variant={isActive ? "default" : "outline"}
              >
                {duration.months} {duration.months === 1 ? tCommon("month") : tCommon("months")}
                {discount > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isActive
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-muted text-secondary",
                    )}
                  >
                    -{discount}%
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {zonePrices.map((zone) => {
            const isActiveZone = zone.zoneId === activeZone?.id;

            return (
              <article
                key={`${zone.zoneId}-${zone.duration.durationId}`}
                className={cn(
                  "rounded-xl border px-4 py-3.5",
                  isActiveZone
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {zone.zoneName}
                      </h3>
                      {isActiveZone ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {t("yourZone")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("base")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(
                        zone.currencySymbol,
                        zone.effectiveMonthlyPrice,
                      )}{" "}
                      / {tCommon("month")} x {selectedMonths}{tCommon("month")[0].toUpperCase()}
                    </p>
                  </div>

                  <p className="shrink-0 text-base font-semibold text-foreground">
                    {formatMoney(zone.currencySymbol, zone.discountedTotal)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
