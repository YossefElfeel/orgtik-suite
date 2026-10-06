// get all Notifications
export interface INotifications {
  id: number;
  type: string;
  group: "all" | "mentions" | "assigned";
  priority: string;
  status: "unread" | "read" | "cleared";
  title: string;
  message: string;
  data: {
    senderName: string;
    messageContent: string;
    conversationType: string;
  };
  actor: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  readAt: string | null;
  clearedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface INotificationGroup {
  count: number;
  date: string;
  notifications: INotifications[];
}
export interface INotificationsResponse {
  groupedNotifications: INotificationGroup[];
}
// Mark Read
export interface IMarkReadNotifications {
  data: {
    updatedCount: number;
  };
}

// INotifications Latest Response
export interface INotificationsLatestResponse {
  notifications: {
    id: number;
    type: string;
    group: string;
    priority: string;
    status: "unread" | "read" | "cleared" | "mentions" | "all";
    title: string;
    message: string;
    data: {
      senderName?: string;
      messageContent?: string;
      conversationType?: string;
      newUserName?: string;
      newUserEmail?: string;
      assignedRoles?: string[];
    };
    actor?: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    readAt: string | null;
    clearedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Clear Notifications
export interface IClearNotifications {
  data: {
    clearedCount: number;
  };
}
