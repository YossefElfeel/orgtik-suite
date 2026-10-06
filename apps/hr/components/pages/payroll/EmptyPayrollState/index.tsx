"use client";

// No run for this period (FS-HR-7, HR-005). Only the button starts a run: the whole section used
// to start one on any click, and the "or switch to…" link started one too (twice). The link now
// does what it says. The developer copy ("In production…") and the made-up employee count are gone.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { EmptyPayrollStateProps } from "@/types/payroll";

export function EmptyPayrollState({ period, type, onStart, onSwitchToMonthly }: EmptyPayrollStateProps) {
  const t = useTranslations("payroll.run.empty");
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      await onStart();
    } catch {
      // The base query says why, in the reader's language (lib/api-feedback).
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-fg-brand/30 rounded-2xl bg-raised/50 mt-4 text-center">
      <h2 className="text-xl font-semibold text-fg mb-2">{t("title", { period })}</h2>
      <p className="text-fg-subtle text-sm mb-8 max-w-lg">{t("body")}</p>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <Button size="lg" onClick={start} disabled={starting} aria-busy={starting}>
          <Plus className="size-5" aria-hidden="true" />
          {t("start", { period })}
        </Button>

        {type !== "monthly" ? (
          <Button variant="link" onClick={onSwitchToMonthly}>
            {t("switchMonthly")}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
