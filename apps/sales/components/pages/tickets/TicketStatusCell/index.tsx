import type { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ticketStatusLabels } from "@/lib/tickets";
import type { TicketStatus } from "@/types/tickets";

const statusStyles: Record<
  TicketStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  open: "ghost-yellow",
  in_progress: "ghost-primary",
  resolved: "ghost-green",
};

type Props = {
  status: TicketStatus;
};

export default function TicketStatusCell({ status }: Props) {
  return <Badge variant={statusStyles[status]}>{ticketStatusLabels[status]}</Badge>;
}
