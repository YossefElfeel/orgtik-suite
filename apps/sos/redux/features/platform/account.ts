"use client";
// The person's notifications (USR-24) and the workspace's own settings (USR-26/27): rename, and
// delete with retention (G-22). Marking notifications read refreshes `me`, whose `unread` is the
// sidebar's count.
import { platformApi, type Page } from "./platformApi";

export type AppNotification = { id: string; kind: string; title: string; at: string; read: boolean };

export const accountApi = platformApi.injectEndpoints({
  endpoints: (b) => ({
    getNotifications: b.query<Page<AppNotification>, { page?: number; pageSize?: number }>({
      query: ({ page = 1, pageSize = 50 }) => ({ url: "/notifications", params: { page, pageSize } }),
      providesTags: ["Notifications"],
    }),
    /** No ids: every notification in this workspace. */
    markNotificationsRead: b.mutation<{ ok: true }, { ids?: string[] }>({
      query: (body) => ({ url: "/notifications/read", method: "POST", body }),
      invalidatesTags: ["Notifications", "Me"],
    }),
    renameWorkspace: b.mutation<{ id: string; name: string }, { name: string }>({
      query: (body) => ({ url: "/workspace", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),
    deleteWorkspace: b.mutation<{ state: string; deleteAt: string }, { confirm: string }>({
      query: (body) => ({ url: "/workspace/delete", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkNotificationsReadMutation, useRenameWorkspaceMutation, useDeleteWorkspaceMutation } = accountApi;
