import { IDepartment } from "./department";

export type TicketStatus = "open" | "in-progress" | "closed";

export interface ITicketDTO {
    subject: string;
    description: string;
    departmentId: string;
    assignedUserIds: string[];

}
export interface ITicket {
    id: string;
    subject: string;
    status: TicketStatus;
    createdAt: string;
    createdBy: {
        email: string;
        avatar: string;
        name: string;
    }

    assignedTo: {
        avatar: string;
        name: string;
    }[]
}
export interface ITicketStats {
    key: string;
    label: string;
    value: number;
    valueLabel?: string;
    previousValue: number;
    delta: number;
    deltaPercentage?: number;
    trend: "up" | "down" | "flat" | "stable";
    subtitle: string;
}


export interface ITicketDetail {
    id: string;
    subject: string;
    description: string;
    departmentId: string;
    status: TicketStatus;
    assignedUserIds: string[];
    assignees: ITicketUser[];
    createdAt: string;
    updatedAt: string;
    attachments: ITicketAttachment[];
    messageMeta: Record<string, unknown>;
    department: IDepartment;
    createdBy: ITicketUser;
}
export interface ITicketUser {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    employeeId: number;
}
export interface ITicketAttachment {
    id: number;
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
    url: string;
}

export interface ITicketMessage {
    id: number;
    ticketId: number;
    senderUserId: number;
    sender: ITicketUser;
    content: string;
    createdAt: string;
    attachments: ITicketAttachment[];
}

export type TicketActivityAction =
    | "TICKET_CREATED"
    | "TICKET_USERS_ASSIGNED"
    | "TICKET_STATUS_UPDATED"
    | "TICKET_MESSAGE_ADDED";

export interface ITicketActivity {
    id: number;
    action: TicketActivityAction | string;
    entityType: "Ticket" | string;
    entityId: string;
    performedBy: number;
    performedByUser: ITicketUser;
    metadata: {
        assignedUserIds?: number[];
        newStatus?: TicketStatus;
        previousStatus?: TicketStatus;
        messageId?: number;
        attachmentCount?: number;
        status?: TicketStatus;
        departmentId?: number;
    } & Record<string, unknown>;
    createdAt: string;
}
