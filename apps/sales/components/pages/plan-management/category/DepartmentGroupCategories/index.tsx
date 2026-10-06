"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";
import CategoryRow from "@/components/pages/plan-management/category/CategoryRow";
import CategoryRowsSkeleton from "@/components/pages/plan-management/category/CategoryRowsSkeleton";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { useGetGroupedCategoriesQuery } from "@/redux/features/categories/categoriesApi";

type Props = {
  departmentId: string;
  search?: string;
  isExpanded: boolean;
};

export default function DepartmentGroupCategories({
  departmentId,
  search,
  isExpanded,
}: Props) {
  const tCommon = useTranslations("common");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isFetching, isLoading } = useGetGroupedCategoriesQuery(
    {
      departmentId,
      page: currentPage,
      limit,
      ...(search ? { search } : {}),
    },
    { skip: !isExpanded },
  );

  const categories = data?.data.items[0]?.categories;
  const meta = data?.data.meta;
  const isCategoriesLoading =
    isExpanded && (isLoading || (isFetching && !categories));

  if (isCategoriesLoading) {
    return <CategoryRowsSkeleton />;
  }

  if (!categories?.length) {
    return (
      <p className="px-4 py-4 text-14 text-muted-foreground">
        {tCommon("noCategoriesInDepartment")}
      </p>
    );
  }

  return (
    <div>
      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          departmentId={departmentId}
        />
      ))}

      {meta && meta.totalPages > 1 && (
        <div className="pt-3 pb-2">
          <CustomPagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            limit={meta.limit}
            totalItems={meta.total}
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
