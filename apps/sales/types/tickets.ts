import { IPagination } from ".";

export type TicketStatus = "open" | "in_progress" | "resolved";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatusFilter = "all" | TicketStatus;

export type TicketStatusCounts = Record<TicketStatus, number>;

export type TicketsMeta = IPagination & {
  statusCounts?: TicketStatusCounts;
};
export type TicketsPaginated<T> = {
  items: T[];
  meta: TicketsMeta;
};

export type Ticket = {
  id: string;
  subject: string;
  customerName: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type TicketDetail = {
  id: string;
  subject: string;
  note: string | null;
  customer: TicketCustomer;
  status: TicketStatus;
  priority: TicketPriority;
  /** Numeric auth-service user ID of the assignee. */
  assigneeId: number | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketNote = {
  id: string;
  authorName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  /** Signed, short-lived download URL; refetch notes when it expires. */
  fileUrl: string | null;
  isMe: boolean;
};

export type TicketNoteAttachment = {
  url: string;
  name: string;
};

export type TicketsQueryParams = {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
};

/** Page number is supplied by the infinite query page param. */
export type TicketNotesQueryArg = {
  ticketId: string;
  limit?: number;
};

export type CreateTicketDTO = {
  /** Required for internal users, omitted for customers. */
  customerId?: string;
  subject: string;
  note?: string;
  priority?: TicketPriority;
};

export type UpdateTicketDTO = {
  assigneeId?: number;
  priority?: TicketPriority;
  status?: TicketStatus;
};

export type TicketAssigneeUserType = "admin" | "manager" | "employee";

export type TicketAssigneeUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  userType: TicketAssigneeUserType;
};

export type AddTicketNoteDTO = {
  ticketId: string;
  note: string;
  file?: File;
};

/**
 * Temporary customer list shape for the create-ticket combobox.
 * Move to `customersApi` when the customers feature is integrated.
 */
export type TicketCustomerListItem = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  commercialRegistrationNumber: string;
  address: string;
  preferredLanguage: string;
  status: string;
  createdAt: string;
};
