"use client";

// A date and a time in the project's time zone (MKT-059): the library's DateTimePicker with the
// project's zone, which it names under the field. The value stays an ISO instant. This wrapper
// adds the legend, the required mark, a way to clear an optional date and the error under it.
import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DateTimePicker } from "@orgtik/ui/dates";
import { cn } from "@orgtik/ui";
import { useProjectContext } from "@/lib/project-context";

type Props = {
  legend: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** The earliest instant that can be picked. */
  min?: string;
  /** Time used when only a day is picked. */
  defaultTime?: string;
  required?: boolean;
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function ZonedDateTimeField({ legend, value, onChange, min, defaultTime = "09:00", required, error, disabled, className }: Props) {
  const t = useTranslations("CampaignWizard");
  const { timeZone } = useProjectContext();
  const id = useId();
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-1.5", className)} aria-describedby={error ? `${id}-e` : undefined}>
      <legend className="mb-1.5 text-label text-fg">
        {legend}
        {required ? (
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </legend>
      <DateTimePicker
        value={value}
        onChange={(v) => onChange(v)}
        min={min}
        defaultTime={defaultTime}
        timeZone={timeZone}
        disabled={disabled}
        dateLabel={t("dateOf", { field: legend })}
        timeLabel={t("timeOf", { field: legend })}
      />
      {value && !required && !disabled ? (
        <button type="button" onClick={() => onChange(null)} className="self-start text-caption font-semibold text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {t("clearDate", { field: legend })}
        </button>
      ) : null}
      {error ? (
        <p id={`${id}-e`} className="text-caption text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
