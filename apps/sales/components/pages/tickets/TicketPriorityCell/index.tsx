import type { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ticketPriorityLabels } from "@/lib/tickets";
import type { TicketPriority } from "@/types/tickets";

const priorityStyles: Record<
  TicketPriority,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  low: "ghost",
  medium: "ghost-yellow",
  high: "ghost-primary",
  urgent: "ghost-red",
};

type Props = {
  priority: TicketPriority;
};

export default function TicketPriorityCell({ priority }: Props) {
  return (
    <Badge variant={priorityStyles[priority]}>
      {ticketPriorityLabels[priority]}
    </Badge>
  );
}
