"use client";
import { PaperPlaneRight as Send, Plus } from "@phosphor-icons/react";

import AddPayrollAdjustmentSheet from "@/components/pages/payroll/AddPayrollAdjustmentSheet";
import MainHeader from "@/components/layout/MainHeader";
import DataTable from "@/components/shared/Table";
import { TabMenu } from "@/components/shared/TabMenu";
import { ToolbarSearchAndFilter } from "@/components/shared/ToolbarSearchAndFilter";
import { Button } from "@/components/ui/button";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { PayrollTab, useColumns, PayrollRow } from "./columns";
import { DateRange } from "react-aria-components";
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/shared/StatusBadge";
import { EmptyPayrollState } from "@/components/pages/payroll/EmptyPayrollState";
import { RunActions } from "@/components/pages/payroll/RunActions";
import { PayrollCurrencyProvider } from "@/components/pages/payroll/PayrollCurrency";
import SubmitForApprovalSheet from "@/components/pages/payroll/SubmitForApprovalSheet";
import {
  useGetPayrollRunsQuery,
  useGetPayrollRunItemsQuery,
  useStartPayrollRunMutation,
  useGetPayrollApprovalsAdminQuery,
} from "@/redux/features/payroll/payrollApi";
import AdminApprovalsSection from "@/components/pages/payroll/AdminApproval";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useListParams } from "@/hooks/useListParams";
import { rangeText } from "@/lib/date-range";

function SimpleMonthYearPicker({
  onChange,
  initial,
}: {
  onChange: (range: DateRange) => void;
  /** The month to start on (from the address); this month by default. */
  initial?: { year: number; month: number };
}) {
  const tActions = useTranslations("actions");
  const format = useFormatter();
  const now = today(getLocalTimeZone());
  const [year, setYear] = useState(initial?.year ?? now.year);
  const [month, setMonth] = useState(initial?.month ?? now.month);

  const handleChange = (newYear: number, newMonth: number) => {
    const start = new CalendarDate(newYear, newMonth, 1);
    const lastDay = new Date(newYear, newMonth, 0).getDate();
    const end = new CalendarDate(newYear, newMonth, lastDay);
    onChange({ start, end });
  };

  const handlePrev = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    handleChange(newYear, newMonth);
  };

  const handleNext = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    handleChange(newYear, newMonth);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Year Selector */}
      <select
        aria-label={tActions("year")}
        value={year}
        onChange={(e) => {
          const newYear = Number(e.target.value);
          setYear(newYear);
          handleChange(newYear, month);
        }}
        className="h-10 rounded-lg border border-line-strong bg-raised px-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-line-strong"
      >
        {Array.from({ length: 12 }, (_, i) => now.year - 6 + i).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* Navigation Group */}
      <div className="flex items-center rounded-lg border border-line-strong bg-raised shadow-sm">
        <button
          type="button"
          aria-label={tActions("previousMonth")}
          onClick={handlePrev}
          className="flex h-10 w-10 items-center justify-center text-fg-muted transition-colors hover:bg-sunken active:bg-sunken"
        >
          <span aria-hidden="true">&lt;</span>
        </button>

        <div className="flex h-10 min-w-[140px] items-center justify-center border-x border-line-strong px-4 text-sm font-medium text-fg-muted select-none">
          {format.dateTime(new Date(year, month - 1, 1), { month: "long", year: "numeric" })}
        </div>

        <button
          type="button"
          aria-label={tActions("nextMonth")}
          onClick={handleNext}
          className="flex h-10 w-10 items-center justify-center text-fg-muted transition-colors hover:bg-sunken active:bg-sunken"
        >
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>
    </div>
  );
}
// =======================================================

function HRDashboard() {
  const t = useTranslations("payroll");
  // Tab, frequency, month, search, page and size live in the address (FS-HR-6): a reload or a
  // shared link opens the same run and list.
  const list = useListParams({ q: "", tab: "all", type: "monthly", month: "" });
  const search = list.get("q");
  const activeTab = list.get("tab") as PayrollTab;
  const payrollType = list.get("type") as "monthly" | "bi-weekly" | "weekly" | "hourly";
  const { page, limit } = list;
  const monthParam = /^\d{4}-\d{2}$/.test(list.get("month")) ? list.get("month") : "";
  const pickedMonth = monthParam ? { year: Number(monthParam.slice(0, 4)), month: Number(monthParam.slice(5)) } : undefined;
  const dateRange: DateRange = useMemo(() => {
    if (!pickedMonth) return { start: today(getLocalTimeZone()), end: today(getLocalTimeZone()) };
    const { year, month } = pickedMonth;
    return { start: new CalendarDate(year, month, 1), end: new CalendarDate(year, month, new Date(year, month, 0).getDate()) };
  }, [monthParam]);

  const frequency = useMemo(() => {
    return (payrollType === "bi-weekly" ? "biweekly" : payrollType) as
      | "monthly"
      | "weekly"
      | "biweekly"
      | "hourly";
  }, [payrollType]);

  const formatDateToISO = (calendarDate: any): string => {
    if (!calendarDate) return new Date().toISOString();
    const date = calendarDate.toDate(getLocalTimeZone());
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    );
    return utcDate.toISOString();
  };

  const { data: payrollRunsResponse, isLoading: isLoadingRuns } =
    useGetPayrollRunsQuery({
      frequency,
      periodStart: formatDateToISO(dateRange?.start),
      periodEnd: formatDateToISO(dateRange?.end),
    });

  const currentRun = useMemo(() => {
    return payrollRunsResponse?.data?.items?.[0];
  }, [payrollRunsResponse]);

  const hasActiveRun = !!currentRun;

  const { data: payrollItemsResponse, isLoading: isLoadingItems, isError: isItemsError, refetch: refetchItems } =
    useGetPayrollRunItemsQuery(
      {
        id: currentRun?.id,
        tab: activeTab.toLowerCase() as any,
        search: search || undefined,
        page: page,
        limit: limit,
      },
      { skip: !hasActiveRun },
    );

  const [startPayrollRun] = useStartPayrollRunMutation();
  const { hasRole } = useUserRoles();
  const format = useFormatter();

  const handleFilterChange = (range: DateRange) => {
    list.set({ month: `${range.start.year}-${String(range.start.month).padStart(2, "0")}` });
  };

  // Only the empty state's button starts a run; the API names the run and writes its note.
  const handleStartPayroll = () => {
    const startDate = (dateRange?.start ?? today(getLocalTimeZone())).toDate(getLocalTimeZone());
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    return startPayrollRun({
      frequency,
      referenceDate: `${year}-${String(month).padStart(2, "0")}-01`,
      month,
      year,
    }).unwrap();
  };

  const columns = useColumns({
    activeTab,
    runId: currentRun?.id,
    frequency: currentRun?.frequency,
  });

  const tableData = useMemo(() => {
    const items = (payrollItemsResponse as any)?.data?.items;
    if (!items) return [];

    return items.map((item: any, index: number) => {
      const actualId = item.id ?? item.adjustmentId ?? item.loanId;
      // A stable id: a random one changed on every render, so a ticked row could untick (HR-023).
      const itemId = actualId != null ? String(actualId) : `${activeTab}-${item.employee?.id ?? "row"}-${index}`;

      const baseRow: Partial<PayrollRow> = {
        id: itemId,
        employeeId: item.employee?.id,
        employeeName: item.employee?.name || t("unknownEmployee"),
        status: item.status || "draft",
      };

      if (activeTab === "all") {
        const allItem = item as any;
        return {
          ...baseRow,
          basicSalary: allItem.baseSalary || 0,
          bonus: allItem.bonusTotal || 0,
          deduction: allItem.deductionTotal || 0,
          loans: allItem.loanTotal || 0,
          totalSalary: allItem.netPayable || 0,
          payrollDate: "",
          bonusReason: null,
          deductionReason: null,
          loanStatus: allItem.status || "draft",
        } as PayrollRow;
      } else if (activeTab === "Bonus" || activeTab === "Deduction") {
        const adjItem = item as any;
        return {
          ...baseRow,
          bonus: activeTab === "Bonus" ? adjItem.amount : null,
          deduction: activeTab === "Deduction" ? adjItem.amount : null,
          bonusReason: activeTab === "Bonus" ? adjItem.reason : null,
          deductionReason: activeTab === "Deduction" ? adjItem.reason : null,
          payrollDate: adjItem.date || "",
          totalSalary: null,
          basicSalary: null,
          loans: null,
          loanStatus: item.status || "draft",
        } as PayrollRow;
      } else if (activeTab === "Loans") {
        const loanItem = item as any;
        return {
          ...baseRow,
          loanId: loanItem.loanId ?? null,
          loanAmount: loanItem.totalLoan || 0,
          loanStartDate: loanItem.date || "",
          paidLoans: loanItem.paid || 0,
          remainsLoans: loanItem.remaining || 0,
          loanStatus: item.status || "draft",
          payrollDate: loanItem.date || "",
          basicSalary: null,
          bonus: null,
          deduction: null,
          loans: null,
          totalSalary: null,
        } as PayrollRow;
      }
      return baseRow as PayrollRow;
    });
  }, [payrollItemsResponse, activeTab, t]);

  const isLoading = isLoadingRuns || isLoadingItems;
  const [selectedRows, setSelectedRows] = useState<any>({});

  const selectedEmployees = useMemo(() => {
    return tableData
      .filter((row: any) => selectedRows[row.id])
      .map((row: any) => ({
        id: Number(row.employeeId),
        name: row.employeeName,
        amount: row.totalSalary || 0,
      }));
  }, [tableData, selectedRows]);

  const runStatus = currentRun?.status || "open";
  const canEmailPayslips =
    currentRun?.frequency === "monthly" && (hasRole("finance_manager") || hasRole("hr") || hasRole("super_admin"));

  const dateObj = useMemo(() => {
    return dateRange?.start
      ? dateRange.start.toDate(getLocalTimeZone())
      : new Date();
  }, [dateRange]);

  const dynamicDateRange = useMemo(() => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = (d: Date) => format.dateTime(d, { day: "numeric", month: "short" });
    if (payrollType === "monthly") return format.dateTime(dateObj, { month: "long", year: "numeric" });
    if (payrollType === "bi-weekly") {
      const firstHalf = dateObj.getDate() <= 15;
      const from = new Date(year, month, firstHalf ? 1 : 16);
      const to = new Date(year, month, firstHalf ? 15 : new Date(year, month + 1, 0).getDate());
      return rangeText(format.dateTimeRange(from, to, { day: "numeric", month: "short", year: "numeric" }));
    }
    if (payrollType === "weekly") {
      const offset = (dateObj.getDay() + 6) % 7; // Monday-based week
      const from = new Date(year, month, dateObj.getDate() - offset);
      const to = new Date(year, month, dateObj.getDate() - offset + 6);
      const jan1 = new Date(from.getFullYear(), 0, 1);
      const week = Math.ceil(((from.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
      return t("run.week", { week, range: `${day(from)} – ${day(to)}` });
    }
    return format.dateTime(dateObj, { dateStyle: "medium" });
  }, [dateObj, payrollType, format, t]);


  return (
    // The run's currency reaches the table's money cells and the bonus/deduction sheets' amount field.
    <PayrollCurrencyProvider value={currentRun?.displayCurrency ?? null}>
    <div className="w-full overflow-hidden">
      <MainHeader title={t("title")} />
      <div className="main-padding flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
            <Tabs
              value={payrollType}
              onValueChange={(v) => list.set({ type: String(v) })}
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
          <div className="flex items-center gap-2 self-end sm:self-center">
            <SimpleMonthYearPicker onChange={handleFilterChange} initial={pickedMonth} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-fg-muted">
            {/* No run this month yet: no status to show (it read "Unknown"); the empty state below says so. */}
            {currentRun ? <StatusBadge status={(currentRun as any).status} /> : null}
            <span className="text-secondary text-caption font-medium">
              {runStatus === "open"
                ? t("status.editsAllowed")
                : t("status.draftCount", {
                    count: currentRun?.draftCount || 0,
                  })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start sm:justify-end">
            {runStatus === "open" ? (
              <>
                <AddPayrollAdjustmentSheet
                  key="bonus"
                  type="bonus"
                  runId={currentRun?.id}
                  trigger={
                    <Button
                      variant={"outline"}
                      size="lg"
                      className="flex-1 sm:flex-initial h-10 text-xs md:text-sm px-3"
                    >
                      <Plus className="size-4 me-1" />
                      {t("tabs.bonus")}
                    </Button>
                  }
                />
                <AddPayrollAdjustmentSheet
                  key="deduction"
                  type="deduction"
                  runId={currentRun?.id}
                  trigger={
                    <Button
                      size="lg"
                      variant={"outline"}
                      className="flex-1 sm:flex-initial h-10 text-xs md:text-sm px-3"
                    >
                      <Plus className="size-4 me-1" />
                      {t("tabs.deduction")}
                    </Button>
                  }
                />
                {currentRun ? <RunActions run={currentRun} status={runStatus} canEmailPayslips={canEmailPayslips} /> : null}
              </>
            ) : (
              <>
                <div className="flex-1 sm:flex-initial">
                  <SubmitForApprovalSheet
                    runId={currentRun?.id}
                    currency={currentRun?.displayCurrency}
                    employees={selectedEmployees}
                    trigger={
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-fg-muted border-line-strong w-full h-10 text-xs md:text-sm px-3"
                      >
                        <Send className="me-1.5 h-4 w-4" />
                        {t("status.submit", {
                          count: selectedEmployees.length,
                        })}
                      </Button>
                    }
                  />
                </div>
                {currentRun ? <RunActions run={currentRun} status={runStatus} canEmailPayslips={canEmailPayslips} /> : null}
              </>
            )}
          </div>
        </div>
      </div>

      <section className="main-padding overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between gap-3 min-w-max">
          <TabMenu
            defaultActive={activeTab}
            onChange={(key: string) => list.set({ tab: key })}
            items={[
              { key: "all", label: t("tabs.all") },
              { key: "Bonus", label: t("tabs.bonus") },
              { key: "Deduction", label: t("tabs.deduction") },
              { key: "Loans", label: t("tabs.loans") },
            ]}
          />
        </div>
      </section>

      <section className="w-full overflow-hidden">
        <ToolbarSearchAndFilter searchFunctions={{ search, setSearch: (q: string) => list.set({ q }) }} />
      </section>

      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="main-padding text-center py-10 text-secondary">
            {t("status.loading")}
          </div>
        ) : hasActiveRun ? (
          <>
              <DataTable
                columns={columns}
                data={tableData}
                isError={isItemsError}
                onRetry={refetchItems}
                enableRowSelection={true}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                // pagination={{
                //   currentPage: page,
                //   limit: limit,
                //   totalPages: payrollItemsResponse?.meta?.totalPages || 0,
                //   onLimitChange: (limit) => {
                //     setLimit(limit);
                //     setPage(1);
                //   },
                //   onPageChange: (page) => setPage(page),
                // }}
              />
            <CustomPagination
              totalPages={payrollItemsResponse?.data?.meta?.totalPages || 1}
              currentPage={payrollItemsResponse?.data?.meta?.page || page}
              limit={payrollItemsResponse?.data?.meta?.limit || limit}
              onPageChange={(newPage) => list.set({ page: newPage })}
              onLimitChange={(newLimit) => list.set({ limit: newLimit })}
            />
          </>
        ) : (
          <section className="main-padding pt-0 w-full">
            <EmptyPayrollState
              type={payrollType}
              period={dynamicDateRange}
              onStart={handleStartPayroll}
              onSwitchToMonthly={() => list.set({ type: "monthly" })}
            />
          </section>
        )}
      </div>
    </div>
    </PayrollCurrencyProvider>
  );
}

function AdminDashboard() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const { data, isLoading } = useGetPayrollApprovalsAdminQuery({
    page,
    limit,
    periodStart: dateRange?.start
      ? dateRange.start.toDate(getLocalTimeZone()).toISOString()
      : undefined,
  });

  const handleFilterChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <div className="main-padding space-y-4">
      <SimpleMonthYearPicker onChange={handleFilterChange} />
      <AdminApprovalsSection batches={data?.data?.items || []} />
      <CustomPagination
        totalPages={data?.data?.meta?.totalPages || 1}
        currentPage={data?.data?.meta?.page || 1}
        limit={data?.data?.meta?.limit || 10}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => setLimit(l)}
      />
    </div>
  );
}

export default function PayrollPage() {
  return (
    <>
      <RoleGuard allowedRoles={["hr"]}>
        <HRDashboard />
      </RoleGuard>
      <RoleGuard allowedRoles={["super_admin"]}>
        <AdminDashboard />
      </RoleGuard>
    </>
  );
}
