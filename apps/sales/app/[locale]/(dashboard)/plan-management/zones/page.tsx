"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import DataTable from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import ZoneManagement from "@/components/dialogs/plan-management/ZoneManagement";
import { useGetZonesQuery } from "@/redux/features/zones/zonesApi";
import { useZoneColumns } from "./columns";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

export default function ZonesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { isSalesman } = useRole();
  const t = useTranslations("planManagement.zones");

  const { data, isFetching } = useGetZonesQuery({
    page: currentPage,
    limit,
  });

  const zones = data?.data.items ?? [];
  const meta = data?.data.meta;

  const columns = useZoneColumns();

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-white p-5">
      <MainHeader
        smallTitle={t("title")}
        description={t("description")}
      >
        {!isSalesman && (
          <ZoneManagement
            trigger={
              <Button icon="solar:add-circle-linear">{t("newZone")}</Button>
            }
          />
        )}
      </MainHeader>

      <DataTable
        columns={columns}
        data={zones}
        isLoading={isFetching}
        pagination={{
          currentPage: meta?.page ?? currentPage,
          totalPages: meta?.totalPages ?? 1,
          limit: meta?.limit ?? limit,
          totalItems: meta?.total ?? 0,
          onPageChange: setCurrentPage,
          onLimitChange: (nextLimit) => {
            setLimit(nextLimit);
            setCurrentPage(1);
          },
        }}
      />
    </div>
  );
}
