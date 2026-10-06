"use client";

/**
 * SOMION HQ - WORKSPACE STORE
 *
 * The rule that protects this codebase from being rewritten: the UI does not
 * know the data is mock. Components read hooks, hooks read this store, and the
 * store is fed today by mock/simulator.ts and tomorrow by a WebSocket.
 *
 * Two halves:
 *   1. `applyEvent(event)` - the ONLY way state changes. In production the
 *      socket handler calls exactly this function with the same event shapes.
 *   2. Actions named for their future endpoints. Each performs an optimistic
 *      local apply and then hands off to the transport (mock today, HTTP later).
 */

import { create } from "zustand";
import { isWithinWindow } from "@/lib/time";
import { roomEntryStatus, roomHardCap, roomIsOpenNow, roomOpensAudio } from "@/lib/presence";
import { setEarshot } from "@/lib/audio";
import { applyAccent, readAccent, type AccentId } from "@/lib/appearance";
import { queryIdleSupport, requestIdlePermission, type IdleSupport } from "@/lib/idle";
import { inSuite, signOutOfSuite, type SuiteSession } from "@/lib/suite-session";

import type {
  Channel,
  Floor,
  FileRef,
  Id,
  IsoDateTime,
  Insight,
  Meeting,
  NotifyLevel,
  Message,
  MyTime,
  Notification,
  Presence,
  Role,
  Room,
  RoomKind,
  Status,
  User,
  WorkspaceSettings,
  Session,
  IdleScope,
} from "@/entities";
import type { ServerEvent } from "@/entities/events";
import * as seed from "@/mock/seed";
import { msg, type Msg } from "@/lib/messages";

/* -------------------------------------------------------------------- state */

export interface WorkspaceState {
  /* data */
  me: Id;
  users: User[];
  presence: Presence[];
  floor: Floor;
  channels: Channel[];
  messages: Message[];
  threadReplies: Record<string, Message[]>;
  meetings: Meeting[];
  pastMeetings: Meeting[];
  notifications: Notification[];
  insight: Insight;
  myTime: MyTime;
  settings: WorkspaceSettings;
  /** The session itself. Ended by the inactivity policy or by choice. */
  session: Session;
  /** This device's system colour. Personal; survives a workspace reset. */
  accent: AccentId;
  /**
   * Whether this browser lets HQ ask the computer about idleness, so the
   * inactivity policy watches the whole machine and not just this tab.
   * Device-level, never sent.
   */
  idleWatch: { support: IdleSupport };

  /* ephemeral UI state that a real client would also hold locally */
  knock: {
    id: Id;
    fromId: Id;
    toId: Id;
    reason?: string;
    state: "pending" | "accepted" | "declined" | "deferred" | "missed";
  } | null;
  huddleWith: Id | null;
  /** Knocks held during Focus, plus any that went unanswered. Never dropped. */
  heldKnocks: { id: Id; fromId: Id; reason?: string; createdAt: IsoDateTime }[];
  /**
   * The role the current viewer is acting as. A prototype affordance: it lets
   * a presenter show what an admin sees and what a member sees without signing
   * out. In production this is read from the SaaS layer's session, not held
   * here and never switchable by the person it describes.
   */
  viewingRole: Role;
  /**
   * A request for the floor to centre on a person. UI-only, and a nonce rather
   * than a boolean so asking for the same person twice works twice. Consumed
   * by the floor; nothing else reads it.
   */
  officeFocus: { userId: Id; nonce: number } | null;
  /**
   * What the signed-in person has chosen to hear. Their own choices, on their
   * own client: a moderator's mute lives on the other person's presence.
   */
  localMutes: Id[];
  localVolumes: Record<Id, number>;
  selfDeafened: boolean;
  openThreadId: Id | null;
  /** Batched for the screen-reader live region; flushed at most every 30s. */
  announcements: string[];
  /** Minutes the demo clock has been advanced past DEMO_EPOCH. */
  clockOffsetMinutes: number;
  focusSummary: { knocks: number; mentions: number; threads: number } | null;
  /** Text the store queues is a Msg, translated where the toast is shown; components pass text. */
  toasts: { id: string; kind: "knock" | "mention" | "dm" | "system"; title: string | Msg; body: string | Msg }[];

  /** A "View as" session (D-017): looking only. Who is viewing, for the banner. */
  viewOnly: { by?: string } | null;

  /* the seam */
  applyEvent: (event: ServerEvent) => void;
  /** The suite's signed-in person takes their seat (FS-CHT-4). */
  adoptSuiteSession: (session: SuiteSession) => void;

  /* actions, named for the endpoints that will replace them */
  /** A message with its files (CHT-001: they were dropped); a message may be files alone. */
  sendMessage: (channelId: Id, text: string, threadId?: Id, attachments?: FileRef[]) => void;
  editMessage: (messageId: Id, text: string) => void;
  deleteMessage: (messageId: Id) => void;
  toggleReaction: (messageId: Id, emoji: string) => void;
  togglePin: (messageId: Id) => void;
  markChannelRead: (channelId: Id) => void;
  markAllRead: () => void;
  setStatus: (status: Status, customText?: string, focusMinutes?: number) => void;
  moveTo: (position: { x: number; y: number }) => void;
  joinRoom: (roomId: Id) => void;
  leaveRoom: () => void;
  sendKnock: (toId: Id, reason?: string) => void;
  answerKnock: (state: "accepted" | "declined" | "deferred") => void;
  endHuddle: () => void;
  createChannel: (input: { name: string; topic?: string; isPrivate: boolean; memberIds: Id[] }) => Id;
  updateChannel: (channelId: Id, patch: { name?: string; topic?: string; notify?: NotifyLevel; archived?: boolean }) => void;
  addChannelMembers: (channelId: Id, userIds: Id[]) => void;
  leaveChannel: (channelId: Id) => void;
  /**
   * The channel for a one-to-one, creating it if the two have never spoken.
   * Returns the id, so every "message this person" affordance in the product
   * has somewhere to go. Without this, a person you have no history with is a
   * dead end wherever they appear.
   */
  openOrCreateDm: (userId: Id) => Id;
  /** A conversation with several people. Returns the channel id. */
  createGroupDm: (userIds: Id[], name?: string) => Id;
  removeChannelMember: (channelId: Id, userId: Id) => void;
  /**
   * Adds a room, finding it a free place on the floor. Returns null when the
   * floor has no room left for one that size, so the caller can say so
   * instead of stacking it on top of another.
   */
  addRoom: (input: { name: string; kind: RoomKind; capacity: number }) => Id | null;
  removeRoom: (roomId: Id) => void;
  updateRoom: (roomId: Id, patch: Partial<Omit<Room, "id">>) => void;
  dismissHeldKnock: (id: Id) => void;
  setViewingRole: (role: Role) => void;
  focusOnPerson: (userId: Id) => void;
  toggleLocalMute: (userId: Id) => void;
  setLocalVolume: (userId: Id, factor: number) => void;
  setSelfDeafened: (on: boolean) => void;
  /** Moderation: cut a microphone, or what a person hears, for everyone. */
  setServerMute: (userId: Id, muted: boolean) => void;
  setServerDeafen: (userId: Id, deafened: boolean) => void;
  /** Everything the workspace holds, as JSON, for the owner to take away. */
  exportWorkspace: () => string;
  /** The host turned a guest away at the lobby. */
  declineGuest: (meetingId: Id, guestEmail: string) => void;
  /** Who is sharing a screen in a meeting, or nobody. */
  setShare: (meetingId: Id, userId: Id | null) => void;
  /** The room's chat, created the first time it is opened. Returns its id. */
  ensureRoomChannel: (roomId: Id) => Id;
  /** The module's state in the suite. In the product this is the SaaS layer's. */
  setActivation: (state: "off" | "trial" | "active") => void;
  connectIntegration: (id: "google" | "microsoft") => void;
  disconnectIntegration: (id: "google" | "microsoft") => void;
  scheduleMeeting: (meeting: Meeting) => void;
  /** A new secret for the guest link; the old link stops working. */
  resetGuestLink: (meetingId: Id) => void;
  /**
   * Meet now: a meeting that starts this minute. Returns its id. Started from
   * a conversation, everyone in it is invited, the conversation is the
   * meeting's chat, and it gets a message carrying the way in.
   */
  startInstantMeeting: (input: { title: string; channelId?: Id; announcement?: string }) => Id;
  /** Finds or opens the meeting's conversation, and returns its channel id. */
  ensureMeetingChannel: (meetingId: Id) => Id;
  requestRecording: (meetingId: Id) => void;
  startRecording: (meetingId: Id) => void;
  declineRecording: (meetingId: Id) => void;
  stopRecording: (meetingId: Id) => void;
  endMeeting: (meetingId: Id, attendedIds: Id[]) => void;
  admitGuest: (meetingId: Id, guestEmail: string) => void;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;
  openThread: (messageId: Id | null) => void;
  dismissToast: (id: string) => void;
  clearFocusSummary: () => void;
  signOut: (reason: "inactive" | "manual", idleMinutes?: number, scope?: IdleScope) => void;
  /** Ask the browser what it will allow, without prompting. */
  refreshIdleWatch: () => Promise<void>;
  /** Prompt for the computer-wide watch. Only works from a click. */
  allowIdleWatch: () => Promise<void>;
  signIn: () => void;
  setAccent: (id: AccentId) => void;
  /** A quiet confirmation of something that happened off-screen, like a download. */
  notify: (title: string, body: string) => void;
  /** Demo only. Deleted with mock/. */
  resetWorkspace: () => void;
}

/* ----------------------------------------------------------------- helpers */

let seq = 0;
const nextId = (prefix: string): string => `${prefix}-${++seq}`;

/**
 * Told about every event after it is applied. For the transport, never the
 * UI: the mock's tab relay listens here so a meeting link opened in another
 * tab behaves the way it will against the gateway. Components read state.
 */
type EventObserver = (event: ServerEvent) => void;
const observers = new Set<EventObserver>();
export function observeEvents(observe: EventObserver): () => void {
  observers.add(observe);
  return () => {
    observers.delete(observe);
  };
}

/*
 * The suite's signed-in person sits in the demo's main seat: the mock workspace has one prepared
 * seat, with its conversations and meetings, and the person takes it with their own name and
 * role. A real backend gives each person their own member record instead.
 */
let suiteSeat: { name: string; initials: string; role: Role; title?: string } | null = null;
const seated = (users: User[]): User[] => {
  const seat = suiteSeat;
  return seat ? users.map((u) => (u.id === seed.ME ? { ...u, ...seat, title: seat.title || u.title } : u)) : users;
};

/*
 * View as (D-017) is read-only. The real API refuses changes with 403 read_only; the mock
 * workspace lives in the browser, so the store refuses them here, the same way: a change the
 * person asked for says why, and the automatic ones (marking a conversation read) stay quiet.
 * Personal, local choices (accent, what you hear, open panels) still work.
 */
const LOUD_WRITES = [
  "sendMessage", "editMessage", "deleteMessage", "toggleReaction", "togglePin", "setStatus", "moveTo", "joinRoom",
  "sendKnock", "answerKnock", "endHuddle", "createChannel", "updateChannel", "addChannelMembers", "leaveChannel",
  "createGroupDm", "removeChannelMember", "addRoom", "removeRoom", "updateRoom", "setServerMute", "setServerDeafen",
  "declineGuest", "setShare", "setActivation", "connectIntegration", "disconnectIntegration", "scheduleMeeting",
  "startInstantMeeting", "resetGuestLink", "requestRecording", "startRecording", "declineRecording", "stopRecording", "endMeeting",
  "admitGuest", "updateSettings",
] as const;
const QUIET_WRITES = ["markChannelRead", "markAllRead", "leaveRoom", "dismissHeldKnock"] as const;
/** What a refused call returns: the callers of id-returning actions treat "" and null as "nothing made". */
const REFUSED: Partial<Record<string, unknown>> = { addRoom: null, createChannel: "", createGroupDm: "", startInstantMeeting: "" };

function guardWrites<T extends WorkspaceState>(state: T, get: () => WorkspaceState, set: (fn: (s: WorkspaceState) => Partial<WorkspaceState>) => void): T {
  const guarded = { ...state } as Record<string, unknown>;
  for (const name of [...LOUD_WRITES, ...QUIET_WRITES]) {
    const original = state[name] as (...args: unknown[]) => unknown;
    const loud = (LOUD_WRITES as readonly string[]).includes(name);
    guarded[name] = (...args: unknown[]) => {
      if (!get().viewOnly) return original(...args);
      if (loud) {
        set((s) => ({
          toasts: [
            ...s.toasts.filter((x) => !(typeof x.title !== "string" && x.title.key === "toast.readOnly")),
            { id: nextId("toast"), kind: "system" as const, title: msg("toast.readOnly", "Changes are turned off"), body: msg("toast.readOnlyBody", "You're viewing as someone else, so nothing here can be changed.") },
          ],
        }));
      }
      return REFUSED[name];
    };
  }
  return guarded as T;
}

/** A guest link's secret: 24 random bytes, URL-safe. */
export const newGuestKey = (): string => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const keyed = (m: Meeting): Meeting => (m.guestKey ? m : { ...m, guestKey: newGuestKey() });

const freshData = () => ({
  me: seed.ME,
  users: seated(seed.users),
  presence: seed.presence.map((p) => ({ ...p })),
  floor: seed.floor,
  channels: seed.channels.map((c) => ({ ...c })),
  messages: seed.messages.map((m) => ({ ...m })),
  threadReplies: Object.fromEntries(
    Object.entries(seed.threadReplies).map(([k, v]) => [k, v.map((m) => ({ ...m }))]),
  ),
  meetings: seed.meetings.map((m) => keyed({ ...m, guests: m.guests.map((g) => ({ ...g })) })),
  pastMeetings: seed.pastMeetings.map((m) => ({ ...m })),
  notifications: seed.notifications.map((n) => ({ ...n })),
  insight: seed.insight,
  myTime: seed.myTime,
  settings: { ...seed.settings },
  session: { state: "active" } as Session,
  knock: null,
  huddleWith: null,
  heldKnocks: [],
  viewingRole: "admin" as Role,
  officeFocus: null,
  localMutes: [],
  localVolumes: {},
  selfDeafened: false,
  openThreadId: null,
  announcements: [],
  clockOffsetMinutes: 0,
  focusSummary: null,
  toasts: [],
});

const nameOf = (users: User[], id: Id): string =>
  users.find((u) => u.id === id)?.name ?? "Someone";

const roomNameOf = (floor: Floor, id?: Id): string =>
  (id && floor.rooms.find((r) => r.id === id)?.name) || "the floor";

/* ------------------------------------------------------------------- store */

/**
 * Applies a patch to a meeting wherever it currently lives. Recording finishes
 * processing after the call ends, by which point the meeting has already moved
 * to `pastMeetings` - patching only the live list silently loses the file.
 */
const patchMeeting = (
  s: { meetings: Meeting[]; pastMeetings: Meeting[] },
  id: Id,
  patch: Partial<Meeting>,
) => ({
  meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  pastMeetings: s.pastMeetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
});

/* -------------------------------------------------------------- placement */

/** The footprint a new room of each kind asks for, in floor units. */
const ROOM_FOOTPRINT: Record<RoomKind, { w: number; h: number }> = {
  meeting: { w: 22, h: 30 },
  boardroom: { w: 28, h: 34 },
  booth: { w: 10, h: 14 },
  studio: { w: 20, h: 28 },
  training: { w: 26, h: 34 },
  focus: { w: 18, h: 28 },
  lounge: { w: 20, h: 32 },
  reception: { w: 20, h: 26 },
  outdoor: { w: 24, h: 26 },
  wellness: { w: 14, h: 20 },
  prayer: { w: 16, h: 30 },
  desk: { w: 30, h: 32 },
};

/**
 * Finds a place on the floor where a room of this kind fits without touching
 * another, scanning left to right and top to bottom so new rooms fill gaps
 * before spreading. Tries the full footprint first, then two smaller ones,
 * and gives up rather than overlap.
 */
function findFreeRect(
  rooms: Room[],
  kind: RoomKind,
): { x: number; y: number; w: number; h: number } | null {
  const MARGIN = 3;
  const base = ROOM_FOOTPRINT[kind];
  for (const scale of [1, 0.85, 0.7]) {
    const w = Math.round(base.w * scale);
    const h = Math.round(base.h * scale);
    for (let y = 5; y + h <= 96; y += 2) {
      for (let x = 3; x + w <= 97; x += 2) {
        const clear = rooms.every(
          (r) =>
            x + w + MARGIN <= r.rect.x ||
            r.rect.x + r.rect.w + MARGIN <= x ||
            y + h + MARGIN <= r.rect.y ||
            r.rect.y + r.rect.h + MARGIN <= y,
        );
        if (clear) return { x, y, w, h };
      }
    }
  }
  return null;
}

/**
 * Takes a strip off the bottom of the desk area, or its right side, for a new
 * room. Refuses if the desk area would drop below a size that still reads as
 * an open floor.
 */
function carveFromDesk(
  rooms: Room[],
  kind: RoomKind,
): { deskId: Id; deskRect: Room["rect"]; roomRect: Room["rect"] } | null {
  const desk = rooms.find((r) => r.kind === "desk");
  if (!desk) return null;
  const MARGIN = 3;
  const MIN_DESK = 22;
  const base = ROOM_FOOTPRINT[kind];
  for (const scale of [1, 0.85, 0.7]) {
    const w = Math.round(base.w * scale);
    const h = Math.round(base.h * scale);
    /* bottom strip */
    if (desk.rect.h - h - MARGIN >= MIN_DESK) {
      const keep = desk.rect.h - h - MARGIN;
      return {
        deskId: desk.id,
        deskRect: { ...desk.rect, h: keep },
        roomRect: { x: desk.rect.x, y: desk.rect.y + keep + MARGIN, w: Math.min(w, desk.rect.w), h },
      };
    }
    /* right strip */
    if (desk.rect.w - w - MARGIN >= MIN_DESK) {
      const keep = desk.rect.w - w - MARGIN;
      return {
        deskId: desk.id,
        deskRect: { ...desk.rect, w: keep },
        roomRect: { x: desk.rect.x + keep + MARGIN, y: desk.rect.y, w, h: Math.min(h, desk.rect.h) },
      };
    }
  }
  return null;
}

export const useWorkspace = create<WorkspaceState>()((set, get) => guardWrites({
  ...freshData(),
  accent: readAccent(),
  viewOnly: null,
  idleWatch: { support: "unknown" as IdleSupport },

  /* ==========================================================================
     THE SEAM
     Every state change in the product passes through here. The simulator and
     the production WebSocket both call this with identical payloads.
     ======================================================================== */
  applyEvent: (event) => {
    set((s) => {
      switch (event.type) {
        /* ------------------------------------------------------- presence */
        case "presence.status_changed": {
          const presence = s.presence.map((p) =>
            p.userId === event.userId
              ? {
                  ...p,
                  status: event.status,
                  customText: event.customText,
                  focusUntil: event.focusUntil,
                  since: new Date().toISOString(),
                }
              : p,
          );
          return { presence };
        }

        case "presence.moved":
          return {
            presence: s.presence.map((p) =>
              p.userId === event.userId ? { ...p, position: event.position } : p,
            ),
          };

        case "presence.room_changed": {
          const presence = s.presence.map((p) =>
            p.userId === event.userId ? { ...p, roomId: event.roomId } : p,
          );
          /* Announcements are batched, capped, and read by the live region.
             Never one utterance per movement. */
          const who = nameOf(s.users, event.userId);
          const where = roomNameOf(s.floor, event.roomId);
          const line = event.roomId
            ? `${who} entered ${where}.`
            : `${who} left ${roomNameOf(s.floor, s.presence.find((p) => p.userId === event.userId)?.roomId)}.`;
          return {
            presence,
            announcements: [...s.announcements, line].slice(-6),
          };
        }

        case "presence.speaking":
          return {
            presence: s.presence.map((p) =>
              p.userId === event.userId ? { ...p, speaking: event.speaking } : p,
            ),
          };

        /* ----------------------------------------------------------- chat */
        case "message.created": {
          const msg = event.message;
          if (msg.threadId) {
            const existing = s.threadReplies[msg.threadId] ?? [];
            return {
              threadReplies: { ...s.threadReplies, [msg.threadId]: [...existing, msg] },
              messages: s.messages.map((m) =>
                m.id === msg.threadId
                  ? {
                      ...m,
                      replyCount: m.replyCount + 1,
                      replyUserIds: Array.from(new Set([...m.replyUserIds, msg.authorId])).slice(-3),
                    }
                  : m,
              ),
            };
          }
          /* Unread only counts messages that are not mine and not in the open
             channel. Quiet by default is a data rule, not a display trick. */
          const mine = msg.authorId === s.me;
          const mentionsMe = msg.text.includes(nameOf(s.users, s.me));
          return {
            messages: [...s.messages, msg],
            channels: s.channels.map((c) =>
              c.id === msg.channelId && !mine
                ? {
                    ...c,
                    unread: c.unread + 1,
                    mentions: mentionsMe ? c.mentions + 1 : c.mentions,
                  }
                : c,
            ),
          };
        }

        case "message.edited":
          return {
            messages: s.messages.map((m) =>
              m.id === event.messageId ? { ...m, text: event.text, editedAt: event.editedAt } : m,
            ),
            threadReplies: Object.fromEntries(
              Object.entries(s.threadReplies).map(([k, v]) => [
                k,
                v.map((m) =>
                  m.id === event.messageId ? { ...m, text: event.text, editedAt: event.editedAt } : m,
                ),
              ]),
            ),
          };

        case "message.deleted":
          return {
            messages: s.messages.map((m) =>
              m.id === event.messageId ? { ...m, deletedAt: event.deletedAt } : m,
            ),
          };

        case "message.reaction_toggled": {
          const toggle = (m: Message): Message => {
            if (m.id !== event.messageId) return m;
            const existing = m.reactions.find((r) => r.emoji === event.emoji);
            if (!existing) {
              return { ...m, reactions: [...m.reactions, { emoji: event.emoji, userIds: [event.userId] }] };
            }
            const has = existing.userIds.includes(event.userId);
            const userIds = has
              ? existing.userIds.filter((u) => u !== event.userId)
              : [...existing.userIds, event.userId];
            return {
              ...m,
              reactions: userIds.length
                ? m.reactions.map((r) => (r.emoji === event.emoji ? { ...r, userIds } : r))
                : m.reactions.filter((r) => r.emoji !== event.emoji),
            };
          };
          return {
            messages: s.messages.map(toggle),
            threadReplies: Object.fromEntries(
              Object.entries(s.threadReplies).map(([k, v]) => [k, v.map(toggle)]),
            ),
          };
        }

        case "message.pin_toggled":
          return {
            messages: s.messages.map((m) =>
              m.id === event.messageId ? { ...m, pinned: !m.pinned } : m,
            ),
          };

        case "channel.read":
          return {
            channels: s.channels.map((c) =>
              c.id === event.channelId ? { ...c, unread: 0, mentions: 0 } : c,
            ),
          };

        case "channel.all_read":
          return {
            channels: s.channels.map((c) => ({ ...c, unread: 0, mentions: 0 })),
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
          };

        case "channel.created": {
          const c = event.channel;
          return {
            channels: [
              ...s.channels,
              {
                id: c.id,
                name: c.name,
                kind: c.kind,
                ...(c.topic ? { topic: c.topic } : {}),
                memberIds: c.memberIds,
                unread: 0,
                mentions: 0,
                archived: false,
                notify: "mentions",
              },
            ],
          };
        }

        case "channel.updated":
          return {
            channels: s.channels.map((c) =>
              c.id === event.channelId ? { ...c, ...event.patch } : c,
            ),
          };

        case "channel.members_added":
          return {
            channels: s.channels.map((c) =>
              c.id === event.channelId
                ? { ...c, memberIds: Array.from(new Set([...c.memberIds, ...event.userIds])) }
                : c,
            ),
          };

        case "channel.member_removed":
          return {
            channels: s.channels.map((c) =>
              c.id === event.channelId
                ? { ...c, memberIds: c.memberIds.filter((m) => m !== event.userId) }
                : c,
            ),
          };

        case "channel.left":
          return {
            channels: s.channels.map((c) =>
              c.id === event.channelId
                ? { ...c, memberIds: c.memberIds.filter((m) => m !== s.me) }
                : c,
            ),
          };

        case "room.added":
          return { floor: { ...s.floor, rooms: [...s.floor.rooms, event.room] } };

        case "room.removed":
          return {
            floor: { ...s.floor, rooms: s.floor.rooms.filter((r) => r.id !== event.roomId) },
            /* Nobody is left standing in a room that no longer exists. */
            presence: s.presence.map((p) =>
              p.roomId === event.roomId
                ? { ...p, roomId: undefined, status: "available" as const }
                : p,
            ),
          };

        case "room.updated": {
          const rect = event.patch.rect;
          return {
            floor: {
              ...s.floor,
              rooms: s.floor.rooms.map((r) =>
                r.id === event.roomId ? { ...r, ...event.patch } : r,
              ),
            },
            /* If a wall moved, nobody is left standing outside it. */
            presence: rect
              ? s.presence.map((p) =>
                  p.roomId === event.roomId
                    ? {
                        ...p,
                        position: {
                          x: Math.min(rect.x + rect.w - 3, Math.max(rect.x + 3, p.position.x)),
                          y: Math.min(rect.y + rect.h - 3, Math.max(rect.y + 3, p.position.y)),
                        },
                      }
                    : p,
                )
              : s.presence,
          };
        }

        case "floor.template_changed": {
          const inside = (pos: { x: number; y: number }, r: Room) =>
            pos.x >= r.rect.x && pos.x <= r.rect.x + r.rect.w && pos.y >= r.rect.y && pos.y <= r.rect.y + r.rect.h;
          return {
            floor: { ...s.floor, template: event.template, rooms: event.rooms },
            presence: s.presence.map((p) => {
              if (!p.roomId) return p;
              const room = event.rooms.find((r) => r.id === p.roomId);
              if (!room) return { ...p, roomId: undefined, status: "available" as const };
              return inside(p.position, room)
                ? p
                : { ...p, position: { x: room.rect.x + room.rect.w / 2, y: room.rect.y + room.rect.h / 2 } };
            }),
          };
        }

        /* ---------------------------------------------------------- knock */
        case "presence.muted": {
          const isMe = event.userId === s.me;
          return {
            presence: s.presence.map((p) =>
              p.userId === event.userId
                ? { ...p, muted: event.muted, speaking: event.muted ? false : p.speaking }
                : p,
            ),
            toasts: isMe
              ? [
                  ...s.toasts,
                  {
                    id: nextId("toast"),
                    kind: "system" as const,
                    title: event.muted ? msg("toast.mutedByModerator", "A moderator muted your microphone") : msg("toast.unmuted", "Your microphone is back"),
                    body: event.muted ? msg("toast.mutedByModeratorBody", "Nobody in the room can hear you until it is lifted.") : msg("toast.unmutedBody", "People can hear you again."),
                  },
                ]
              : s.toasts,
          };
        }

        case "presence.deafened": {
          const isMe = event.userId === s.me;
          return {
            presence: s.presence.map((p) =>
              p.userId === event.userId ? { ...p, deafened: event.deafened } : p,
            ),
            selfDeafened: isMe ? event.deafened : s.selfDeafened,
            toasts: isMe
              ? [
                  ...s.toasts,
                  {
                    id: nextId("toast"),
                    kind: "system" as const,
                    title: event.deafened ? msg("toast.deafenedByModerator", "A moderator deafened you") : msg("toast.undeafened", "You can hear again"),
                    body: event.deafened ? msg("toast.deafenedByModeratorBody", "You will not hear anyone until it is lifted.") : msg("toast.undeafenedBody", "Audio from the room is back."),
                  },
                ]
              : s.toasts,
          };
        }

        case "knock.sent": {
          /* Quiet hours withhold the interruption, not the message. The knock
             is still recorded and still waiting when the window closes. */
          const quiet = isWithinWindow(s.settings.quietHours);
          const incoming = event.toId === s.me;
          const meFocused =
            s.presence.find((p) => p.userId === s.me)?.status === "focus";
          /* Focus defers knocks rather than dropping them. Nothing is lost. */
          const state = incoming && meFocused ? "deferred" : "pending";
          return {
            knock: { id: event.knockId, fromId: event.fromId, toId: event.toId, reason: event.reason, state },
            heldKnocks:
              incoming && (meFocused || quiet)
                ? [
                    ...s.heldKnocks,
                    {
                      id: event.knockId,
                      fromId: event.fromId,
                      ...(event.reason ? { reason: event.reason } : {}),
                      createdAt: new Date().toISOString(),
                    },
                  ]
                : s.heldKnocks,
            toasts: incoming && !meFocused && !quiet
              ? [
                  ...s.toasts,
                  {
                    id: nextId("toast"),
                    kind: "knock" as const,
                    title: msg("toast.knocking", "{name} is knocking", { name: nameOf(s.users, event.fromId) }),
                    body: event.reason ?? msg("toast.knockingBody", "Wants a quick word"),
                  },
                ]
              : s.toasts,
          };
        }

        /* Delivering a held knock puts it back in front of the person with its
           original reason intact. Deferral is only trustworthy if the thing
           actually comes back. */
        case "knock.delivered":
          return {
            heldKnocks: s.heldKnocks.filter((k) => k.id !== event.knock.id),
            knock: {
              id: event.knock.id,
              fromId: event.knock.fromId,
              toId: event.knock.toId,
              ...(event.knock.reason ? { reason: event.knock.reason } : {}),
              state: "pending" as const,
            },
            toasts: [
              ...s.toasts,
              {
                id: nextId("toast"),
                kind: "knock" as const,
                title: msg("toast.knockedInFocus", "{name} knocked while you were in Focus", { name: nameOf(s.users, event.knock.fromId) }),
                body: event.knock.reason ?? msg("toast.knockedInFocusBody", "Wanted a quick word"),
              },
            ],
          };

        case "knock.answered": {
          if (!s.knock || s.knock.id !== event.knockId) return {};
          const knock = { ...s.knock, state: event.state };
          if (event.state === "accepted") {
            const other = knock.fromId === s.me ? knock.toId : knock.fromId;
            return { knock, huddleWith: other };
          }
          /* Deferring holds it; it is delivered later rather than dropped. */
          if (event.state === "deferred") {
            return {
              knock,
              heldKnocks: [
                ...s.heldKnocks,
                {
                  id: knock.id,
                  fromId: knock.fromId,
                  ...(knock.reason ? { reason: knock.reason } : {}),
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
          return { knock };
        }

        /* ------------------------------------------------------- meetings */
        case "meeting.chat_opened":
          return patchMeeting(s, event.meetingId, { channelId: event.channelId });

        case "meeting.recording_requested":
          return patchMeeting(s, event.meetingId, { recordingState: "requested" });

        case "meeting.recording_started":
          return patchMeeting(s, event.meetingId, { recordingState: "recording" });

        case "meeting.recording_declined":
          return patchMeeting(s, event.meetingId, { recordingState: "declined" });

        /* Stopping does not produce a file immediately - it goes to processing,
           because pretending a recording is instantly ready is the kind of lie
           that gets discovered in the first real week. */
        case "meeting.recording_stopped":
          return patchMeeting(s, event.meetingId, { recordingState: "processing" });

        case "meeting.recording_ready":
          return patchMeeting(s, event.meetingId, {
            recordingState: "ready",
            recordingFile: event.file,
          });

        /* Idempotent, as every socket event has to be: the same meeting can
           arrive twice, once from this client and once from another. */
        case "meeting.scheduled":
          if ([...s.meetings, ...s.pastMeetings].some((mt) => mt.id === event.meeting.id)) return {};
          return { meetings: [...s.meetings, keyed(event.meeting)] };

        case "meeting.guest_arrived": {
          const state = s.settings.lobby === "auto" ? ("admitted" as const) : ("lobby" as const);
          return {
            meetings: s.meetings.map((mt) => {
              if (mt.id !== event.meetingId) return mt;
              if (mt.guests.some((g) => g.email === event.guestEmail)) {
                return { ...mt, guests: mt.guests.map((g) => (g.email === event.guestEmail ? { ...g, state } : g)) };
              }
              /* Nobody invited them: they came by the link. */
              if (!event.name) return mt;
              return { ...mt, guests: [...mt.guests, { name: event.name, email: event.guestEmail, state, viaLink: true }] };
            }),
          };
        }

        case "meeting.guest_declined": {
          const meetings = s.meetings.map((m) =>
            m.id === event.meetingId
              ? { ...m, guests: m.guests.map((g) => (g.email === event.guestEmail ? { ...g, state: "declined" as const } : g)) }
              : m,
          );
          return { meetings };
        }

        /* Someone who was in the call came, and stays counted after they go.
           Someone who only waited did not: an invitation goes back to being
           an invitation, and a visitor from the link is simply gone. */
        case "meeting.guest_link_reset":
          return { meetings: s.meetings.map((mt) => (mt.id === event.meetingId ? { ...mt, guestKey: event.guestKey } : mt)) };

        case "meeting.guest_left":
          return {
            meetings: s.meetings.map((m) => {
              if (m.id !== event.meetingId) return m;
              const guests = m.guests.flatMap((g) => {
                if (g.email !== event.guestEmail) return [g];
                if (g.state === "admitted") return [{ ...g, state: "left" as const }];
                return g.viaLink ? [] : [{ ...g, state: "invited" as const }];
              });
              return { ...m, guests };
            }),
          };

        case "meeting.share_changed": {
          const meetings = s.meetings.map((m) => {
            if (m.id !== event.meetingId) return m;
            const next = { ...m };
            if (event.userId) next.sharingUserId = event.userId;
            else delete next.sharingUserId;
            return next;
          });
          return { meetings };
        }

        case "meeting.guest_admitted":
          return {
            meetings: s.meetings.map((mt) =>
              mt.id === event.meetingId
                ? {
                    ...mt,
                    guests: mt.guests.map((g) =>
                      g.email === event.guestEmail ? { ...g, state: "admitted" as const } : g,
                    ),
                  }
                : mt,
            ),
          };

        /* Ending a meeting moves it to the past AND records what the
           post-meeting screen needs: when it actually finished, and who was
           really there rather than who was invited. */
        case "meeting.ended": {
          const ended = s.meetings.find((mt) => mt.id === event.meetingId);
          return {
            meetings: s.meetings.filter((mt) => mt.id !== event.meetingId),
            pastMeetings: ended
              ? [{ ...ended, endedAt: event.endedAt, attendedIds: event.attendedIds }, ...s.pastMeetings]
              : s.pastMeetings,
          };
        }

        /* -------------------------------------------------- notifications */
        case "notification.created":
          return { notifications: [event.notification, ...s.notifications] };

        case "notification.read":
          return {
            notifications: s.notifications.map((n) =>
              n.id === event.notificationId ? { ...n, read: true } : n,
            ),
          };

        case "notification.all_read":
          return { notifications: s.notifications.map((n) => ({ ...n, read: true })) };

        /* ------------------------------------------------------ demo only */
        case "demo.clock_advanced": {
          const offset = s.clockOffsetMinutes + event.minutes;
          const mine = s.presence.find((p) => p.userId === s.me);
          /* Focus ending produces the summary rather than a pile of alerts. */
          if (mine?.status === "focus") {
            return {
              clockOffsetMinutes: offset,
              presence: s.presence.map((p) =>
                p.userId === s.me
                  ? { ...p, status: "available" as const, focusUntil: undefined, customText: undefined }
                  : p,
              ),
              focusSummary: {
                knocks: s.heldKnocks.length,
                mentions: s.channels.reduce((n, c) => n + c.mentions, 0) + 2,
                threads: 1,
              },
            };
          }
          return { clockOffsetMinutes: offset };
        }

        case "session.signed_out": {
          if (event.userId !== s.me) return {};
          const mine = s.presence.find((p) => p.userId === s.me);
          const resume: Status = mine && mine.status !== "offline" && mine.status !== "away" ? mine.status : "available";
          return {
            presence: s.presence.map((p) =>
              p.userId === s.me ? { ...p, status: "offline" as Status, speaking: false, since: event.at } : p,
            ),
            session: {
              state: "signed_out",
              reason: event.reason,
              at: event.at,
              resume,
              ...(event.idleMinutes !== undefined ? { idleMinutes: event.idleMinutes } : {}),
              ...(event.scope ? { scope: event.scope } : {}),
            },
            knock: null,
            huddleWith: null,
            openThreadId: null,
            officeFocus: null,
          };
        }

        case "session.signed_in": {
          if (event.userId !== s.me) return {};
          const resume: Status = s.session.state === "signed_out" ? s.session.resume : "available";
          return {
            presence: s.presence.map((p) => (p.userId === s.me ? { ...p, status: resume, since: event.at } : p)),
            session: { state: "active" },
          };
        }

        case "demo.reset":
          return freshData();

        default:
          return {};
      }
    });
    for (const observe of observers) observe(event);
  },

  /* ==========================================================================
     ACTIONS
     Named for the endpoints that replace them. Each applies locally and, in
     production, would also POST. See HANDOFF.md.
     ======================================================================== */

  sendMessage: (channelId, text, threadId, attachments = []) => {
    const s = get();
    const message: Message = {
      id: nextId("m"),
      channelId,
      authorId: s.me,
      text,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      replyUserIds: [],
      reactions: [],
      attachments: [...attachments],
      pinned: false,
      ...(threadId ? { threadId } : {}),
    };
    s.applyEvent({ type: "message.created", message });
  },

  editMessage: (messageId, text) =>
    get().applyEvent({ type: "message.edited", messageId, text, editedAt: new Date().toISOString() }),

  deleteMessage: (messageId) =>
    get().applyEvent({ type: "message.deleted", messageId, deletedAt: new Date().toISOString() }),

  toggleReaction: (messageId, emoji) =>
    get().applyEvent({ type: "message.reaction_toggled", messageId, emoji, userId: get().me }),

  togglePin: (messageId) => get().applyEvent({ type: "message.pin_toggled", messageId }),

  markChannelRead: (channelId) => get().applyEvent({ type: "channel.read", channelId }),

  markAllRead: () => get().applyEvent({ type: "channel.all_read" }),

  setStatus: (status, customText, focusMinutes) => {
    const focusUntil =
      status === "focus" && focusMinutes
        ? new Date(Date.now() + focusMinutes * 60_000).toISOString()
        : undefined;
    get().applyEvent({ type: "presence.status_changed", userId: get().me, status, customText, focusUntil });
  },

  moveTo: (position) => get().applyEvent({ type: "presence.moved", userId: get().me, position }),

  joinRoom: (roomId) => {
    const s = get();
    const room = s.floor.rooms.find((r) => r.id === roomId);

    /* A room can refuse you, and says why. */
    if (room) {
      const inside = s.presence.filter((p) => p.roomId === roomId && p.userId !== s.me).length;
      if (roomHardCap(room) && inside >= room.capacity) {
        set((st) => ({
          toasts: [
            ...st.toasts,
            {
              id: nextId("toast"),
              kind: "system" as const,
              title: msg("toast.roomFull", "{room} is full", { room: room.name }),
              body: msg("toast.roomFullBody", "It takes {capacity}, and {inside, plural, one {# person is} other {# people are}} in it. Try another room, or wait.", { capacity: room.capacity, inside }),
            },
          ],
        }));
        return;
      }
      if (!roomIsOpenNow(room) && room.hours) {
        set((st) => ({
          toasts: [
            ...st.toasts,
            {
              id: nextId("toast"),
              kind: "system" as const,
              title: msg("toast.roomClosed", "{room} is closed", { room: room.name }),
              body: msg("toast.roomClosedBody", "It opens at {from} and closes at {to}.", { from: room.hours?.from ?? "", to: room.hours?.to ?? "" }),
            },
          ],
        }));
        return;
      }
    }

    s.applyEvent({ type: "presence.room_changed", userId: s.me, roomId });
    if (room) {
      /* Sit in the middle of the room being joined. */
      s.applyEvent({
        type: "presence.moved",
        userId: s.me,
        position: { x: room.rect.x + room.rect.w / 2, y: room.rect.y + room.rect.h / 2 },
      });
    }
    /* The status a room puts you in: its own setting, else its kind's. A room
       that never opens audio never puts you "in a meeting". */
    const entry = room ? roomEntryStatus(room) : null;
    if (room && entry && (entry !== "in_meeting" || roomOpensAudio(room))) {
      s.applyEvent({ type: "presence.status_changed", userId: s.me, status: entry });
    }
  },

  leaveRoom: () => {
    const s = get();
    /* Leaving a room means returning to the open floor, which on this plan is
       the desk area. Setting roomId to undefined would leave you standing
       inside the desks visually while not being counted in them. */
    const desk = s.floor.rooms.find((r) => r.kind === "desk");
    s.applyEvent({ type: "presence.room_changed", userId: s.me, roomId: desk?.id });
    s.applyEvent({ type: "presence.status_changed", userId: s.me, status: "available" });
    s.applyEvent({
      type: "presence.moved",
      userId: s.me,
      position: desk ? { x: desk.rect.x + 11, y: desk.rect.y + 16 } : { x: 14, y: 20 },
    });
  },

  sendKnock: (toId, reason) =>
    get().applyEvent({ type: "knock.sent", knockId: nextId("k"), fromId: get().me, toId, reason }),

  answerKnock: (state) => {
    const k = get().knock;
    if (k) get().applyEvent({ type: "knock.answered", knockId: k.id, state });
  },

  endHuddle: () => set({ huddleWith: null, knock: null }),

  createChannel: ({ name, topic, isPrivate, memberIds }) => {
    const id = nextId("c");
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    get().applyEvent({
      type: "channel.created",
      channel: {
        id,
        name: slug || "new-channel",
        kind: isPrivate ? "private" : "public",
        ...(topic && topic.trim() ? { topic: topic.trim() } : {}),
        memberIds: Array.from(new Set([get().me, ...memberIds])),
      },
    });
    return id;
  },

  updateChannel: (channelId, patch) => get().applyEvent({ type: "channel.updated", channelId, patch }),

  addChannelMembers: (channelId, userIds) =>
    get().applyEvent({ type: "channel.members_added", channelId, userIds }),

  leaveChannel: (channelId) => get().applyEvent({ type: "channel.left", channelId }),

  openOrCreateDm: (userId) => {
    const s = get();
    /* There is no conversation with yourself: "" lands on the conversation list, not on a random
       channel (CHT-034). */
    if (userId === s.me) return "";
    const existing = s.channels.find(
      (c) => c.kind === "dm" && c.memberIds.length === 2 && c.memberIds.includes(userId),
    );
    if (existing) return existing.id;

    const id = nextId("dm");
    const name = nameOf(s.users, userId);
    s.applyEvent({
      type: "channel.created",
      channel: { id, name, kind: "dm", memberIds: [s.me, userId] },
    });
    return id;
  },

  createGroupDm: (userIds, name) => {
    const s = get();
    const members = Array.from(new Set([s.me, ...userIds]));
    /* The same people again open the group they already have, unless it's given a new name (CHT-034). */
    if (!name?.trim()) {
      const same = s.channels.find(
        (c) => c.kind === "group" && !c.archived && c.memberIds.length === members.length && members.every((m) => c.memberIds.includes(m)),
      );
      if (same) return same.id;
    }
    const id = nextId("grp");
    const label =
      name?.trim() ||
      members
        .filter((u) => u !== s.me)
        .map((u) => nameOf(s.users, u).split(" ")[0])
        .join(", ");
    s.applyEvent({
      type: "channel.created",
      channel: { id, name: label, kind: "group", memberIds: members },
    });
    return id;
  },

  removeChannelMember: (channelId, userId) =>
    get().applyEvent({ type: "channel.member_removed", channelId, userId }),

  addRoom: ({ name, kind, capacity }) => {
    const rooms = get().floor.rooms;
    let rect = findFreeRect(rooms, kind);
    if (!rect) {
      /* No gap anywhere. The open desk area is the one room that can give up
         floor without losing what it is for, so a slot is carved from it. */
      const carved = carveFromDesk(rooms, kind);
      if (!carved) return null;
      get().applyEvent({ type: "room.updated", roomId: carved.deskId, patch: { rect: carved.deskRect } });
      rect = carved.roomRect;
    }
    const id = nextId("r");
    get().applyEvent({
      type: "room.added",
      room: { id, name: name.trim() || "New room", kind, capacity: Math.max(1, capacity), locked: false, rect },
    });
    return id;
  },

  removeRoom: (roomId) => get().applyEvent({ type: "room.removed", roomId }),

  updateRoom: (roomId, patch) => get().applyEvent({ type: "room.updated", roomId, patch }),

  dismissHeldKnock: (id) => set((s) => ({ heldKnocks: s.heldKnocks.filter((k) => k.id !== id) })),

  focusOnPerson: (userId) => set({ officeFocus: { userId, nonce: Date.now() } }),

  toggleLocalMute: (userId) =>
    set((s) => ({
      localMutes: s.localMutes.includes(userId)
        ? s.localMutes.filter((id) => id !== userId)
        : [...s.localMutes, userId],
    })),

  setLocalVolume: (userId, factor) =>
    set((s) => ({ localVolumes: { ...s.localVolumes, [userId]: Math.max(0, Math.min(2, factor)) } })),

  setSelfDeafened: (on) => set({ selfDeafened: on }),

  setServerMute: (userId, muted) => get().applyEvent({ type: "presence.muted", userId, muted }),

  setServerDeafen: (userId, deafened) => get().applyEvent({ type: "presence.deafened", userId, deafened }),

  exportWorkspace: () => {
    const s = get();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        workspace: s.settings,
        floor: s.floor,
        people: s.users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
        channels: s.channels,
        messages: s.messages,
        meetings: s.meetings,
      },
      null,
      2,
    );
  },

  setViewingRole: (role) =>
    set((s) => ({
      viewingRole: role,
      users: s.users.map((u) => (u.id === s.me ? { ...u, role } : u)),
    })),

  ensureMeetingChannel: (meetingId) => {
    const state = get();
    const meeting =
      state.meetings.find((m) => m.id === meetingId) ??
      state.pastMeetings.find((m) => m.id === meetingId);
    if (!meeting) return "";
    if (meeting.channelId) return meeting.channelId;

    const channelId = nextId("c");
    /* The meeting's chat is an ordinary channel, so it survives the call and
       stays searchable. A conversation that evaporates when the call ends is
       where decisions go to be lost. */
    state.applyEvent({
      type: "channel.created",
      channel: {
        id: channelId,
        name: meeting.title,
        kind: "private",
        topic: "Chat from the meeting",
        memberIds: meeting.participantIds,
      },
    });
    state.applyEvent({ type: "meeting.chat_opened", meetingId, channelId });
    return channelId;
  },

  declineGuest: (meetingId, guestEmail) => get().applyEvent({ type: "meeting.guest_declined", meetingId, guestEmail }),

  setShare: (meetingId, userId) =>
    get().applyEvent(userId ? { type: "meeting.share_changed", meetingId, userId } : { type: "meeting.share_changed", meetingId }),

  ensureRoomChannel: (roomId) => {
    const state = get();
    const room = state.floor.rooms.find((r) => r.id === roomId);
    if (!room) return "";
    if (room.channelId) return room.channelId;
    const channelId = nextId("c");
    /* A room's chat is an ordinary channel, like a meeting's: a note left in
       Room B is still there tomorrow and still searchable. */
    state.applyEvent({
      type: "channel.created",
      channel: {
        id: channelId,
        name: room.name,
        kind: "private",
        topic: "Chat from the room",
        memberIds: state.users.map((u) => u.id),
      },
    });
    state.applyEvent({ type: "room.updated", roomId, patch: { channelId } });
    return channelId;
  },

  setActivation: (activationState) => {
    const current = get().settings.activation;
    const trialEndsAt = activationState === "trial" ? new Date(Date.now() + 14 * 864e5).toISOString() : undefined;
    get().updateSettings({
      activation: { ...current, state: activationState, ...(trialEndsAt ? { trialEndsAt } : {}) },
    });
  },

  connectIntegration: (id) => {
    const settings = get().settings;
    get().updateSettings({ integrations: { ...settings.integrations, [id]: "connecting" } });
    /* The OAuth round trip, stood in for by a moment's wait. */
    setTimeout(() => {
      const now = get().settings.integrations;
      get().updateSettings({ integrations: { ...now, [id]: "connected", account: now.account ?? "info@somion.org" } });
    }, 700);
  },

  disconnectIntegration: (id) => {
    const settings = get().settings;
    get().updateSettings({ integrations: { ...settings.integrations, [id]: "off" } });
  },

  requestRecording: (meetingId) => {
    if (!get().settings.recordingAllowed) return;
    get().applyEvent({ type: "meeting.recording_requested", meetingId });
  },

  startRecording: (meetingId) => get().applyEvent({ type: "meeting.recording_started", meetingId }),

  declineRecording: (meetingId) => get().applyEvent({ type: "meeting.recording_declined", meetingId }),

  stopRecording: (meetingId) => {
    get().applyEvent({ type: "meeting.recording_stopped", meetingId });
    /* Processing takes a moment, then the file lands in the File Manager. */
    const all = [...get().meetings, ...get().pastMeetings];
    const title = all.find((m) => m.id === meetingId)?.title ?? "Meeting";
    setTimeout(() => {
      get().applyEvent({
        type: "meeting.recording_ready",
        meetingId,
        file: {
          id: nextId("f"),
          name: `${title.replace(/[^\w -]/g, "")} recording.mp4`,
          size: "148 MB",
          kind: "video",
        },
      });
    }, 4000);
  },

  endMeeting: (meetingId, attendedIds) =>
    get().applyEvent({
      type: "meeting.ended",
      meetingId,
      endedAt: new Date().toISOString(),
      attendedIds,
    }),

  scheduleMeeting: (meeting) => get().applyEvent({ type: "meeting.scheduled", meeting: keyed(meeting) }),

  resetGuestLink: (meetingId) => get().applyEvent({ type: "meeting.guest_link_reset", meetingId, guestKey: newGuestKey() }),

  startInstantMeeting: ({ title, channelId, announcement }) => {
    const s = get();
    const channel = channelId ? s.channels.find((c) => c.id === channelId) : undefined;
    const start = new Date();
    const id = `mt-${start.getTime().toString(36)}`;
    s.applyEvent({
      type: "meeting.scheduled",
      meeting: {
        id,
        title,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + s.settings.meetingDefaultMinutes * 60_000).toISOString(),
        participantIds: [s.me, ...(channel?.memberIds.filter((m) => m !== s.me) ?? [])],
        guests: [],
        recordingState: "none",
        instant: true,
        /* A meeting started from a conversation talks in that conversation,
           so what is said in the call lands where the people already are. */
        ...(channel ? { channelId: channel.id } : {}),
      },
    });
    if (channel) {
      s.applyEvent({
        type: "message.created",
        message: {
          id: nextId("m"),
          channelId: channel.id,
          authorId: s.me,
          text: announcement ?? "",
          createdAt: start.toISOString(),
          replyCount: 0,
          replyUserIds: [],
          reactions: [],
          attachments: [],
          pinned: false,
          meetingId: id,
        },
      });
    }
    return id;
  },

  admitGuest: (meetingId, guestEmail) =>
    get().applyEvent({ type: "meeting.guest_admitted", meetingId, guestEmail }),

  updateSettings: (patch) => {
    const before = get().settings.template;
    set((s) => ({ settings: { ...s.settings, ...patch } }));
    if (patch.earshot) setEarshot(patch.earshot);
    if (patch.template && patch.template !== before) {
      get().applyEvent({
        type: "floor.template_changed",
        template: patch.template,
        rooms: seed.floorTemplates[patch.template].map((r) => ({ ...r, rect: { ...r.rect } })),
      });
    }
  },

  openThread: (messageId) => set({ openThreadId: messageId }),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearFocusSummary: () => set({ focusSummary: null }),

  signOut: (reason, idleMinutes, scope) => {
    const s = get();
    if (s.session.state === "signed_out") return;
    /* Leave the room first, so the audio graph and the room's count let go
       of a person who is no longer there. */
    const mine = s.presence.find((p) => p.userId === s.me);
    const room = mine?.roomId ? s.floor.rooms.find((r) => r.id === mine.roomId) : undefined;
    if (room && room.kind !== "desk") s.leaveRoom();
    get().applyEvent({
      type: "session.signed_out",
      userId: s.me,
      reason,
      at: new Date().toISOString(),
      ...(idleMinutes !== undefined ? { idleMinutes } : {}),
      ...(scope ? { scope } : {}),
    });
    /* In the suite, signing out of Chats signs out of the suite: the session is cleared and the
       next visit goes through sign-in (CHT-006). */
    if (inSuite()) void signOutOfSuite();
  },

  refreshIdleWatch: async () => {
    const support = await queryIdleSupport();
    set({ idleWatch: { support } });
  },

  allowIdleWatch: async () => {
    const support = await requestIdlePermission();
    set({ idleWatch: { support } });
  },

  signIn: () => get().applyEvent({ type: "session.signed_in", userId: get().me, at: new Date().toISOString() }),

  setAccent: (id) => {
    applyAccent(id);
    set({ accent: id });
  },

  notify: (title, body) =>
    set((s) => ({ toasts: [...s.toasts, { id: nextId("toast"), kind: "system" as const, title, body }] })),

  resetWorkspace: () => get().applyEvent({ type: "demo.reset" }),

  adoptSuiteSession: (session) => {
    const u = session.user;
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
    const initials = name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
    suiteSeat = { name, initials, role: u.userType === "admin" ? "owner" : "member", title: u.jobTitle ?? undefined };
    set((s) => ({ users: seated(s.users), viewOnly: session.readOnly ? { by: session.viewingBy } : null }));
  },
}, get, set));
