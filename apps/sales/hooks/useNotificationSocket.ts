"use client";

// The live connection behind the bell (FS-SAL-2, SAL-138, SAL-166, SAL-185). It used to be
// websocket-only, logged every payload (invoice numbers and amounts) to the console, never
// reconnected after the server dropped it, and connected even for sessions that can't open Sales.
// Now:
// - it connects only for a person with a Sales role, websocket first and HTTP long-polling if
//   websockets are blocked;
// - a dropped connection reconnects with exponential backoff and jitter (2 s doubling to 60 s);
// - an auth failure (the server refuses the token, or drops the socket before saying "connected")
//   stops the socket for this token and nothing shows as broken: the bell carries on through polling;
// - while the socket isn't live, the bell and the feed are refreshed every minute, when the tab comes
//   back into view and when the network returns (the polling fallback); read state syncs across tabs;
// - a pushed event refreshes the bell, the feed, the dashboard and the module it's about, and says
//   what happened in the reader's language.
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "@orgtik/ui";
import { API_URL } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import { useRole } from "@/hooks/useRole";
import { tagsForType, useEventText } from "@/components/pages/activity-feed/feed";

const POLL_MS = 60_000;
const AUTH_FAILURE = /auth|token|jwt|unauthori[sz]ed|forbidden|401|403/i;

type PushedNotification = {
  id: string;
  type: string;
  title?: string;
  message?: string;
  data?: Record<string, unknown> | null;
  priority?: string;
  createdAt?: string;
};

export function useNotificationSocket(): void {
  const token = useAppSelector((state) => state.auth.token);
  const { hasAccess } = useRole();
  const dispatch = useAppDispatch();
  const text = useEventText();
  // The words follow the language without reconnecting.
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!token || !API_URL || !hasAccess) return;

    let live = false;
    let stopped = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const refresh = () => dispatch(baseApi.util.invalidateTags(["Notifications", "ActivityFeed"]));
    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (typeof document === "undefined" || document.visibilityState === "visible") refresh();
      }, POLL_MS);
    };
    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    };

    const socket: Socket = io(`${API_URL.replace(/\/api\/?$/, "")}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      reconnection: true,
      reconnectionDelay: 2_000,
      reconnectionDelayMax: 60_000,
      randomizationFactor: 0.5,
    });

    // Stop for good with this token: the next token (a new session) starts a new socket.
    const authFailed = () => {
      stopped = true;
      live = false;
      socket.io.reconnection(false);
      socket.disconnect();
      startPolling();
    };

    socket.on("connected", () => {
      const wasPolling = pollTimer !== null;
      live = true;
      stopPolling();
      // Catch up on anything that arrived while the socket was down.
      if (wasPolling) refresh();
    });

    socket.on("connect_error", (err: Error & { data?: { status?: number; code?: string } }) => {
      const status = err.data?.status;
      if (status === 401 || status === 403 || AUTH_FAILURE.test(`${err.message} ${err.data?.code ?? ""}`)) {
        authFailed();
        return;
      }
      // The manager retries with backoff; meanwhile the bell polls.
      startPolling();
    });

    socket.on("disconnect", (reason) => {
      const wasLive = live;
      live = false;
      if (stopped) return;
      if (reason === "io server disconnect") {
        // The server dropped us. Before "connected" that's a refused token; after it, the server
        // ended the session. socket.io doesn't retry either case by itself.
        if (!wasLive) {
          authFailed();
          return;
        }
        startPolling();
        socket.connect();
        return;
      }
      if (reason === "io client disconnect") return;
      startPolling();
    });

    // The manager gave up: keep polling, and try again when the network comes back.
    socket.io.on("reconnect_failed", startPolling);

    socket.on("notification", (n: PushedNotification) => {
      if (!n || typeof n.type !== "string") return;
      dispatch(baseApi.util.invalidateTags(["Notifications", "ActivityFeed", ...tagsForType(n.type)]));
      const { title, context } = textRef.current;
      toast.info(title(n.type, n.title), { description: context(n.type, n.data, n.message) ?? undefined });
    });

    const onVisible = () => {
      if (document.visibilityState === "visible" && !live) refresh();
    };
    const onOnline = () => {
      if (stopped) return;
      refresh();
      if (!socket.connected) socket.connect();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      stopped = true;
      stopPolling();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      socket.io.off("reconnect_failed", startPolling);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, hasAccess, dispatch]);
}

export default useNotificationSocket;
