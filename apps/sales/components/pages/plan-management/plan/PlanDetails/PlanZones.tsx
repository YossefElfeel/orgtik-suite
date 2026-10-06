"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { PlanDto, PlanZoneDetail } from "@/types/plans";
import { SectionCard } from "@/components/shared/SectionCard";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

type Props = {
  plan: PlanDto;
};

function formatMoney(currency: string, value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  const amount = Number.isFinite(parsed) ? parsed.toFixed(2) : (value ?? "0.00");
  return `${currency} ${amount}`;
}

export function PlanZones({ plan }: Props) {
  const [expandedIds, setExpandedIds] = useState<string[]>(
    plan.zoneDetails[0] ? [plan.zoneDetails[0].id] : [],
  );
  const { isSalesman } = useRole();
  const t = useTranslations("planManagement.details");

  const toggleExpanded = (zoneId: string) => {
    setExpandedIds((current) =>
      current.includes(zoneId)
        ? current.filter((id) => id !== zoneId)
        : [...current, zoneId],
    );
  };

  return (
    <SectionCard
      title={t("zonesServed", { count: plan.zoneDetails.length })}
      action={
        !isSalesman ? (
          <button
            type="button"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("editZonesServed")}
          </button>
        ) : undefined
      }
    >
      <ul className="space-y-2">
        {plan.zoneDetails.map((zone) => (
          <ZoneRow
            key={zone.id}
            zone={zone}
            expanded={expandedIds.includes(zone.id)}
            onToggleExpanded={() => toggleExpanded(zone.id)}
          />
        ))}
      </ul>
    </SectionCard>
  );
}

function ZoneRow({
  zone,
  expanded,
  onToggleExpanded,
}: {
  zone: PlanZoneDetail;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const t = useTranslations("planManagement.details");

  return (
    <li className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center gap-3 px-3 py-3">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={expanded ? t("collapseZone") : t("expandZone")}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform",
              expanded ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {zone.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {zone.countries.map((country) => country.countryName).join(", ")}
          </p>
        </div>

        <span className="shrink-0 text-sm font-semibold text-secondary">
          {formatMoney(zone.currencyCode, zone.basePrice)}
        </span>
      </div>

      {expanded ? (
        <ul className="space-y-2 border-t border-border bg-muted/20 px-4 py-3">
          {zone.countries.map((country) => (
            <li
              key={country.countryCode}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {country.countryName}
                </p>
              </div>
              <span className="text-sm font-semibold text-secondary">
                {formatMoney(
                  zone.currencyCode,
                  country.overridePrice ?? zone.basePrice,
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
