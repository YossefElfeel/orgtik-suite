"use client";

// The report period: a preset (last 30 days, last month…) or any range from the calendar. Both
// write the URL; the reads follow it.
import { useTranslations } from "next-intl";
import { Button, Select } from "@orgtik/ui";
import { DateRangePicker } from "@orgtik/ui/dates";
import { PRESETS, useReportPeriod, type PeriodPreset } from "./period";

export function PeriodControl({ period }: { period: ReturnType<typeof useReportPeriod> }) {
  const t = useTranslations("Insights");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Select<PeriodPreset>
          aria-label={t("periodPreset")}
          className="min-w-40"
          value={period.preset}
          onValueChange={(v) => v && period.setPreset(v)}
          options={[
            ...PRESETS.map((p) => ({ value: p, label: t(`preset.${p}`) })),
            { value: "custom" as const, label: t("preset.custom"), disabled: true },
          ]}
        />
        <DateRangePicker aria-label={t("period")} value={period.range} onChange={period.setRange} max={period.today} className="min-w-60" />
      </div>
      {period.invalid ? (
        <p role="alert" className="flex flex-wrap items-center gap-2 text-body-sm text-danger">
          {t("periodOrder")}
          <Button variant="link" size="sm" onClick={period.reset}>
            {t("periodReset")}
          </Button>
        </p>
      ) : null}
    </div>
  );
}
