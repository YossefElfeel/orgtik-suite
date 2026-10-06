"use client";
import { useTranslations } from "next-intl";

import { useMemo, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formStyles } from "@/lib/form-styles";
import ZoneCodeChip from "@/components/pages/plan-management/zone/ZoneCodeChip";
import { cn } from "@/lib/utils";
import type { Zone } from "@/types/zones";

type Props = {
  availableZones: Zone[];
  values: any[]; // using any for the form values array for simplicity or infer from schema
  onChange: (values: any[]) => void;
};

export default function PackageZonePricing({
  availableZones,
  values,
  onChange,
}: Props) {
  const tCommon = useTranslations("common");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const zoneMetaById = useMemo(() => {
    return new Map(availableZones.map((zone) => [zone.id, zone]));
  }, [availableZones]);

  const toggleExpanded = (zoneId: string) => {
    setExpandedIds((current) =>
      current.includes(zoneId)
        ? current.filter((id) => id !== zoneId)
        : [...current, zoneId],
    );
  };

  const updatePrice = (zoneId: string, raw: string) => {
    const next = values.map((item) => {
      if (item.zoneId !== zoneId) return item;
      if (raw.trim() === "") return { ...item, price: null };
      const parsed = Number(raw);
      return {
        ...item,
        price: Number.isFinite(parsed) ? parsed : item.price,
      };
    });
    onChange(next);
  };

  const toggleZoneActive = (zoneId: string) => {
    const next = values.map((item) => {
      if (item.zoneId !== zoneId) return item;
      return { ...item, isActive: !item.isActive };
    });
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground">
          {tCommon("zonePricing")}
        </h3>
        <p className="text-12 leading-5 text-muted-foreground">
          {tCommon("setBundlePricePerZone")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {values.map((item, index) => {
          const meta = zoneMetaById.get(item.zoneId);
          if (!meta) return null;

          const expanded = expandedIds.includes(item.zoneId);

          return (
            <div
              key={item.zoneId}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm flex flex-col"
            >
              <div className="flex items-center px-2 py-1">
                <button
                  type="button"
                  onClick={() => toggleExpanded(item.zoneId)}
                  className="flex w-10 shrink-0 items-center justify-center text-foreground hover:text-muted-foreground transition-colors"
                  aria-label={expanded ? "Collapse zone" : "Expand zone"}
                >
                  <ChevronRightIcon
                    className={cn(
                      "size-5 transition-transform",
                    expanded ? "rotate-90" : "rotate-0",
                  )}
                />
              </button>

              <div className="flex flex-1 items-center gap-3 px-2 py-3.5 pr-4">
                <Checkbox
                  checked={item.isActive}
                  onCheckedChange={() => toggleZoneActive(item.zoneId)}
                  className="size-5 rounded-[4px] data-[state=checked]:bg-[#4b3cff] data-[state=checked]:border-[#4b3cff]"
                  aria-label={`Enable ${meta.name}`}
                />

                <div className="min-w-0 flex-1 ml-1">
                  <p className="text-[15px] font-medium text-foreground flex items-center gap-2">
                    {meta.name}
                    <span className="px-2 py-0.5 text-[11px] font-medium h-[22px] flex items-center rounded-full bg-muted/60 text-foreground">
                      {meta.defaultCurrency?.code}
                    </span>
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground mt-0.5">
                    {meta.countries?.map((c: any) => c.code).join(", ")}
                  </p>
                </div>

                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.price ?? ""}
                  placeholder="0"
                  onChange={(event) =>
                    updatePrice(item.zoneId, event.target.value)
                  }
                  className={cn(formStyles.input, "h-11 w-28 text-left rounded-xl px-4 border-border/80 shadow-sm font-medium")}
                  aria-label={`${meta.name} price`}
                />
              </div>
              </div>

              {expanded ? (
                <div className="border-t border-border bg-muted/30 px-4 py-4">
                  <div className="flex flex-wrap gap-2 ml-14">
                    {meta.countries?.map((country: any) => (
                      <Badge key={country.code} variant="secondary" className="font-normal text-xs bg-white text-foreground">
                        {country.name} {country.nativeName ? `(${country.nativeName})` : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
