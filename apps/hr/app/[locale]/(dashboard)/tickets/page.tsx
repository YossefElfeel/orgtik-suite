"use client";
import { Lifebuoy as LifeBuoy, Ticket } from "@phosphor-icons/react";


import { TabMenu } from "@/components/shared/TabMenu";
import MainHeader from "@/components/layout/MainHeader";
import { Button } from "@/components/ui/button";
import { AddNewTicketDialog } from "@/components/pages/tickets/AddNewTicketDialog";
import { useColumns } from "./columns";
import { useState } from "react";
import DataTable from "@/components/shared/Table";
import { ToolbarSearchAndFilter } from "@/components/shared/ToolbarSearchAndFilter";
import {
  useGetMyTicketsQuery,
  useGetTicketsQuery,
} from "@/redux/features/ticket/ticketApi";
import SupportTicketsCards from "@/components/pages/tickets/SupportTicketsCards";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useTranslations } from "next-intl";

export default function TicketsPage() {
  const t = useTranslations("ticketsPage");
  const { hasRole } = useUserRoles();
  const isEmployee = hasRole("employee");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeFilter, setActiveFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"support-tickets" | "my-tickets">(
    isEmployee ? "my-tickets" : "support-tickets",
  );

  const { data: ticketsData, isLoading: isTicketsLoading, isError: isTicketsError, refetch: refetchTickets } = useGetTicketsQuery(
    {
      page,
      limit,
      search,
      ...(activeFilter && activeFilter !== "all"
        ? { status: activeFilter }
        : {}),
    },
    {
      skip: activeTab === "my-tickets",
    },
  );

  const { data: myTicketsData, isLoading: isMyTicketsLoading, isError: isMyTicketsError, refetch: refetchMyTickets } =
    useGetMyTicketsQuery(
      {
        page,
        limit,
        search,
        ...(activeFilter && activeFilter !== "all"
          ? { status: activeFilter }
          : {}),
      },
      {
        skip: activeTab === "support-tickets",
      },
    );

  const columns = useColumns({
    activeTab,
  });

  const isSupportTicketsTab = activeTab === "support-tickets";
  const currentTicketsData = isSupportTicketsTab ? ticketsData : myTicketsData;
  const isCurrentTicketsLoading = isSupportTicketsTab
    ? isTicketsLoading
    : isMyTicketsLoading;

  return (
    <>
      <MainHeader title={t("title")}>
        <div className="flex items-center gap-3 ">
          <AddNewTicketDialog />
        </div>
      </MainHeader>

      <section className="main-padding">
        {!isEmployee && (
          <TabMenu
            onChange={(key: string) =>
              setActiveTab(key as "support-tickets" | "my-tickets")
            }
            items={[
              {
                key: "support-tickets",
                label: t("tabs.supportTickets"),
                icon: <LifeBuoy className="size-5" />,
              },
              {
                key: "my-tickets",
                label: t("tabs.myTickets"),
                icon: <Ticket className="size-5" />,
              },
            ]}
          />
        )}

        <ToolbarSearchAndFilter
          className="mt-10"
          searchFunctions={{
            search: search,
            setSearch: setSearch,
          }}
          filterFunctions={{
            activeFilter: activeFilter,
            setActiveFilter: (filter: string | number) =>
              setActiveFilter(filter as string),
            filterData: [
              {
                id: "all",
                name: t("filters.all"),
              },
              {
                id: "open",
                name: t("filters.open"),
              },
              {
                id: "closed",
                name: t("filters.closed"),
              },
              {
                id: "in-progress",
                name: t("filters.inProgress"),
              },
            ],
          }}
        />

        {activeTab === "support-tickets" && <SupportTicketsCards />}
      </section>
      <DataTable
        columns={columns}
        data={currentTicketsData?.data?.items ?? []}
        enableRowSelection={activeTab === "my-tickets"}
        isLoading={isCurrentTicketsLoading}
        isError={isSupportTicketsTab ? isTicketsError : isMyTicketsError}
        onRetry={isSupportTicketsTab ? refetchTickets : refetchMyTickets}
        pagination={{
          currentPage: page,
          limit: limit,
          totalPages: currentTicketsData?.data?.meta?.totalPages || 0,
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
