import { IPaginated } from "@/types";

export type NotificationPriority = "low" | "medium" | "high" | "critical";
export type NotificationStatus = "pending" | "sent" | "failed" | "read";
export type NotificationChannel = "in_app" | "email" | "websocket";

export interface NotificationEntity {
  id: string;
  userId: number;
  userType: "admin" | "salesman" | "customer";
  type: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  channels: NotificationChannel[];
  status: NotificationStatus;
  isRead: boolean;
  readAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsQueryParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: string;
  isRead?: boolean;
}

export interface NotificationUnreadCountResponse {
  count: number;
}

export interface NotificationPreferenceItem {
  id?: string;
  userId?: number;
  userType?: "admin" | "salesman" | "customer";
  notificationType: string;
  enabledChannels: NotificationChannel[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdatePreferencesPayload {
  preferences: {
    notificationType: string;
    enabledChannels: NotificationChannel[];
  }[];
}
export type NotificationResponse = IPaginated<NotificationEntity>;
