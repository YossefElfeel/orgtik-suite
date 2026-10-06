"use client";
import MainHeader from "@/components/layout/MainHeader";
import { useGetLoansQuery } from "@/redux/features/loan/loanApi";
import DataTable from "@/components/shared/Table";
import { useLoanColumns } from "./columns";
import MangmentLoansSheet from "@/components/pages/payroll/MangmentLoansSheet";
import { useState } from "react";
import { ToolbarSearchAndFilter } from "@/components/shared/ToolbarSearchAndFilter";
import { useTranslations } from "next-intl";

type Props = {};

function LoansPage({}: Props) {
  const t = useTranslations("loans");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "paused" | "closed" | "cancelled"
  >("all");

  const columns = useLoanColumns();

  const { data: loans, isLoading, isError, refetch } = useGetLoansQuery({
    page,
    limit,
    status: activeFilter === "all" ? undefined : activeFilter,
  });

  return (
    <div className="">
      <MainHeader
        title={t("title")}
        children={
          <>
            <MangmentLoansSheet />
          </>
        }
      />

      <div className="px-5 mt-6">
        <ToolbarSearchAndFilter
          className=""
          searchFunctions={{
            search,
            setSearch,
          }}
          filterFunctions={{
            activeFilter,
            setActiveFilter: (filter: string | number) =>
              setActiveFilter(
                filter as "all" | "active" | "paused" | "closed" | "cancelled",
              ),
            filterData: [
              { id: "all", name: t("filters.all") },
              { id: "active", name: t("filters.active") },
              { id: "paused", name: t("filters.paused") },
              { id: "closed", name: t("filters.closed") },
              { id: "cancelled", name: t("filters.cancelled") },
            ],
          }}
        />
      </div>
      <DataTable
        columns={columns}
        data={loans?.data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        pagination={{
          currentPage: page,
          limit: limit,
          totalPages: loans?.data?.meta?.totalPages || 0,
          onLimitChange: (limit) => {
            setLimit(limit);
            setPage(1); // reset
          },
          onPageChange: (page) => {
            setPage(page);
          },
        }}
      />
    </div>
  );
}

export default LoansPage;
