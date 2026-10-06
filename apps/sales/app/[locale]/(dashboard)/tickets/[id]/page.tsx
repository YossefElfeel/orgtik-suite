"use client";

import { useParams } from "next/navigation";
import MainHeader from "@/components/shared/MainHeader";
import TicketStatusCell from "@/components/pages/tickets/TicketStatusCell";
import TicketPriorityCell from "@/components/pages/tickets/TicketPriorityCell";
import TicketMakerCard from "@/components/pages/tickets/TicketMakerCard";
import TicketDetailsCard from "@/components/pages/tickets/TicketDetailsCard";
import TicketManage from "@/components/pages/tickets/TicketManage";
import TicketContactNotes from "@/components/pages/tickets/TicketContactNotes";
import TicketDetailsSkeleton from "@/components/pages/tickets/TicketDetailsSkeleton";
import TicketHeaderSkeleton from "@/components/pages/tickets/TicketHeaderSkeleton";
import { useRole } from "@/hooks/useRole";
import { formatShortDate } from "@/lib/format-date";
import { useGetTicketQuery } from "@/redux/features/tickets/ticketsApi";
import { useTranslations } from "next-intl";

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isCustomer } = useRole();
  const { data, isLoading, isError } = useGetTicketQuery(id, { skip: !id });
  const ticket = data?.data;
  const t = useTranslations("tickets");
  const tCommon = useTranslations("common");

  if (isError || (!isLoading && !ticket)) {
    return (
      <section className="flex flex-col gap-6">
        <MainHeader
          title={t("ticketUnavailable", { fallback: "Ticket unavailable" })}
          description={t("ticketUnavailableDescription", { fallback: "This ticket does not exist or is outside your access scope." })}
          backLink={{ href: "/tickets", label: tCommon("back", { fallback: "Back" }) }}
        />
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-col gap-6 lg:h-full lg:overflow-hidden">
      <div className="shrink-0">
        {ticket ? (
          <MainHeader
            title={ticket.subject}
            backLink={{
              href: "/tickets",
              label: tCommon("back", { fallback: "Back" }),
            }}
            subChildren={
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {tCommon("createdIn", { fallback: "Created in" })} {formatShortDate(ticket.createdAt)}
                </p>
                <TicketStatusCell status={ticket.status} />
                <TicketPriorityCell priority={ticket.priority} />
              </div>
            }
          />
        ) : (
          <TicketHeaderSkeleton />
        )}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch lg:overflow-hidden">
        {ticket ? (
          isCustomer ? (
            <div className="min-h-0 lg:overflow-y-auto">
              <TicketDetailsCard ticket={ticket} />
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-5 lg:overflow-y-auto">
              <TicketMakerCard customer={ticket.customer} />
              <TicketManage ticket={ticket} />
            </div>
          )
        ) : (
          <div className="min-h-0 lg:overflow-y-auto">
            <TicketDetailsSkeleton />
          </div>
        )}

        <div className="flex min-h-222 flex-col lg:min-h-0  overflow-y-auto">
          <TicketContactNotes ticketId={id} />
        </div>
      </div>
    </section>
  );
}
