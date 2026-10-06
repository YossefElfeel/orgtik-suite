"use client";

import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Icon } from "@iconify/react";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PlanFormValues } from "@/schemas/plans";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";
import { useGetZonesQuery } from "@/redux/features/zones/zonesApi";
import { useGetPlanPricingPreflightMutation } from "@/redux/features/plans/plansApi";
import type { PlanPricingPreflightZone } from "@/types/plans";
import { useTranslations } from "next-intl";

type Props = {
  form: UseFormReturn<PlanFormValues>;
  enabled?: boolean;
};

function parseSuggestedPrice(value: string | null | undefined) {
  if (value == null || value === "") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyAmount(value: number, minorUnits = 2) {
  return value.toFixed(Math.max(0, minorUnits));
}

export function ZonePricingStep({ form, enabled = true }: Props) {
  const zones = form.watch("zones");
  const featureIds = form.watch("featureIds");
  const durations = form.watch("durations");
  const allowInstallments = form.watch("allowInstallments");
  const installmentPlans = form.watch("installmentPlans");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [pendingCountryByZone, setPendingCountryByZone] = useState<
    Record<string, string>
  >({});
  const [preflightByZoneId, setPreflightByZoneId] = useState<
    Map<string, PlanPricingPreflightZone>
  >(new Map());

  const { data: zonesResponse } = useGetZonesQuery(
    { page: 1, limit: 100 },
    { skip: !enabled },
  );
  const [fetchPreflight, { isLoading: isPreflightLoading }] =
    useGetPlanPricingPreflightMutation();
  const t = useTranslations("planManagement.form");
  const zonesError = form.formState.errors.zones;
  const zonesErrorMessage =
    typeof zonesError?.message === "string"
      ? zonesError.message
      : typeof zonesError?.root?.message === "string"
        ? zonesError.root.message
        : null;

  const zoneMetaById = useMemo(() => {
    const items = zonesResponse?.data.items ?? [];
    return new Map(
      items.map((zone) => [
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
    );
  }, [zonesResponse?.data.items]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const applyPreflight = async () => {
      try {
        const response = await fetchPreflight({
          featureIds,
          planDurationIds: durations,
          installmentDurationIds: allowInstallments ? installmentPlans : [],
        }).unwrap();

        if (cancelled) {
          return;
        }

        setPreflightByZoneId(
          new Map(response.data.zones.map((zone) => [zone.zoneId, zone])),
        );
      } catch {
        if (!cancelled) {
          setPreflightByZoneId(new Map());
        }
      }
    };

    void applyPreflight();

    return () => {
      cancelled = true;
    };
  }, [
    allowInstallments,
    durations,
    enabled,
    featureIds,
    fetchPreflight,
    installmentPlans,
  ]);

  const hasSuggestedPrices = Array.from(preflightByZoneId.values()).some(
    (zone) =>
      zone.unpricedFeatureCount === 0 &&
      zone.suggestedBasePrice != null &&
      zone.suggestedBasePrice !== "",
  );

  const applySuggestedAsDefault = () => {
    const nextZones = zones.map((zone) => {
      const suggestion = preflightByZoneId.get(zone.id);
      if (!suggestion || suggestion.unpricedFeatureCount > 0) {
        return zone;
      }

      const suggestedBase = parseSuggestedPrice(suggestion.suggestedBasePrice);
      const suggestedByCountry = new Map(
        suggestion.countries.map((country) => [country.countryCode, country]),
      );

      return {
        ...zone,
        price: suggestedBase,
        priceDirty: true,
        overrides: zone.overrides.map((override) => {
          const suggestedCountry = suggestedByCountry.get(override.countryCode);
          if (!suggestedCountry) {
            return { ...override, priceDirty: true };
          }

          return {
            ...override,
            countryName: suggestedCountry.countryName || override.countryName,
            price: parseSuggestedPrice(suggestedCountry.suggestedPrice),
            priceDirty: true,
          };
        }),
      };
    });

    form.setValue("zones", nextZones, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const toggleExpanded = (zoneId: string) => {
    setExpandedIds((current) =>
      current.includes(zoneId)
        ? current.filter((id) => id !== zoneId)
        : [...current, zoneId],
    );
  };

  const updateZone = (
    zoneId: string,
    patch: Partial<PlanFormValues["zones"][number]>,
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
            ? { ...override, price, priceDirty: true }
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

    const preflightZone = preflightByZoneId.get(zoneId);
    const suggestedCountry = preflightZone?.countries.find(
      (item) => item.countryCode === countryCode,
    );
    const effectiveBase = zone.priceDirty
      ? zone.price
      : parseSuggestedPrice(preflightZone?.suggestedBasePrice);
    const suggestedPrice = suggestedCountry
      ? parseSuggestedPrice(suggestedCountry.suggestedPrice)
      : effectiveBase;

    updateZone(zoneId, {
      overrides: [
        ...zone.overrides,
        {
          countryCode: country.code,
          countryName: suggestedCountry?.countryName || country.name,
          price: suggestedPrice,
          priceDirty: false,
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("zonePricingDesc")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {isPreflightLoading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {t("loadingSuggestedPrices")}
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applySuggestedAsDefault}
            disabled={!hasSuggestedPrices || isPreflightLoading}
          >
            {t("useSuggestedAsDefault")}
          </Button>
        </div>
      </div>

      {zonesErrorMessage ? (
        <p className="rounded-lg border border-red/20 bg-red/5 px-3 py-2 text-sm text-red">
          {zonesErrorMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        {zones.map((zone) => {
          const meta = zoneMetaById.get(zone.id);
          if (!meta) return null;

          const preflightZone = preflightByZoneId.get(zone.id);
          const currency = preflightZone?.currencyCode ?? meta.currency;
          const minorUnits = preflightZone?.minorUnits ?? 2;
          const unpricedFeatureCount = preflightZone?.unpricedFeatureCount ?? 0;
          const hasUnpricedFeatures = unpricedFeatureCount > 0;
          const suggestedBase = parseSuggestedPrice(
            preflightZone?.suggestedBasePrice,
          );
          const effectiveBase = zone.priceDirty ? zone.price : suggestedBase;
          const countryCodes =
            preflightZone?.countries.map((country) => country.countryCode) ??
            meta.countries.map((country) => country.code);

          const expanded = expandedIds.includes(zone.id);
          const availableCountries = (
            preflightZone?.countries.map((country) => ({
              code: country.countryCode,
              name: country.countryName,
            })) ?? meta.countries
          ).filter(
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
                    {preflightZone?.zoneName ?? meta.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {countryCodes.join(", ")}
                  </p>
                  {hasUnpricedFeatures ? (
                    <p className="mt-1 text-xs text-orange">
                      {t("configureFeaturePrices", {
                        count: unpricedFeatureCount,
                      })}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={
                      zone.priceDirty && Number.isFinite(zone.price)
                        ? zone.price
                        : ""
                    }
                    placeholder="0"
                    onChange={(event) => {
                      const raw = event.target.value;
                      if (raw === "") {
                        updateZone(zone.id, {
                          price: 0,
                          priceDirty: false,
                        });
                        return;
                      }

                      updateZone(zone.id, {
                        price: Number(raw || 0),
                        priceDirty: true,
                      });
                    }}
                    className={cn(formStyles.input, "h-9 w-28 text-right")}
                    aria-label={`${meta.name} base price`}
                  />
                  {preflightZone &&
                  !hasUnpricedFeatures &&
                  preflightZone.suggestedBasePrice != null ? (
                    <div className="min-w-24 text-end">
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {formatMoneyAmount(suggestedBase, minorUnits)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("valueInCurrency", { currency })}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {currency}
                    </span>
                  )}
                </div>
              </div>

              {expanded ? (
                <div className="space-y-4 border-t border-border bg-muted/20 px-4 py-4">
                  {hasUnpricedFeatures ? (
                    <p className="rounded-lg border border-orange/20 bg-orange/5 px-3 py-2 text-xs text-orange">
                      {t("configureFeaturePrices", {
                        count: unpricedFeatureCount,
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("countriesNotListed")}{" "}
                      <span className="font-semibold text-foreground">
                        {currency}{" "}
                        {formatMoneyAmount(effectiveBase, minorUnits)}
                      </span>
                      .
                    </p>
                  )}

                  <ul className="space-y-2">
                    {zone.overrides.map((override) => {
                      const suggestedCountry = preflightZone?.countries.find(
                        (country) =>
                          country.countryCode === override.countryCode,
                      );
                      const suggestedOverride = suggestedCountry
                        ? parseSuggestedPrice(suggestedCountry.suggestedPrice)
                        : effectiveBase;
                      const displayOverride = override.priceDirty
                        ? override.price
                        : suggestedOverride;
                      const matchesBase = displayOverride === effectiveBase;

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
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={
                                override.priceDirty &&
                                Number.isFinite(override.price)
                                  ? override.price
                                  : ""
                              }
                              placeholder="0"
                              onChange={(event) => {
                                const raw = event.target.value;
                                if (raw === "") {
                                  const next = zones.map((item) => {
                                    if (item.id !== zone.id) return item;
                                    return {
                                      ...item,
                                      overrides: item.overrides.map((row) =>
                                        row.countryCode === override.countryCode
                                          ? {
                                              ...row,
                                              price: suggestedOverride,
                                              priceDirty: false,
                                            }
                                          : row,
                                      ),
                                    };
                                  });
                                  form.setValue("zones", next, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  return;
                                }

                                updateOverridePrice(
                                  zone.id,
                                  override.countryCode,
                                  Number(raw || 0),
                                );
                              }}
                              className={cn(
                                formStyles.input,
                                "h-9 w-28 text-right",
                              )}
                            />
                            <div className="min-w-24 text-end">
                              <p className="text-sm font-medium text-foreground tabular-nums">
                                {formatMoneyAmount(
                                  suggestedOverride,
                                  minorUnits,
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {t("valueInCurrency", { currency })}
                              </p>
                            </div>
                          </div>
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
