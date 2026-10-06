"use client";

import TicketCardSkeleton from "@/components/pages/tickets/TicketDetailsSkeleton/TicketCardSkeleton";
import { useRole } from "@/hooks/useRole";

export default function TicketDetailsSkeleton() {
  const { isCustomer } = useRole();

  if (isCustomer) {
    return <TicketCardSkeleton rows={4} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <TicketCardSkeleton rows={5} />
      <TicketCardSkeleton rows={4} />
    </div>
  );
}
