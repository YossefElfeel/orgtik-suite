"use client";

// Start and end of a campaign (or an ad set), in the project's zone, with the rules shown on the
// fields themselves (MKT-059).
import { useTranslations } from "next-intl";
import type { ScheduleError } from "@/lib/campaigns/schedule";
import { ZonedDateTimeField } from "./ZonedDateTimeField";

type Props = {
  startAt: string | null;
  endAt: string | null;
  onChange: (next: { startAt: string | null; endAt: string | null }) => void;
  errors?: { start?: ScheduleError; end?: ScheduleError };
  requireStart?: boolean;
  requireEnd?: boolean;
  /** Messaging sends once: there is no end. */
  withEnd?: boolean;
  startLegend?: string;
  disabled?: boolean;
};

export function ScheduleFields({ startAt, endAt, onChange, errors, requireStart, requireEnd, withEnd = true, startLegend, disabled }: Props) {
  const t = useTranslations("CampaignWizard");
  const now = new Date().toISOString();
  const message = (e?: ScheduleError) => (e === "required" ? t("schedule.required") : e === "past" ? t("schedule.past") : e === "beforeStart" ? t("schedule.beforeStart") : undefined);
  return (
    <div className={withEnd ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "grid grid-cols-1 gap-4"}>
      <ZonedDateTimeField
        legend={startLegend ?? t("schedule.start")}
        value={startAt}
        onChange={(v) => onChange({ startAt: v, endAt })}
        min={now}
        required={requireStart}
        disabled={disabled}
        error={message(errors?.start)}
      />
      {withEnd ? (
        <ZonedDateTimeField
          legend={t("schedule.end")}
          value={endAt}
          onChange={(v) => onChange({ startAt, endAt: v })}
          min={startAt ?? now}
          defaultTime="23:59"
          required={requireEnd}
          disabled={disabled}
          error={message(errors?.end)}
        />
      ) : null}
    </div>
  );
}
