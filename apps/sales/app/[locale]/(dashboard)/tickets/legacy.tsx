"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import PillTabs from "@/components/shared/PillTabs";
import { Filters } from "@/components/shared/Filters";
import DataTable from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import OpenNewTicketDialog from "@/components/dialogs/tickets/OpenNewTicketDialog";
import { useRole } from "@/hooks/useRole";
import { ticketPriorityLabels, ticketStatusLabels } from "@/lib/tickets";
import { useGetTicketsQuery } from "@/redux/features/tickets/ticketsApi";
import type { PillTabItem } from "@/types/tabs";
import type { TicketPriority, TicketStatusFilter } from "@/types/tickets";
import { useCustomerTicketColumns, useTicketColumns } from "./columns";
import { useTranslations } from "next-intl";

export default function TicketsPage() {
  const { isCustomer } = useRole();
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");
  const [priority, setPriority] = useState<TicketPriority>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const t = useTranslations("tickets");
  const tCommon = useTranslations("common");

  const priorityOptions: { id: TicketPriority; label: string }[] = useMemo(() => [
    { id: "low", label: t("priorityLow") },
    { id: "medium", label: t("priorityMedium") },
    { id: "high", label: t("priorityHigh") },
    { id: "urgent", label: t("priorityUrgent") },
  ], [t]);

  const { data, isFetching } = useGetTicketsQuery({
    page: currentPage,
    limit,
    status: statusFilter === "all" ? undefined : statusFilter,
    priority,
  });

  const tickets = data?.data.items ?? [];
  const meta = data?.data.meta;

  const statusTabs: PillTabItem[] = useMemo(() => {
    const counts = meta?.statusCounts;
    const allCount = counts
      ? counts.open + counts.in_progress + counts.resolved
      : undefined;

    return [
      { id: "all", label: tCommon("all", { fallback: "All" }), count: allCount },
      { id: "open", label: t("statusOpen"), count: counts?.open },
      {
        id: "in_progress",
        label: t("statusInProgress"),
        count: counts?.in_progress,
      },
      {
        id: "resolved",
        label: t("statusResolved"),
        count: counts?.resolved,
      },
    ];
  }, [meta?.statusCounts, t, tCommon]);

  const resetPaging = () => setCurrentPage(1);

  const customerTicketColumns = useCustomerTicketColumns();
  const ticketColumns = useTicketColumns();

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={isCustomer ? t("titleCustomer") : t("title")}
        description={
          isCustomer
            ? t("descriptionCustomer")
            : t("descriptionStaff")
        }
      >
        <OpenNewTicketDialog
          trigger={
            <Button type="button" icon="solar:add-circle-linear">
              {t("newTicket")}
            </Button>
          }
        />
      </MainHeader>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PillTabs
            items={statusTabs}
            value={statusFilter}
            onValueChange={(id) => {
              setStatusFilter(id as TicketStatusFilter);
              resetPaging();
            }}
            equalWidth={false}
            size="sm"
            ariaLabel={t("ticketStatusFilters")}
          />
          <Filters
            options={priorityOptions}
            selectedId={priority}
            onSelectedChange={(id) => {
              setPriority(id as TicketPriority | undefined);
              resetPaging();
            }}
            triggerLabel={
              priority
                ? tCommon("filterSelected", { filter: tCommon("priority", { fallback: "Priority" }), value: priorityOptions.find((o) => o.id === priority)?.label ?? "" })
                : tCommon("filterAll", { filter: tCommon("priority", { fallback: "Priority" }) })
            }
          />
        </div>

        <DataTable
          columns={isCustomer ? customerTicketColumns : ticketColumns}
          data={tickets}
          isLoading={isFetching}
          pagination={{
            currentPage: meta?.page ?? currentPage,
            totalPages: meta?.totalPages ?? 1,
            limit: meta?.limit ?? limit,
            totalItems: meta?.total ?? 0,
            onPageChange: setCurrentPage,
            onLimitChange: (nextLimit) => {
              setLimit(nextLimit);
              resetPaging();
            },
          }}
        />
      </div>
    </section>
  );
}
