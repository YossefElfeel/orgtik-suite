/**
 * SOMION HQ - THE SIMULATOR  [DISPOSABLE]
 *
 * This is what makes the workspace feel inhabited rather than screenshotted.
 * It emits the exact same ServerEvent shapes the production WebSocket will
 * emit, which is why deleting this file later breaks nothing above it.
 *
 * Two layers:
 *
 *   AMBIENT - someone moves between the desks and a room every 20 to 40
 *   seconds; a message lands in a channel that is NOT open every 60 to 90
 *   seconds. Badges move without stealing attention mid-sentence.
 *
 *   SCRIPTED - hotkeys fire prepared beats so the demo never depends on luck:
 *     S  Sara walks over to you
 *     K  Omar accepts your knock
 *     R  a reply lands in the open thread
 *     G  the client guest reaches the lobby
 *     F  time runs at 60x, ending a Focus block
 *     0  full reset to the opening state
 */

import type { Message } from "@/entities";
import type { ServerEvent } from "@/entities/events";
import { useWorkspace } from "@/store";
import { playSound } from "@/lib/audio";
import { ME } from "./seed";
import { type Status } from "@/entities";
import { isQuiet } from "@/lib/quiet";

type Emit = (event: ServerEvent) => void;

let ambientTimer: ReturnType<typeof setTimeout> | null = null;
let messageTimer: ReturnType<typeof setTimeout> | null = null;
let clockTimer: ReturnType<typeof setInterval> | null = null;
let seq = 0;
const id = (p: string) => `${p}-sim-${++seq}`;

/* A fixed rotation rather than randomness: the same people move in the same
   order every run, so nothing narrated aloud can surprise the presenter. */
const AMBIENT_ROTATION = [
  { userId: "u-lena", roomId: "r-lounge", position: { x: 84, y: 47 } },
  { userId: "u-tomas", roomId: undefined, position: { x: 27, y: 41 } },
  { userId: "u-lena", roomId: undefined, position: { x: 33, y: 19 } },
  { userId: "u-priya", roomId: undefined, position: { x: 30, y: 30 } },
  { userId: "u-sara", roomId: "r-a", position: { x: 63, y: 20 } },
  { userId: "u-sara", roomId: undefined, position: { x: 24, y: 26 } },
] as const;

const AMBIENT_MESSAGES: { channelId: string; authorId: string; text: string }[] = [
  { channelId: "c-engineering", authorId: "u-priya", text: "Staging is back up. The slow export is reproducible there now if anyone wants to poke at it." },
  { channelId: "c-random", authorId: "u-tomas", text: "Coffee machine is making a noise I would describe as structural." },
  { channelId: "c-engineering", authorId: "u-sara", text: "Holding the deploy until the export fix lands. New time is 16:00." },
  { channelId: "c-design", authorId: "u-nadia", text: "Critique moved to 14:00, Room A. Same agenda." },
  { channelId: "c-general", authorId: "u-jonas", text: "Timesheet approvals are open until Thursday if you have not done yours." },
];

let ambientIndex = 0;
let messageIndex = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/* -------------------------------------------------------------- ambient */

function scheduleAmbientMove(emit: Emit) {
  ambientTimer = setTimeout(
    () => {
      const step = AMBIENT_ROTATION[ambientIndex % AMBIENT_ROTATION.length];
      ambientIndex++;
      if (step) {
        emit({ type: "presence.room_changed", userId: step.userId, roomId: step.roomId });
        emit({ type: "presence.moved", userId: step.userId, position: step.position });
      }
      scheduleAmbientMove(emit);
    },
    rand(20_000, 40_000),
  );
}

function scheduleAmbientMessage(emit: Emit) {
  messageTimer = setTimeout(
    () => {
      const spec = AMBIENT_MESSAGES[messageIndex % AMBIENT_MESSAGES.length];
      messageIndex++;
      if (spec) {
        const openChannel = typeof window !== "undefined" ? window.location.pathname : "";
        /* Never drop a message into the channel currently on screen: the badge
           should move in the sidebar, not interrupt the conversation being
           demonstrated. */
        if (!openChannel.includes(spec.channelId)) {
          emit({ type: "message.created", message: buildMessage(spec) });
        }
      }
      scheduleAmbientMessage(emit);
    },
    rand(60_000, 90_000),
  );
}

function buildMessage(spec: {
  channelId: string;
  authorId: string;
  text: string;
  threadId?: string;
}): Message {
  return {
    id: id("m"),
    channelId: spec.channelId,
    authorId: spec.authorId,
    text: spec.text,
    createdAt: new Date().toISOString(),
    replyCount: 0,
    replyUserIds: [],
    reactions: [],
    attachments: [],
    pinned: false,
    ...(spec.threadId ? { threadId: spec.threadId } : {}),
  };
}

/* ------------------------------------------------------------- scripted */

/* Letters take Shift, so they never collide with W A S D walking on the floor
   and cannot fire from a stray keystroke in front of the room. */
export const HOTKEYS = [
  { key: "Shift+S", label: "Sara walks over to you" },
  { key: "Shift+K", label: "Omar accepts your knock" },
  { key: "Shift+R", label: "A reply lands in the open thread" },
  { key: "Shift+G", label: "The client guest reaches the lobby" },
  { key: "Shift+F", label: "Run time at 60x (ends Focus)" },
  { key: "Shift+E", label: "Empty office: everyone else signs off, and back" },
  { key: "Shift+P", label: "Lena shares her screen in the client call" },
  { key: "0", label: "Reset to the opening state" },
] as const;

/* Where everyone was before Shift+E emptied the office. */
let parked = new Map<string, Status>();

function runScripted(key: string, emit: Emit): boolean {
  const store = useWorkspace.getState();

  switch (key.toLowerCase()) {
    /* S - Sara crosses the floor toward you. This is the proximity beat: as
       she gets closer the Web Audio panner raises her gain for real. */
    case "s": {
      const me = store.presence.find((p) => p.userId === ME);
      const target = me?.position ?? { x: 14, y: 20 };
      emit({ type: "presence.speaking", userId: "u-sara", speaking: true });
      const path = [
        { x: 24, y: 26 },
        { x: 21, y: 24 },
        { x: 18, y: 22 },
        { x: target.x + 5, y: target.y + 2 },
      ];
      path.forEach((position, i) => {
        setTimeout(() => emit({ type: "presence.moved", userId: "u-sara", position }), i * 700);
      });
      setTimeout(() => emit({ type: "presence.speaking", userId: "u-sara", speaking: false }), 9_000);
      return true;
    }

    /* K - Omar answers the knock you sent him. */
    case "k": {
      const knock = store.knock;
      if (!knock) return false;
      playSound("join");
      emit({ type: "knock.answered", knockId: knock.id, state: "accepted" });
      return true;
    }

    /* R - a reply arrives in the open thread, or in the design thread if no
       thread is open. This is what makes "Discuss" feel live. */
    case "r": {
      const threadId = store.openThreadId ?? "m-11";
      const parent = store.messages.find((m) => m.id === threadId);
      if (!parent) return false;
      const responder = parent.authorId === ME ? "u-lena" : parent.authorId;
      emit({
        type: "message.created",
        message: buildMessage({
          channelId: parent.channelId,
          authorId: responder,
          threadId,
          text:
            parent.contextRef?.type === "task"
              ? "Checked with Marc. The revised rate is the one to use, so the renewal can go out today."
              : "Agreed. I will move it under the amount and bring it to critique.",
        }),
      });
      playSound("mention");
      return true;
    }

    /* G - the client arrives in the lobby of the 11:00 meeting. */
    case "g": {
      const meeting = store.meetings.find((m) => m.guests.length > 0);
      const guest = meeting?.guests[0];
      if (!meeting || !guest) return false;
      emit({ type: "meeting.guest_arrived", meetingId: meeting.id, guestEmail: guest.email });
      emit({
        type: "notification.created",
        notification: {
          id: id("n"),
          kind: "reminder",
          refId: meeting.id,
          title: `${guest.name} is waiting`,
          body: `${guest.company ?? "Guest"} joined the lobby for ${meeting.title}`,
          read: false,
          createdAt: new Date().toISOString(),
        },
      });
      playSound("knock");
      return true;
    }

    /* F - run the clock at 60x for ten seconds, which ends a 90 minute Focus
       block and produces the summary. */
    case "f": {
      if (clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
        return true;
      }
      let ticks = 0;
      clockTimer = setInterval(() => {
        ticks++;
        emit({ type: "demo.clock_advanced", minutes: 1 });
        if (ticks >= 10 && clockTimer) {
          clearInterval(clockTimer);
          clockTimer = null;
        }
      }, 200);
      return true;
    }

    /* E - the first-day floor. Everyone else signs off; pressing again brings
       them back exactly as they were. */
    case "e": {
      const others = store.presence.filter((p) => p.userId !== ME);
      if (others.some((p) => p.status !== "offline")) {
        parked = new Map(others.map((p) => [p.userId, p.status]));
        others.forEach((p) => emit({ type: "presence.status_changed", userId: p.userId, status: "offline" }));
      } else {
        others.forEach((p) => emit({ type: "presence.status_changed", userId: p.userId, status: parked.get(p.userId) ?? "available" }));
        parked = new Map();
      }
      return true;
    }

    /* P - someone else's screen share in the client call, to show the view
       from the other side of the presenter. */
    case "p": {
      const meeting = store.meetings.find((m) => m.id === "mt-1") ?? store.meetings[0];
      if (!meeting) return true;
      if (meeting.sharingUserId) emit({ type: "meeting.share_changed", meetingId: meeting.id });
      else emit({ type: "meeting.share_changed", meetingId: meeting.id, userId: "u-lena" });
      return true;
    }

    /* 0 - back to the opening state, before any demo has been run. */
    case "0": {
      emit({ type: "demo.reset" });
      ambientIndex = 0;
      messageIndex = 0;
      return true;
    }

    default:
      return false;
  }
}

/* --------------------------------------------------------------- control */

export function startSimulator(): () => void {
  if (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOS_API_URL) return () => {};
  const emit: Emit = (event) => useWorkspace.getState().applyEvent(event);

  /* Quiet mode (tests): no random moves or messages; the scripted keys below still work. */
  if (!isQuiet()) {
    scheduleAmbientMove(emit);
    scheduleAmbientMessage(emit);
  }

  const onKey = (e: KeyboardEvent) => {
    /* Never steal a keystroke from someone typing a message. */
    const el = document.activeElement;
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLElement && el.isContentEditable)
    ) {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    /* Letters only with Shift; the reset key 0 stands alone. */
    if (/^[a-zA-Z]$/.test(e.key) && !e.shiftKey) return;
    if (runScripted(e.key, emit)) e.preventDefault();
  };

  document.addEventListener("keydown", onKey);

  return () => {
    document.removeEventListener("keydown", onKey);
    if (ambientTimer) clearTimeout(ambientTimer);
    if (messageTimer) clearTimeout(messageTimer);
    if (clockTimer) clearInterval(clockTimer);
    ambientTimer = null;
    messageTimer = null;
    clockTimer = null;
  };
}
