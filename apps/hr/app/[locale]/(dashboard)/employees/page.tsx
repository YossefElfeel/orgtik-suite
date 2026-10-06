"use client";

import { useTranslations } from "next-intl";
import DataTable from "@/components/shared/Table";
import EmployeeCard from "@/components/pages/employee/EmployeeCard";
import { useGetEmployeesQuery } from "@/redux/features/employee/employeeApi";
import { getColumns } from "./columns";
import { useEmploymentTypeLabel } from "@/hooks/useEmploymentTypeLabel";
import { CreateUpdateEmployeeSheet } from "@/components/sheets/CreateUpdateEmployeeSheet";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import EmployeeSkeleton from "@/components/pages/employee/EmployeeSkeleton";

import { useGetDepartmentsQuery } from "@/redux/features/department/departmentApi";

export default function EmployeesPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchQuery = params.get("q") ?? "";
  const activeFilter: number | string = params.get("dept") ?? "all";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = Number(params.get("limit")) || 10;
  /** Changes the list's state in the address; anything that changes the list goes back to page 1. */
  const setList = (next: Record<string, string | number | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v === null || v === "" || v === "all" ? sp.delete(k) : sp.set(k, String(v)));
    if (sp.get("page") === "1") sp.delete("page");
    if (sp.get("limit") === "10") sp.delete("limit");
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const t = useTranslations("employeeTable");
  const tEmp = useTranslations("employees");

  const { data: deptsData } = useGetDepartmentsQuery({ limit: 100 });
  const filterOptions = [
    { id: "all", name: tEmp("page.allDepartments") },
    ...(deptsData?.data?.items?.map((d) => ({
      id: d.id,
      name: d.name,
    })) || []),
  ];

  const { data, isLoading, isFetching, isError, refetch } = useGetEmployeesQuery({
    search: searchQuery,
    departmentId: activeFilter === "all" ? undefined : activeFilter,
    page,
    limit,
  });
  const employees = data?.data?.items || [];
  const employmentType = useEmploymentTypeLabel();
  const columns = getColumns(t, employmentType);

  // Only the edit action opens the edit sheet (mode=edit). The add wizard also writes employee_id
  // to the address after step 1; reading that as "edit" mounted a second sheet over it (HR-008).
  const isEdit = params.get("mode") === "edit" && !!params.get("employee_id");

  return (
    <div>
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading || isFetching}
        isError={isError}
        onRetry={refetch}
        emptyMessage={t("empty")}
        defaultView="table"
        enableRowSelection
        gridCard={(row) => <EmployeeCard employee={row} />}
        gridSkeleton={<EmployeeSkeleton />}
        pagination={{
          currentPage: page,
          totalPages: data?.data?.meta?.totalPages || 1,
          limit: limit,
          totalItems: data?.data?.meta?.total || 0,
          onPageChange: (p) => setList({ page: p }),
          onLimitChange: (newLimit) => setList({ limit: newLimit, page: null }),
        }}
        searchFunctions={{
          search: searchQuery,
          setSearch: (query) => setList({ q: query, page: null }),
        }}
        filterFunctions={{
          activeFilter: activeFilter,
          setActiveFilter: (filter) => setList({ dept: filter, page: null }),
          filterData: filterOptions,
        }}
      />

      {/* update employee sheet */}
      {isEdit && <CreateUpdateEmployeeSheet mode="edit" />}
    </div>
  );
}
