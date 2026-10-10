"use client";

/**
 * SOMION HQ - WORKSPACE STORE
 *
 * Hooks read confirmed workspace snapshots. Actions stage supported events
 * through the mock API; only a successful persistence response hydrates them.
 * Calls, voice playback, typing and receipts are explicitly local samples.
 */

import { create } from "zustand";
import { roomEntryStatus, roomHardCap, roomIsOpenNow, roomOpensAudio } from "@/lib/presence";
import { applyAccent, readAccent, type AccentId } from "@/lib/appearance";
import { queryIdleSupport, requestIdlePermission, type IdleSupport } from "@/lib/idle";
import { inSuite, signOutOfSuite, type SuiteSession } from "@/lib/suite-session";
import { roleForSuiteSession } from "@/lib/roles";
import { persistEvent, reloadWorkspace, currentWorkspaceNamespace, recoverableMessage, currentMessageScope, eventUnconfirmed, type SyncState, type BootstrapData } from "./platform";

import{setWorkspaceTime}from"@/lib/time";
const pendingMessages = new Map<string, import("@/entities/events").CreatedMessage>();
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
  now: string;
  typing: Record<string,string[]>;
  knocks: import("@/entities").Knock[];
  workspaceId: string;
  fixtureId: string | null;
  historicalUsers: { id: Id; name: string; initials: string; tint: number }[];
  readState: Record<string, number>;
  workspaceSync: SyncState;
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
    state: import("@/entities").KnockState;
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
  applyEvent: (event: ServerEvent) => Promise<boolean>;
  /** The suite's signed-in person takes their seat (FS-CHT-4). */
  adoptSuiteSession: (session: SuiteSession) => void;
  clearWorkspace: (state: SyncState) => void;
  hydrateWorkspace: (data: BootstrapData, state: SyncState) => void;
  setWorkspaceSync: (state: SyncState) => void;

  /* actions, named for the endpoints that will replace them */
  /** A message with its files (CHT-001: they were dropped); a message may be files alone. */
  sendMessage: (channelId: Id, text: string, threadId?: Id, attachments?: FileRef[]) => Promise<boolean>;
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

const nextId = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`;

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
 * View as (D-017) is read-only. The real API refuses changes with 403 read_only; the mock
 * workspace lives in the browser, so the store refuses them here, the same way: a change the
 * person asked for says why, and the automatic ones (marking a conversation read) stay quiet.
 * Personal, local choices (accent, what you hear, open panels) still work.
 */
const LOUD_WRITES = [
  "sendMessage", "editMessage", "deleteMessage", "toggleReaction", "togglePin", "setStatus", "moveTo", "joinRoom",
  "sendKnock", "answerKnock", "endHuddle", "createChannel", "updateChannel", "addChannelMembers", "leaveChannel",
  "createGroupDm", "openOrCreateDm", "ensureRoomChannel", "ensureMeetingChannel", "removeChannelMember", "addRoom", "removeRoom", "updateRoom", "setServerMute", "setServerDeafen",
  "declineGuest", "setShare", "scheduleMeeting",
  "startInstantMeeting", "resetGuestLink", "requestRecording", "startRecording", "declineRecording", "stopRecording", "endMeeting",
  "admitGuest", "updateSettings",
] as const;
const QUIET_WRITES = ["markChannelRead", "markAllRead", "leaveRoom", "dismissHeldKnock"] as const;
/** What a refused call returns: the callers of id-returning actions treat "" and null as "nothing made". */
const REFUSED: Partial<Record<string, unknown>> = { addRoom: null, createChannel: "", createGroupDm: "", openOrCreateDm: "", ensureRoomChannel: "", ensureMeetingChannel: "", startInstantMeeting: "" };
const PERSISTENT_ACTIONS = new Set(["ensureMeetingChannel","ensureRoomChannel","setStatus","moveTo","joinRoom","leaveRoom","sendKnock","answerKnock","setServerMute","setServerDeafen","endHuddle","updateRoom","addRoom","removeRoom","markNotificationRead","markAllNotificationsRead","scheduleMeeting","startInstantMeeting","resetGuestLink","requestRecording","startRecording","declineRecording","stopRecording","endMeeting","admitGuest","declineGuest","setShare","updateSettings","sendMessage", "editMessage", "deleteMessage", "toggleReaction", "togglePin", "createChannel", "updateChannel", "addChannelMembers", "leaveChannel", "openOrCreateDm", "createGroupDm", "removeChannelMember", "markChannelRead", "markAllRead"]);

function guardWrites<T extends WorkspaceState>(state: T, get: () => WorkspaceState, set: (fn: (s: WorkspaceState) => Partial<WorkspaceState>) => void): T {
  const guarded = { ...state } as Record<string, unknown>;
  for (const name of [...LOUD_WRITES, ...QUIET_WRITES]) {
    const original = state[name] as (...args: unknown[]) => unknown;
    const loud = (LOUD_WRITES as readonly string[]).includes(name);
    guarded[name] = (...args: unknown[]) => {
      if (!get().viewOnly && get().workspaceSync.status === "ready" && get().workspaceSync.canWrite) {
        if (PERSISTENT_ACTIONS.has(name)) return original(...args);
        if (loud) set(s => ({ workspaceSync: { ...s.workspaceSync, errorCode: "chat_flow_deferred" } }));
        return REFUSED[name];
      }
      if (loud) {
        set((s) => ({
          toasts: [
            ...s.toasts.filter((x) => !(typeof x.title !== "string" && x.title.key === "toast.readOnly")),
            { id: nextId("toast"), kind: "system" as const, title: msg("toast.readOnly", "Changes are turned off"), body: msg("toast.readOnlyBody", "This workspace is read-only. You can read conversations, but changes are turned off.") },
          ],
        }));
      }
      return REFUSED[name];
    };
  }
  return guarded as T;
}

/** A guest link's secret: 24 random bytes, URL-safe. */



const freshData = () => ({
  now: "", typing: {}, knocks: [],workspaceId: "", fixtureId: null, historicalUsers: [], readState: {},
  workspaceSync: { status: "loading", namespace: "", canWrite: false, pending: 0 } as SyncState,
  me: "",
  users: [] as User[], presence: [] as Presence[],
  floor: { id: "floor", template: "team", rooms: [] } as Floor,
  channels: [] as Channel[], messages: [] as Message[], threadReplies: {} as Record<string, Message[]>,
  meetings: [] as Meeting[], pastMeetings: [] as Meeting[], notifications: [] as Notification[],
  insight: { week: "", presenceHoursByHour: Array.from({ length: 7 }, () => Array(24).fill(0)), meetingHoursByDay: Array(7).fill(0), roomUsage: [], cohortSize: 0 } as Insight,
  myTime: { week: "", presenceHoursByDay: Array(7).fill(0), meetingHoursByDay: Array(7).fill(0), focusHoursByDay: Array(7).fill(0) } as MyTime,
  settings: { ...seed.settings, name: "", activation: { state: "active", tier: "business", userCap: null }, integrations: { google: "off", microsoft: "off" } } as WorkspaceSettings,
  session: { state: "active" } as Session,
  knock: null,
  huddleWith: null,
  heldKnocks: [],
  viewingRole: "member" as Role,
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

/* ------------------------------------------------------------------- store */

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
  applyEvent: (event) => persistEvent(event),

  /* Channels, messages and read state are staged by the workspace API. */
  sendMessage: (channelId, text, threadId, attachments = []) => {
    const s = get();
    const scope = currentMessageScope();
    const pendingKey = scope + ":" + channelId + ":" + (threadId || "");
    const message: import("@/entities/events").CreatedMessage = pendingMessages.get(pendingKey) || recoverableMessage(channelId, threadId) || {
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
    pendingMessages.set(pendingKey, message);
    return persistEvent({ type: "message.created", message }).then(saved => {
      if (saved || !eventUnconfirmed({ type: "message.created", message }, scope)) pendingMessages.delete(pendingKey);
      return saved;
    });
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
    get().applyEvent({ type: "presence.status_changed", userId: get().me, status, customText, focusUntil, focusMinutes });
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

  endHuddle: () => {const s=get(),knock=s.knocks.find(k=>k.state==="accepted"&&(k.fromId===s.me||k.toId===s.me));if(knock)void s.applyEvent({type:"knock.ended",knockId:knock.id});},

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

  

  

  

  requestRecording: (meetingId) => {
    if (!get().settings.recordingAllowed) return;
    get().applyEvent({ type: "meeting.recording_requested", meetingId });
  },

  startRecording: (meetingId) => get().applyEvent({ type: "meeting.recording_started", meetingId }),

  declineRecording: (meetingId) => get().applyEvent({ type: "meeting.recording_declined", meetingId }),

  stopRecording: (meetingId) => {
    get().applyEvent({ type: "meeting.recording_stopped", meetingId });

  },

  endMeeting: (meetingId, attendedIds) =>
    get().applyEvent({
      type: "meeting.ended",
      meetingId,
      endedAt: new Date().toISOString(),
      attendedIds,
    }),

  scheduleMeeting: (meeting) => get().applyEvent({ type: "meeting.scheduled", meeting }),

  resetGuestLink: (meetingId) => get().applyEvent({ type: "meeting.guest_link_reset", meetingId,  }),

  startInstantMeeting: ({ title, channelId, announcement }) => {
    const s = get();
    const channel = channelId ? s.channels.find((c) => c.id === channelId) : undefined;
    const start = new Date(s.now||Date.now());
    const id = "mt-"+crypto.randomUUID();
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

  updateSettings: (patch) => {const {template,...settings}=patch;if(Object.keys(settings).length)void get().applyEvent({type:'settings.updated',patch:settings});if(template&&template!==get().settings.template)void get().applyEvent({type:'floor.template_changed',template,rooms:seed.floorTemplates[template].map(r=>({...r,rect:{...r.rect}}))});},

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

  resetWorkspace: () => { void reloadWorkspace(); },

  clearWorkspace: (workspaceSync) => set({ ...freshData(), workspaceSync, viewOnly: null }),
  setWorkspaceSync: (workspaceSync) => set({ workspaceSync }),
  hydrateWorkspace: (data, workspaceSync) => {
    setWorkspaceTime(data.now);
    const keys = ["now", "typing", "knocks", "workspaceId", "fixtureId", "historicalUsers", "readState", "me", "users", "presence", "floor", "channels", "messages", "threadReplies", "meetings", "pastMeetings", "notifications", "insight", "myTime", "settings"] as const;
    const patch = Object.fromEntries(keys.map(key => [key, data[key]])) as Pick<WorkspaceState, typeof keys[number]>;
    const incoming=data.knocks?.find(k=>k.toId===data.me&&k.state==='pending')||null;const held=data.knocks?.filter(k=>k.toId===data.me&&k.state==='deferred')||[];
    const accepted=data.knocks?.find(k=>k.state==="accepted"&&(k.fromId===data.me||k.toId===data.me));
    set({ ...patch, huddleWith:accepted?(accepted.fromId===data.me?accepted.toId:accepted.fromId):null,knock:incoming,heldKnocks:held,workspaceSync, viewingRole: data.users.find(user => user.id === data.me)?.role || "member" });
  },

  adoptSuiteSession: (session) => {
    set({ viewOnly: session.workspaceContext?.actor.readOnly ? { by: session.viewingBy } : null, viewingRole: roleForSuiteSession(session) });
  },
}, get, set));
