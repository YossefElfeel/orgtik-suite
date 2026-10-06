/**
 * SOMION HQ - THE TAB RELAY  [DISPOSABLE]
 *
 * Stands in for the gateway between browser tabs, for meetings only. With it
 * a meeting link opened in a second tab finds the meeting, the guest who asks
 * to join reaches the host's lobby, and the host's answer reaches the guest,
 * each as the same ServerEvent the socket will carry. Presence, chat and the
 * simulator's beats stay in their own tab, where every tab is the same person.
 *
 * Deleted with mock/. The gateway's broadcast replaces it and nothing above
 * the store notices.
 */

import type { ServerEvent } from "@/entities/events";
import { observeEvents, useWorkspace } from "@/store";

const RELAYED = new Set<ServerEvent["type"]>([
  "meeting.scheduled",
  "meeting.guest_arrived",
  "meeting.guest_admitted",
  "meeting.guest_declined",
  "meeting.guest_left",
  "meeting.guest_link_reset",
  "meeting.ended",
]);

type Wire = { kind: "event"; event: ServerEvent } | { kind: "ask"; guestKey: string };

let channel: BroadcastChannel | null = null;
/* True while an event from another tab is being applied, so it is not sent
   straight back to where it came from. */
let receiving = false;

export function startTabRelay(): void {
  if (channel || typeof BroadcastChannel === "undefined") return;
  const open = new BroadcastChannel("somion-hq.meetings");
  channel = open;

  open.onmessage = (e: MessageEvent<Wire>) => {
    const wire = e.data;
    const state = useWorkspace.getState();
    if (wire.kind === "ask") {
      /* Another tab opened a link to a meeting it has not heard of. Answer the
         way the gateway would on connect: with the meeting as it stands. */
      const meeting = state.meetings.find((m) => m.guestKey === wire.guestKey);
      if (meeting) open.postMessage({ kind: "event", event: { type: "meeting.scheduled", meeting } } satisfies Wire);
      return;
    }
    receiving = true;
    try {
      state.applyEvent(wire.event);
    } finally {
      receiving = false;
    }
  };

  observeEvents((event) => {
    if (!receiving && RELAYED.has(event.type)) open.postMessage({ kind: "event", event } satisfies Wire);
  });
}

/** Asks the other open tabs for the meeting a guest link's secret belongs to. */
export function askForMeeting(guestKey: string): void {
  startTabRelay();
  channel?.postMessage({ kind: "ask", guestKey } satisfies Wire);
}
