"use client";

import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Icon } from "@iconify/react";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";
import type { FeatureFormValues } from "@/schemas/features";
import type { Zone } from "@/types/zones";

type Props = {
  form: UseFormReturn<FeatureFormValues>;
  availableZones: Zone[];
};

export default function FeatureZonePricing({ form, availableZones }: Props) {
  const t = useTranslations("planManagement.form");
  const tFeatures = useTranslations("planManagement.features");
  const zones = form.watch("zones");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [pendingCountryByZone, setPendingCountryByZone] = useState<
    Record<string, string>
  >({});

  const zoneMetaById = useMemo(
    () =>
      new Map(
        availableZones.map((zone) => [
          zone.id,
          {
            id: zone.id,
            name: zone.name,
            currency: zone.defaultCurrency.code,
            countries: zone.countries.map((country) => ({
              code: country.code,
              name: country.name,
            })),
          },
        ]),
      ),
    [availableZones],
  );

  const toggleExpanded = (zoneId: string) => {
    setExpandedIds((current) =>
      current.includes(zoneId)
        ? current.filter((id) => id !== zoneId)
        : [...current, zoneId],
    );
  };

  const updateZone = (
    zoneId: string,
    patch: Partial<FeatureFormValues["zones"][number]>,
  ) => {
    const next = zones.map((zone) =>
      zone.id === zoneId ? { ...zone, ...patch } : zone,
    );
    form.setValue("zones", next, { shouldDirty: true, shouldValidate: true });
  };

  const updateOverridePrice = (
    zoneId: string,
    countryCode: string,
    price: number,
  ) => {
    const next = zones.map((zone) => {
      if (zone.id !== zoneId) return zone;
      return {
        ...zone,
        overrides: zone.overrides.map((override) =>
          override.countryCode === countryCode
            ? { ...override, price }
            : override,
        ),
      };
    });
    form.setValue("zones", next, { shouldDirty: true, shouldValidate: true });
  };

  const removeOverride = (zoneId: string, countryCode: string) => {
    const next = zones.map((zone) => {
      if (zone.id !== zoneId) return zone;
      return {
        ...zone,
        overrides: zone.overrides.filter(
          (override) => override.countryCode !== countryCode,
        ),
      };
    });
    form.setValue("zones", next, { shouldDirty: true, shouldValidate: true });
  };

  const addOverride = (zoneId: string) => {
    const countryCode = pendingCountryByZone[zoneId];
    if (!countryCode) return;

    const meta = zoneMetaById.get(zoneId);
    const country = meta?.countries.find((item) => item.code === countryCode);
    if (!country) return;

    const zone = zones.find((item) => item.id === zoneId);
    if (!zone) return;
    if (zone.overrides.some((item) => item.countryCode === countryCode)) return;

    updateZone(zoneId, {
      overrides: [
        ...zone.overrides,
        {
          countryCode: country.code,
          countryName: country.name,
          price: zone.price,
        },
      ],
    });
    setPendingCountryByZone((current) => ({ ...current, [zoneId]: "" }));
  };

  if (zones.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        {t("noZonesAvailable")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {tFeatures("zonePricing")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {tFeatures("zonePricingDesc")}
        </p>
      </div>

      <div className="space-y-3">
        {zones.map((zone) => {
          const meta = zoneMetaById.get(zone.id);
          if (!meta) return null;

          const expanded = expandedIds.includes(zone.id);
          const availableCountries = meta.countries.filter(
            (country) =>
              !zone.overrides.some(
                (override) => override.countryCode === country.code,
              ),
          );

          return (
            <div
              key={zone.id}
              className="overflow-hidden rounded-xl border border-border"
            >
              <div className="flex items-center gap-3 px-3 py-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(zone.id)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={expanded ? "Collapse zone" : "Expand zone"}
                >
                  <ChevronDownIcon
                    className={cn(
                      "size-4 transition-transform",
                      expanded ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>

                <Checkbox
                  checked={zone.enabled}
                  onCheckedChange={(checked) =>
                    updateZone(zone.id, { enabled: checked === true })
                  }
                  className="size-4.5"
                  aria-label={`Enable ${meta.name}`}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {meta.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {meta.countries.map((country) => country.code).join(", ")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={Number.isFinite(zone.price) ? zone.price : ""}
                    placeholder="0"
                    disabled={!zone.enabled}
                    onChange={(event) => {
                      const raw = event.target.value;
                      updateZone(zone.id, {
                        price: raw === "" ? 0 : Number(raw || 0),
                      });
                    }}
                    className={cn(formStyles.input, "h-9 w-28 text-right")}
                    aria-label={`${meta.name} base price`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {meta.currency}
                  </span>
                </div>
              </div>

              {expanded ? (
                <div className="space-y-4 border-t border-border bg-muted/20 px-4 py-4">
                  <p className="text-xs text-muted-foreground">
                    {t("countriesNotListed")}{" "}
                    <span className="font-semibold text-foreground">
                      {meta.currency} {zone.price.toFixed(2)}
                    </span>
                    .
                  </p>

                  <ul className="space-y-2">
                    {zone.overrides.map((override) => {
                      const matchesBase = override.price === zone.price;

                      return (
                        <li
                          key={override.countryCode}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {override.countryName}
                            </p>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={
                              Number.isFinite(override.price)
                                ? override.price
                                : ""
                            }
                            placeholder="0"
                            onChange={(event) => {
                              const raw = event.target.value;
                              updateOverridePrice(
                                zone.id,
                                override.countryCode,
                                raw === "" ? 0 : Number(raw || 0),
                              );
                            }}
                            className={cn(
                              formStyles.input,
                              "h-9 w-28 text-right",
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {matchesBase ? t("matchesBase") : t("custom")}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              removeOverride(zone.id, override.countryCode)
                            }
                            className="text-red transition-colors hover:text-red/80"
                            aria-label={`Remove ${override.countryName} override`}
                          >
                            <Icon
                              icon="solar:trash-bin-trash-linear"
                              className="size-4.5"
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-48 flex-1 space-y-1.5">
                      <p className={formStyles.label}>{t("country")}</p>
                      <select
                        value={pendingCountryByZone[zone.id] ?? ""}
                        onChange={(event) =>
                          setPendingCountryByZone((current) => ({
                            ...current,
                            [zone.id]: event.target.value,
                          }))
                        }
                        className={formStyles.select}
                      >
                        <option value="">{t("pickCountry")}</option>
                        {availableCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addOverride(zone.id)}
                      disabled={!pendingCountryByZone[zone.id]}
                    >
                      <Icon icon="solar:add-circle-linear" />
                      {t("addOverride")}
                    </Button>
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
