"use client";

import type { CategoryZone } from "@/types/categories";
import { SectionCard } from "@/components/shared/SectionCard";
import {
  formatCategoryPrice,
  formatCategoryZoneAreas,
} from "@/lib/categories";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTranslations } from "next-intl";

type Props = {
  zones: CategoryZone[];
};

export default function CategoryZones({ zones }: Props) {
  const tCat = useTranslations("planManagement.categories");
  const tDetails = useTranslations("planManagement.details");
  const displayText = useCatalogDisplayText();

  return (
    <SectionCard title={tDetails("zonesServed", { count: zones.length })}>
      {zones.length === 0 ? (
        <p className="py-6 text-center text-14 text-muted-foreground">
          {tCat("noZonesLinked")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border">
          {zones.map((zone) => (
            <li
              key={zone.id}
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-16 font-semibold text-foreground">
                  {displayText(zone.name as any)}
                </p>
                <p className="truncate text-14 text-secondary">
                  {formatCategoryZoneAreas(zone)}
                </p>
              </div>
              <span className="shrink-0 text-16 font-semibold text-foreground">
                {formatCategoryPrice(
                  zone.price,
                  zone.currencySymbol || zone.currencyCode,
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
