import { ArrowsClockwise as RefreshCw, Money as Banknote, Wallet } from "@phosphor-icons/react";
import { InfoCard, InfoCardSkeleton } from "@/components/ui/info-card";
import type {
  ISalaryInformation,
  ISalaryUpgradeHistory,
} from "@/types/employee";
import DataTable from "@/components/shared/Table";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { formatDate } from "@/utils/formateDate";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

type SalaryInformationSectionProps = {
  salaryInformation?: ISalaryInformation;
  isLoading?: boolean;
};

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
  const params = useParams<{ locale: string }>();
  const t = useTranslations("employees.details.salary");
  const tPayment = useTranslations("createUpdateEmployee.options.paymentTypes");
  const method = salaryInformation?.paymentMethod;
  const methodLabel =
    method === "bank"
      ? t("bankAccount")
      : method === "instapay" || method === "wallet"
        ? tPayment(method)
        : method || "-";

  const columns = useMemo<ColumnDef<ISalaryUpgradeHistory>[]>(
    () => [
      {
        accessorKey: "recordedAt",
        header: t("columns.date"),
        cell: ({ row }) => {
          const date = new Date(row.original.recordedAt);
          return (
            <span className="font-medium text-foreground">
              {Number.isNaN(date.getTime()) ? "-" : formatDate(date)}
            </span>
          );
        },
      },
      {
        accessorKey: "baseSalary",
        header: t("columns.baseSalary"),
        cell: ({ row }) => row.original.baseSalary,
      },
      {
        accessorKey: "totalSalary",
        header: t("columns.totalSalary"),
        cell: ({ row }) => row.original.totalSalary,
      },
      {
        accessorKey: "netSalary",
        header: t("columns.netSalary"),
        cell: ({ row }) => row.original.netSalary,
      },
    ],
    [params.locale, t],
  );

  if (isLoading) return <SalaryInformationSectionSkeleton />;

  const history = salaryInformation?.salaryUpgradeHistory || [];

  return (
    <InfoCard
      title={t("title")}
      icon={RefreshCw}
      onEdit={() => {}}
      items={[
        {
          id: "base-salary",
          label: t("columns.baseSalary"),
          value: salaryInformation?.baseSalary?.toString() || "-",
          icon: Banknote,
        },
        {
          id: "total-salary",
          label: t("columns.totalSalary"),
          value: salaryInformation?.totalSalary?.toString() || "-",
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
