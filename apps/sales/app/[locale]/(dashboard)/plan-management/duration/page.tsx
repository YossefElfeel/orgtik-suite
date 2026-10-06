"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import PillTabs from "@/components/shared/PillTabs";
import SearchField from "@/components/shared/SearchField";
import DataTable from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import DurationManagement from "@/components/dialogs/plan-management/DurationManagement";
import { useGetDurationsQuery } from "@/redux/features/durations/durationsApi";
import { useDurationColumns } from "./columns";
import type { DurationKind } from "@/types/durations";
import type { PillTabItem } from "@/types/tabs";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

export default function DurationPage() {
  const [kind, setKind] = useState<DurationKind>("plan");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { isSalesman } = useRole();
  const t = useTranslations("planManagement.durations");
  const tCommon = useTranslations("common");

  const { data, isFetching } = useGetDurationsQuery({
    page: currentPage,
    limit,
    search: search || undefined,
    type: kind,
  });

  const durations = data?.data.items ?? [];
  const meta = data?.data.meta;
  const totals = data?.data.totals;

  const tabs: PillTabItem[] = useMemo(
    () => [
      {
        id: "plan",
        label: t("typePlan"),
        count: totals?.plan ?? 0,
      },
      {
        id: "installment",
        label: t("typeInstallment"),
        count: totals?.installment ?? 0,
      },
    ],
    [totals?.plan, totals?.installment],
  );

  const columns = useDurationColumns(
    kind,
    meta?.page ?? currentPage,
    meta?.limit ?? limit,
  );

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-white p-5">
      <MainHeader
        smallTitle={t("title")}
        description={t("description")}
      >
        {!isSalesman && (
          <DurationManagement
            kind={kind}
            trigger={
              <Button icon="solar:add-circle-linear">{t("newDuration")}</Button>
            }
          />
        )}
      </MainHeader>

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
      </div>

      <PillTabs
        items={tabs}
        value={kind}
        onValueChange={(id) => {
          if (id !== "plan" && id !== "installment") return;
          setKind(id);
          setCurrentPage(1);
        }}
        size="sm"
        equalWidth={false}
        ariaLabel={t("title")}
      />

      <DataTable
        columns={columns}
        data={durations}
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
