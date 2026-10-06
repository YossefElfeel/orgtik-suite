import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatShortDate } from "@/lib/format-date";
import { ticketPriorityLabels, ticketStatusLabels } from "@/lib/tickets";
import type { TicketDetail } from "@/types/tickets";

type Props = {
  ticket: TicketDetail;
};

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function TicketDetailsCard({ ticket }: Props) {
  const tCommon = useTranslations("common");
  return (
    <SectionCard title={tCommon("ticketDetails")}>
      <div className="flex flex-col gap-4">
        <DetailRow label={tCommon("status")} value={ticketStatusLabels[ticket.status]} />
        <DetailRow
          label={tCommon("priority")}
          value={ticketPriorityLabels[ticket.priority]}
        />
        <DetailRow
          label={tCommon("handledBy")}
          value={ticket.assigneeName ?? "Awaiting assignment"}
        />
        <DetailRow label={tCommon("opened")} value={formatShortDate(ticket.createdAt)} />
      </div>
    </SectionCard>
  );
}
