import { z } from "zod";
import { ticketPriorityLabels } from "@/lib/tickets";
import type { TicketPriority } from "@/types/tickets";

const priorityEnum = z.enum(["low", "medium", "high", "urgent"], {
  required_error: "Priority is required",
});

const createTicketBaseSchema = z.object({
  customerId: z.string().optional(),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(255, "Subject must be 255 characters or less"),
  priority: priorityEnum,
  note: z.string().trim(),
});

export const createTicketSchema = createTicketBaseSchema.extend({
  customerId: z.string().min(1, "Customer is required"),
});

export const createCustomerTicketSchema = createTicketBaseSchema;

export type CreateTicketFormValues = z.infer<typeof createTicketBaseSchema>;

export function getCreateTicketSchema(isCustomer: boolean) {
  return isCustomer ? createCustomerTicketSchema : createTicketSchema;
}

export const ticketManageSchema = z.object({
  priority: priorityEnum,
  assigneeId: z.string().min(1, "Assignee is required"),
});

export type TicketManageFormValues = z.infer<typeof ticketManageSchema>;

export const ticketPriorityOptions: {
  value: TicketPriority;
  label: string;
}[] = (["low", "medium", "high", "urgent"] as TicketPriority[]).map(
  (value) => ({ value, label: ticketPriorityLabels[value] }),
);
