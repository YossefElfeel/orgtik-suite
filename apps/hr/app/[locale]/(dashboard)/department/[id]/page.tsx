"use client";
import MainHeader from "@/components/layout/ResourceHeader";
import DataTable from "@/components/bindings/ResourceTable";
import { useColumns } from "./columns";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import {
  useGetDepartmentByIdQuery,
  useGetDepartmentEmployeesQuery,
} from "@/redux/features/department/departmentApi";
import DepartmentManagement from "@/components/pages/department/DepartmentManagement";
import AddEmployeesDialog from "@/components/pages/department/AddEmployeesDialog";

type Props = {};

function page({}: Props) {
  const t = useTranslations("departmentPage");
  const tEmployees = useTranslations("employeeTable");
  const format = useFormatter();
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: department, isLoading: isLoadingDepartment } =
    useGetDepartmentByIdQuery(id as string);

  const { data: employees, isLoading: isLoadingEmployees, isError: isEmployeesError, refetch: refetchEmployees } =
    useGetDepartmentEmployeesQuery({
      departmentId: id as string,
      params: {
        page,
        limit,
      },
    });

  const columns = useColumns(id as string, department?.data?.managerUserId);
  return (
    <>
      {isLoadingDepartment ? (
        <div className="bg-gray main-padding border-b flex items-center justify-between flex-wrap gap-3">
          <div className="h-11 w-40 rounded-lg bg-line animate-pulse" />

          <div className="flex items-center gap-2.5">
            <div className="h-11 w-36 rounded-lg bg-line animate-pulse" />
            <div className="h-11 w-40 rounded-lg bg-line animate-pulse" />
          </div>
        </div>
      ) : (
        <MainHeader
          title={
            department?.data?.name ? (
              <bdi>{department.data.name}</bdi>
            ) : (
              t("details.title")
            )
          }
          backBtn
          backBtnurl="/department"
        >
          <div className="flex items-center gap-2.5 ">
            <AddEmployeesDialog
              departmentId={id as string}
              employees={department?.data?.employees ?? []}
            />
            <DepartmentManagement department={department?.data} />
          </div>
        </MainHeader>
      )}
      <section className="main-padding space-y-4">
        {isLoadingDepartment ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border p-3.5 min-h-24">
                <div className="h-4 w-28 rounded bg-muted animate-pulse mb-3" />
                <div className="h-7 w-20 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                label: t("table.columns.totalEmployees"),
                value: format.number(department?.data?.stats?.totalEmployees ?? 0),
              },
              {
                label: t("table.columns.absenteeRate"),
                value: format.number((department?.data?.stats?.absenteeRate ?? 0) / 100, {
                  style: "percent",
                  maximumFractionDigits: 1,
                }),
              },
              {
                label: t("details.budget"),
                value: format.number(department?.data?.stats?.budget ?? 0, {
                  style: "currency",
                  currency: department?.data?.stats?.budgetCurrency || "CHF",
                }),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border p-3.5 min-h-24"
              >
                <p className="text-body-lg text-secondary">{item.label}</p>
                <h4 className="text-title-lg font-semibold tabular-nums">
                  {item.value}
                </h4>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-title-sm font-medium">{t("details.employeesHeading")}</h3>
      </section>
      <DataTable
        columns={columns}
        data={employees?.data?.items || []}
        defaultView="table"
        emptyMessage={tEmployees("empty")}
        isLoading={isLoadingEmployees}
        isError={isEmployeesError}
        onRetry={refetchEmployees}
        pagination={{
          currentPage: page,
          limit: limit,
          totalPages: employees?.data?.meta?.totalPages || 0,
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
