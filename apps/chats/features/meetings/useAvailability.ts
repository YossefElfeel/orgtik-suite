"use client";

import { useCallback, useEffect, useState } from "react";
import { readClientSession, refreshClientSession, useClientSession } from "@orgtik/ui/auth";
import { SOS_API_URL } from "@/lib/suite-session";
import { availabilityNamespace, validateAvailability, type AvailabilityData } from "@/lib/calendar-availability";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "").replace(/\/api$/, "");
type State = { key: string; status: "loading" | "ready" | "error"; data: AvailabilityData | null };

/** Own-tool authority, bounded polling, and no previous-workspace data while a read is pending. */
export function useAvailability(fromDate: string, toDate: string) {
  const context = useClientSession()?.workspaceContext;
  const namespace = availabilityNamespace(context);
  const key = JSON.stringify([namespace, fromDate, toDate]);
  const [state, setState] = useState<State>({ key: "", status: "loading", data: null });
  const [retry, setRetry] = useState(0);
  const refetch = useCallback(() => setRetry(n => n + 1), []);

  useEffect(() => {
    let active = true, inFlight = false;
    let controller: AbortController | null = null;
    setState({ key, status: "loading", data: null });
    const current = () => active && availabilityNamespace(readClientSession()?.workspaceContext) === namespace;
    const load = async () => {
      if (inFlight || !current()) return;
      inFlight = true;
      controller = new AbortController();
      try {
        const session = readClientSession(), context = session?.workspaceContext;
        if (!API || !session || !context) throw new Error("missing_authority");
        const expected = { workspaceId: context.workspace.id, timeZone: context.workspace.timeZone, fromDate, toDate, namespace, guest: context.member.role === "guest" };
        const request = (token: string) => fetch(`${API}/api/calendar/availability?${new URLSearchParams({ fromDate, toDate })}`, { headers: { Authorization: `Bearer ${token}`, "X-Workspace": expected.workspaceId }, cache: "no-store", signal: controller!.signal });
        let response = await request(session.tokens.accessToken);
        if (response.status === 401) {
          await refreshClientSession(SOS_API_URL);
          if (!current()) return;
          const token = readClientSession()?.tokens.accessToken;
          if (!token) throw new Error("missing_authority");
          response = await request(token);
        }
        const envelope = await response.json() as { success?: boolean; data?: unknown };
        const data = response.ok && envelope.success === true ? validateAvailability(envelope.data, expected) : null;
        if (!data) throw new Error("availability_unavailable");
        if (current()) setState({ key, status: "ready", data });
      } catch {
        if (current()) setState({ key, status: "error", data: null });
      } finally { inFlight = false; }
    };
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15000);
    return () => { active = false; controller?.abort(); window.clearInterval(timer); };
  }, [key, namespace, fromDate, toDate, retry]);

  return { ...(state.key === key ? state : { key, status: "loading" as const, data: null }), refetch };
}
