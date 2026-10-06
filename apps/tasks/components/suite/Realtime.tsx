"use client";

// One connection per namespace for the whole app (TASKS-017). The two socket helpers read the token
// cookie as {accessToken} although it's a plain string, so they never connected, and the
// notifications page opened a third socket. Now the token comes from the store; a new notification
// refreshes the lists and the bell, and says so in the reader's language.
import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "@orgtik/ui";
import { WEBSOCKET_URL } from "@/constants/env";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import { useNotificationSentence } from "@/components/shared/NotificationItem";
import type { NotificationLike } from "@/lib/notifications";

export function Realtime() {
  const token = useAppSelector((s) => s.auth.token);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const dispatch = useAppDispatch();
  const sentence = useNotificationSentence();

  useEffect(() => {
    if (!token || !userId) return;
    const sockets: Socket[] = [
      // Presence: being connected marks the person online for the others.
      io(`${WEBSOCKET_URL}/chat`, { auth: { token }, transports: ["websocket"] }),
      io(`${WEBSOCKET_URL}/notifications`, { auth: { token }, transports: ["websocket"] }),
    ];
    const [, notifications] = sockets;
    notifications.on("newNotification", (n: NotificationLike) => {
      dispatch(baseApi.util.invalidateTags(["Notifications"]));
      // A change someone else made to a task or project may move cards on the open board.
      if (n?.data?.taskId || n?.data?.projectId) dispatch(baseApi.util.invalidateTags(["Task", "Project"]));
      if (n?.type) toast.info(sentence(n));
    });
    return () => sockets.forEach((s) => s.disconnect());
    // The sentence helper changes with the language; reconnecting for that isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId, dispatch]);

  return null;
}
