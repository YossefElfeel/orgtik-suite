import { ArrowsClockwise as RefreshCw, Money as Banknote, Wallet } from "@phosphor-icons/react";
import { InfoCard, InfoCardSkeleton } from "@/components/shared/EmployeeFacts";
import type { SalaryInformationSectionProps } from "@/types/employee";
import DataTable from "@/components/bindings/ResourceTable";
import { useMemo } from "react";
import { Skeleton } from "@orgtik/ui";
import { useTranslations } from "next-intl";
import { useEmployeeMoney } from "@/hooks/useEmployeeMoney";
import { getSalaryHistoryColumns } from "./SalaryInformationSection/columns";

export function SalaryInformationSectionSkeleton() {
  return (
    <InfoCardSkeleton itemCount={3}>
      <div className="mt-6 space-y-4">
        <Skeleton className="h-4 w-[150px]" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </InfoCardSkeleton>
  );
}

export function SalaryInformationSection({
  salaryInformation,
  isLoading,
}: SalaryInformationSectionProps) {
  const t = useTranslations("employees.details.salary");
  const tPayment = useTranslations("createUpdateEmployee.options.paymentTypes");
  const money = useEmployeeMoney();
  const currency = salaryInformation?.currency;
  const method = salaryInformation?.paymentMethod;
  const methodLabel =
    method === "bank"
      ? t("bankAccount")
      : method === "instapay" || method === "wallet"
        ? tPayment(method)
        : method || "-";

  const columns = useMemo(() => getSalaryHistoryColumns({ translate: t, money, currency }), [t, money, currency]);

  if (isLoading) return <SalaryInformationSectionSkeleton />;

  const history = salaryInformation?.salaryUpgradeHistory || [];

  return (
    <InfoCard
      title={t("title")}
      icon={RefreshCw}
      onEdit={() => {}}
      gridClassName="min-w-0 max-sm:[&>div]:grid max-sm:[&>div]:grid-cols-[1.25rem_minmax(0,1fr)] max-sm:[&>div]:gap-y-1 max-sm:[&>div>p]:w-auto max-sm:[&>div>div]:col-start-2 [&>div>div]:[overflow-wrap:anywhere]"
      items={[
        {
          id: "base-salary",
          label: t("columns.baseSalary"),
          value: <bdi className="tabular-nums">{money(salaryInformation?.baseSalary, currency)}</bdi>,
          icon: Banknote,
        },
        {
          id: "total-salary",
          label: t("columns.totalSalary"),
          value: <bdi className="tabular-nums">{money(salaryInformation?.totalSalary, currency)}</bdi>,
          icon: RefreshCw,
        },
        {
          id: "payment-method",
          label: t("paymentMethod"),
          value: methodLabel,
          icon: Wallet,
        },
      ]}
    >
      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-medium text-secondary">
          {t("upgradeHistory")}
        </h4>
        <DataTable
          columns={columns}
          data={history}
          pagination={{
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            totalItems: history.length,
            baseUrl: "#",
          }}
          emptyMessage={t("noHistory")}
        />
      </div>
    </InfoCard>
  );
}
