"use client";

import MainHeader from "@/components/layout/ResourceHeader";
import DataTable from "@/components/bindings/ResourceTable";
import { useGetMyPayslipsQuery } from "@/redux/features/payroll/payrollApi";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMyPayslipColumns } from "./columns";

export default function MyPayslipsPage() {
  const t = useTranslations("myPayslips");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const columns = useMyPayslipColumns();

  const { data, isLoading, isError, refetch } = useGetMyPayslipsQuery({
    page,
    limit,
    sortBy: "createdAt",
    order: "DESC",
  });

  return (
    <div>
      <MainHeader title={t("title")} />

      <div className="main-padding space-y-4">
        <p className="text-muted-foreground text-sm">{t("description")}</p>
        <DataTable
          columns={columns}
          data={data?.data?.items ?? []}
          isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
          emptyMessage={t("empty")}
          pagination={{
            currentPage: page,
            limit,
            totalPages: data?.data?.meta?.totalPages || 0,
            onLimitChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
}
