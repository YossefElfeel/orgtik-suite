"use client";
import MainHeader from "@/components/layout/MainHeader";
import TicketDetails from "@/components/pages/tickets/TicketDetails";
import TicketStatus from "@/components/pages/tickets/TicketDetails/TicketStatus";
import TicketActivity from "@/components/pages/tickets/TicketDetails/TicketActivity";
import { useParams } from "next/navigation";
import { useGetTicketByIdQuery } from "@/redux/features/ticket/ticketApi";
import TicketsManagement from "@/components/pages/tickets/TicketDetails/TicketsManagement";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useTranslations } from "next-intl";

type Props = {};

function TicketSidebarSkeleton() {
  return (
    <div className="rounded-xl border bg-raised p-5 space-y-4 animate-pulse">
      <div className="h-5 w-40 rounded bg-line" />
      <div className="h-px w-full bg-border" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-sunken" />
        <div className="h-4 w-11/12 rounded bg-sunken" />
        <div className="h-4 w-9/12 rounded bg-sunken" />
      </div>
    </div>
  );
}

function page({}: Props) {
  const t = useTranslations("ticketDetailsPage");
  const { id } = useParams();
  const { data: ticket, isLoading } = useGetTicketByIdQuery(id as string);
  return (
    <>
      <MainHeader
        title={t("title")}
        backBtn
        backBtnurl="/tickets"
      ></MainHeader>

      <section className="main-padding grid grid-cols-1 gap-6 md:grid-cols-3 ">
        <TicketsManagement />
        <div className="col-span-1 h-full flex flex-col gap-6">
          {isLoading ? (
            <>
              <TicketSidebarSkeleton />
              <RoleGuard allowedRoles={["employee"]}>
                <TicketSidebarSkeleton />
              </RoleGuard>
            </>
          ) : (
            <>
              <TicketDetails ticket={ticket?.data} />
              <RoleGuard allowedRoles={["employee"]}>
                <TicketStatus ticket={ticket?.data} />
              </RoleGuard>
            </>
          )}
          <RoleGuard allowedRoles={["employee"]}>
            <TicketActivity ticketId={id as string} />
          </RoleGuard>
        </div>
      </section>
    </>
  );
}

export default page;
