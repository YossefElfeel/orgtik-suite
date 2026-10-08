"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import { useCouponColumns } from "./columns";
import type { CouponStatus } from "@/types/coupons";
import { useTranslations } from "next-intl";
import SearchField from "@/components/shared/SearchField";
import { Filters } from "@/components/shared/Filters";
import DataTable from "@/components/shared/Table";
import CreateUpdateCouponDialog from "@/components/dialogs/coupons/CreateUpdateCouponDialog";
import { Button } from "@/components/ui/button";
import {
  useGetAllCouponsQuery,
  useDeleteCouponMutation,
} from "@/redux/features/coupons/couponsApi";
import { useGetDepartmentsQuery } from "@/redux/features/departments/departmentsApi";
import { useRole } from "@/hooks/useRole";
import { pickDisplayData } from "@/lib/api-display";



export default function CouponsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [status, setStatus] = useState<CouponStatus>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { isSalesman } = useRole();
  const t = useTranslations("coupons");
  const tCommon = useTranslations("common");

  const statusOptions: { id: CouponStatus; label: string }[] = useMemo(() => [
    { id: "upcoming_soon", label: t("statusUpcomingSoon") },
    { id: "active", label: t("statusActive") },
    { id: "expired_soon", label: t("statusExpiredSoon") },
    { id: "expired", label: t("statusExpired") },
    { id: "exhausted", label: t("statusExhausted") },
  ], [t]);

  // Fetch departments/categories to build name map
  const { data: departmentsResponse } = useGetDepartmentsQuery({ limit: 100 });
  const { data: couponsResponse, isLoading } = useGetAllCouponsQuery({
    page: currentPage,
    limit,
    search: search || undefined,
  });

  const [deleteCoupon] = useDeleteCouponMutation();

  const categoryOptions = useMemo(() => {
    if (!departmentsResponse?.data?.items) return [];
    return departmentsResponse.data.items.flatMap((dept) =>
      dept.categories.map((cat) => ({
        id: cat.id,
        label: `${dept.name} - ${cat.name}`,
      }))
    );
  }, [departmentsResponse]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryOptions.forEach((opt) => {
      map[opt.id] = opt.label;
    });
    return map;
  }, [categoryOptions]);

  const handleDelete = async (id: string) => {
    await deleteCoupon(id).unwrap();
  };

  const columns = useCouponColumns({
    categoryMap,
    onDelete: handleDelete,
  });

  // Client-side category/status filtering over retrieved paginated items
  const filteredItems = useMemo(() => {
    let items = pickDisplayData(couponsResponse)?.items || [];
    if (category) {
      items = items.filter((item) => item.categoryId === category);
    }
    if (status) {
      items = items.filter((item) => item.status === status);
    }
    return items;
  }, [couponsResponse, category, status]);

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={t("title")}
        description={t("description")}
      >
      {!isSalesman && (
        <CreateUpdateCouponDialog
          trigger={
            <Button icon="solar:plus-linear">
              {t("addCoupon")}
            </Button>
          }
        />
      )}
      </MainHeader>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchField
            search={{
              placeholder: t("searchPlaceholder"),
              setSearchValue: (value) => {
                setSearch(value);
                setCurrentPage(1);
              },
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Filters
              options={categoryOptions}
              selectedId={category}
              onSelectedChange={(id) => {
                setCategory(id as string | undefined);
                setCurrentPage(1);
              }}
              triggerLabel={
                category
                  ? tCommon("filterSelected", { filter: "Category", value: categoryMap[category] || "Selected" })
                  : tCommon("filterAll", { filter: "Category" })
              }
            />
            <Filters
              options={statusOptions}
              selectedId={status}
              onSelectedChange={(id) => {
                setStatus(id as CouponStatus | undefined);
                setCurrentPage(1);
              }}
              triggerLabel={
                status
                  ? tCommon("filterSelected", { filter: tCommon("status"), value: statusOptions.find((o) => o.id === status)?.label ?? "" })
                  : tCommon("filterAll", { filter: tCommon("status") })
              }
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          isLoading={isLoading}
          pagination={{
            currentPage,
            totalPages:
              pickDisplayData(couponsResponse)?.meta?.totalPages || 1,
            limit,
            totalItems: pickDisplayData(couponsResponse)?.meta?.total || 0,
            onPageChange: (page) => setCurrentPage(page),
            onLimitChange: (lim) => {
              setLimit(lim);
              setCurrentPage(1);
            },
          }}
        />
      </div>
    </section>
  );
}

