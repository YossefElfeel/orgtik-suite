"use client";
import { ArrowRight as ArrowRightIcon, CircleNotch as CircleNotchIcon, Money as MoneyIcon } from "@phosphor-icons/react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePayoutsQuery } from "@/redux/features/payroll/payrollApi";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainHeader from "@/components/layout/MainHeader";
import MonthYearFilter from "@/components/shared/MonthYearFilter";
import StatusBadge from "@/components/shared/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { getLocalTimeZone } from "@internationalized/date";
import type { DateRange } from "react-aria-components";
import { useFormatter, useTranslations } from "next-intl";
import { useRunPeriod } from "@/hooks/useRunPeriod";
import { PayrollFinanceImportSection } from "@/components/pages/finance-queue/PayrollFinanceImportSection";

type Props = {};
type PayrollFrequency = "monthly" | "biweekly" | "weekly" | "hourly";

function FinanceQueue({}: Props) {
  const runPeriod = useRunPeriod();
  const t = useTranslations("financeQueue");
  const format = useFormatter();
  const params = useParams() as { locale: string };
  const locale = params?.locale || "en";

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isActive, setIsActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payrollType, setPayrollType] = useState<PayrollFrequency>("monthly");

  const { data: payoutsResponse, isLoading } = usePayoutsQuery({
    page,
    limit,
    showAll: isActive,
    frequency: payrollType,
  });

  const payoutsData = payoutsResponse?.data?.items || [];

  // The run's frequency is a code ("biweekly"); its label comes from the catalog.
  const frequencyLabel = (frequency: string) => {
    const key = frequency === "biweekly" ? "biWeekly" : frequency;
    return t.has(`filters.${key}`) ? t(`filters.${key}`) : frequency;
  };
  // In the run's currency, in the reader's language (it said "CHF" when the run had none).
  const money = (amount: number, currency?: string | null) =>
    currency
      ? format.number(amount, { style: "currency", currency })
      : format.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleFilterChange = (range: DateRange) => {
    if (range?.start) {
      const date = range.start.toDate(getLocalTimeZone());
      const formattedDate = date.toISOString().split("T")[0];
      setSelectedDate(formattedDate);
      setPage(1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <CircleNotchIcon
          
          width="40"
          height="40"
          className="animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <MainHeader title={t("title")} />

      <section className="main-padding space-y-6">
        <PayrollFinanceImportSection />

        <div className="flex flex-col gap-4 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-secondary">
              {t("filters.period")}
              <MonthYearFilter onChange={handleFilterChange} />
            </div>

            <div className="flex items-center gap-2 text-gray-black font-medium">
              {t("filters.showAll")}
              <Switch
                aria-label={t("filters.showAll")}
                checked={isActive}
                onCheckedChange={(checked) => {
                  setIsActive(checked);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <Tabs
            value={payrollType === "biweekly" ? "bi-weekly" : payrollType}
            onValueChange={(v) => {
              const formattedValue = v === "bi-weekly" ? "biweekly" : v;
              setPayrollType(formattedValue as PayrollFrequency);
              setPage(1);
            }}
            className="w-full sm:w-fit"
          >
            <TabsList className="bg-gray p-1 h-auto gap-1 w-full sm:w-auto flex justify-start sm:justify-center rounded-[8px]">
              {["monthly", "bi-weekly", "weekly", "hourly"].map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="flex-1 sm:flex-none text-xs md:text-sm font-medium transition-all whitespace-nowrap rounded-[6px] px-4 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-raised data-[state=active]:text-fg data-[state=active]:shadow-sm text-fg-subtle hover:text-fg-muted bg-transparent"
                >
                  {t(`filters.${type === "bi-weekly" ? "biWeekly" : type}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {payoutsData.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {payoutsData.map((run) => (
              <Link
                key={run.id}
                href={`/${locale}/finance-queue/${run.id}`}
                className="group block overflow-hidden rounded-3xl border border-line bg-raised p-6 "
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-secondary">
                      {frequencyLabel(run.frequency)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-fg">
                      {runPeriod(run)}
                    </h3>
                  </div>
                  <StatusBadge status={run.status} />
                </div>

                <div className="mt-6 space-y-3 text-sm text-fg-muted">
                  <div className="flex items-center justify-between">
                    <span>{t("card.items")}</span>
                    <span className="font-semibold text-fg">
                      {run.itemCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t("card.queued")}</span>
                    <span className="font-semibold text-fg">
                      {run.queuedCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t("card.netPayable")}</span>
                    <span className="font-semibold text-fg tabular-nums">
                      {money(Number(run.netPayableTotal), run.displayCurrency)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm font-medium text-primary">
                  <span>{t("card.openDetails")}</span>
                  <ArrowRightIcon className="rtl:-scale-x-100" width="20" height="20" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty selectedDate={selectedDate} />
        )}
      </section>
    </div>
  );
}

export default FinanceQueue;

const Empty = ({ selectedDate }: { selectedDate: string }) => {
  const t = useTranslations("financeQueue.empty");
  const format = useFormatter();

  // "YYYY-MM-DD" read as that local month, in the reader's language.
  const [year, month] = selectedDate.split("-").map(Number);
  const formattedMonth = format.dateTime(new Date(year, month - 1, 1), {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-6 mt-4 flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-raised p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sunken shadow-sm">
        <MoneyIcon
          
          className="text-fg-subtle"
          width="32"
          height="32" weight="fill" aria-hidden="true" />
      </div>
      <p className="text-body-lg font-medium text-fg">
        {t("noPayments", { month: formattedMonth })}
      </p>
    </div>
  );
};
