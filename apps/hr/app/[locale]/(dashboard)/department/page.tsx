"use client";
import MainHeader from "@/components/layout/MainHeader";
import DepartmentCards from "@/components/pages/department/DepartmentCards";
import DataTable from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import { useColumns } from "./columns";
import DepartmentManagement from "@/components/pages/department/DepartmentManagement";
import MonthYearFilter from "@/components/shared/MonthYearFilter";
import { useState } from "react";
import { useGetDepartmentsQuery } from "@/redux/features/department/departmentApi";
import DepartmentOverview from "@/components/pages/department/DepartmentOverview";
import { useTranslations } from "next-intl";
import InnerHeader from "@/components/layout/InnerHeader";

type Props = {};

function page({}: Props) {
  const t = useTranslations("departmentPage");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: departments, isLoading, isError, refetch } = useGetDepartmentsQuery({
    page,
    limit,
  });
  const columns = useColumns();
  return (
    <>
      {/* Same side padding as the overview below (main-padding), so title and action line up with the cards. */}
      <InnerHeader
        className="px-4 pb-0 md:px-6"
        title={t("title")}
        actions={
          <div className="flex items-center gap-2.5 ">
            <DepartmentManagement />
          </div>
        }
      />
      <DepartmentOverview />
      <DataTable
        columns={columns}
        data={departments?.data?.items || []}
        defaultView="table"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        pagination={{
          currentPage: page,
          limit: limit,
          totalPages: departments?.data?.meta?.totalPages || 0,
          onLimitChange: (limit) => {
            setLimit(limit);
            setPage(1);
          },
          onPageChange: (page) => {
            setPage(page);
          },
        }}
      />
    </>
  );
}

export default page;
