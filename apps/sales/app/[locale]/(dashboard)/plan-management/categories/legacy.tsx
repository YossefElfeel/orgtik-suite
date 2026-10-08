"use client";

import { useEffect, useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import SearchField from "@/components/shared/SearchField";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import DepartmentManagement from "@/components/dialogs/plan-management/DepartmentManagement";
import DepartmentGroup from "@/components/pages/plan-management/category/DepartmentGroup";
import DepartmentGroupsSkeleton from "@/components/pages/plan-management/category/DepartmentGroupsSkeleton";
import { useGetDepartmentsQuery } from "@/redux/features/departments/departmentsApi";
import { mapDepartmentToGroupHeader } from "@/lib/categories";
import type { DepartmentGroupHeader } from "@/types/categories";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const searchQuery = search.trim() || undefined;

  const { isSalesman } = useRole();
  const t = useTranslations("planManagement.categories");

  const { data: departmentsData, isFetching } =
    useGetDepartmentsQuery({
      page: currentPage,
      limit,
      search: searchQuery,
    });

  const departments = useMemo<DepartmentGroupHeader[]>(
    () => (departmentsData?.data.items ?? []).map(mapDepartmentToGroupHeader),
    [departmentsData?.data.items],
  );

  const meta = departmentsData?.data.meta;

  const firstDepartmentId = departments[0]?.departmentId;

  useEffect(() => {
    setExpandedIds(firstDepartmentId ? [firstDepartmentId] : []);
  }, [currentPage, search, firstDepartmentId]);

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-white p-5">
      <MainHeader
        smallTitle={t("title")}
        description={t("description")}
      >
        {!isSalesman && (
        <DepartmentManagement
          trigger={
            <Button icon="solar:add-circle-linear">{t("newDepartment")}</Button>
          }
        />
        )}
      </MainHeader>

      <SearchField
        search={{
          placeholder: t("searchPlaceholder"),
          setSearchValue: (value) => {
            setSearch(value);
            setCurrentPage(1);
          },
        }}
      />

      {isFetching && departments.length === 0 ? (
        <DepartmentGroupsSkeleton />
      ) : departments.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          {t("noCategories")}
        </p>
      ) : (
        <div className="space-y-5">
          <Accordion
            multiple
            value={expandedIds}
            onValueChange={(value) => {
              setExpandedIds(Array.isArray(value) ? value : value ? [value] : []);
            }}
            className="gap-4"
          >
            {departments.map((department) => (
              <DepartmentGroup
                key={department.departmentId}
                department={department}
                isExpanded={expandedIds.includes(department.departmentId)}
                search={searchQuery}
              />
            ))}
          </Accordion>

          <CustomPagination
              currentPage={meta?.page ?? currentPage}
              totalPages={meta?.totalPages ?? 1}
              limit={meta?.limit ?? limit}
              totalItems={meta?.total ?? 0}
              onPageChange={setCurrentPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setCurrentPage(1);
              }}
          />
        </div>
      )}
    </div>
  );
}
