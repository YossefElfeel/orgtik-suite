export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationChannel = "websocket" | "email";

export type NotificationDto = {
  id: number;
  recipientUserId: number;
  actorUserId?: number | null;
  action: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  deliveredChannels: NotificationChannel[];
  failedChannels: NotificationChannel[];
  entityType?: string | null;
  entityId?: string | null;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationListQuery = {
  page?: number;
  limit?: number;
  read?: boolean;
  priority?: NotificationPriority;
  action?: string;
};

export type PaginatedNotificationsData = {
  items: NotificationDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type UnreadCountData = {
  count: number;
};

export type MarkAllReadResponse = {
  updated: number;
};
