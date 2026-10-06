"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import { store } from "@/redux/app/store";
import { getNotificationsSocketUrl } from "@/lib/notifications";
import type { NotificationDto } from "@/types/notifications";

function showPriorityToast(notification: NotificationDto) {
  const title = notification.title;
  const description = notification.body || undefined;

  if (notification.priority === "urgent") {
    toast.error(title, {
      description,
      duration: 1_000 * 60 * 30,
      className: "border-destructive/50",
    });
    return;
  }

  if (notification.priority === "high") {
    toast(title, { description, duration: 8000 });
    return;
  }

  toast(title, { description });
}

function invalidateNotificationQueries() {
  store.dispatch(
    baseApi.util.invalidateTags([
      { type: "Notification", id: "LIST" },
      { type: "Notification", id: "COUNT" },
    ]),
  );
}

/**
 * Keeps Socket.IO connected while the user is in the dashboard so unread counts
 * and lists stay fresh. Mount once inside the dashboard layout.
 */
export function NotificationsSocketHost() {
  const token = useAppSelector((s) => s.auth.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const url = getNotificationsSocketUrl();
    const socket = io(url, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("notification.created", (payload: NotificationDto) => {
      invalidateNotificationQueries();
      showPriorityToast(payload);
    });

    socket.on("connect", () => {
      invalidateNotificationQueries();
    });

    socket.on("connect_error", () => {
      invalidateNotificationQueries();
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [token]);

  return null;
}
