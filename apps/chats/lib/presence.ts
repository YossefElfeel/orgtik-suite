/**
 * SOMION HQ - PRESENCE VOCABULARY
 *
 * One place defining what each status looks like, is called, and offers as its
 * single direct action. Two rules are enforced here rather than trusted to
 * every call site:
 *
 *   1. Status is never conveyed by colour alone. Each state carries a distinct
 *      mark shape as well as a hue, so the six remain separable for colour-blind
 *      viewers and in greyscale.
 *   2. Every state has exactly ONE primary action (product principle: one click
 *      to talk). Available -> knock. In a room -> join. Focus -> leave a message.
 */

import type {
  RoomKind, Status } from "@/entities";
import { msgText } from "@/lib/messages";

export type PresenceMark = "solid" | "ring" | "half" | "dot-in-ring" | "hollow" | "slash";

export interface StatusMeta {
  id: Status;
  label: string;
  /** Shape of the presence mark. Carries the state without relying on hue. */
  mark: PresenceMark;
  /** Token names, never raw hex. */
  color: string;
  soft: string;
  /** The single direct action offered for a person in this state. */
  primaryAction: "knock" | "join" | "message";
  /** Plain-language explanation used in the status picker and transparency page. */
  description: string;
}

export const STATUS_META: Record<Status, StatusMeta> = {
  available: {
    id: "available",
    label: msgText("status.available", "Available"),
    mark: "solid",
    color: "var(--color-presence-available)",
    soft: "var(--color-presence-available-soft)",
    primaryAction: "knock",
    description: msgText("status.available.desc", "Open to being interrupted."),
  },
  in_meeting: {
    id: "in_meeting",
    label: msgText("status.in_meeting", "In a meeting"),
    mark: "dot-in-ring",
    color: "var(--color-presence-meeting)",
    soft: "var(--color-presence-meeting-soft)",
    primaryAction: "join",
    description: msgText("status.in_meeting.desc", "In a room with other people. You can walk in."),
  },
  busy: {
    id: "busy",
    label: msgText("status.busy", "Busy"),
    mark: "half",
    color: "var(--color-presence-busy)",
    soft: "var(--color-presence-busy-soft)",
    primaryAction: "message",
    description: msgText("status.busy.desc", "Working on something. Prefers a message."),
  },
  focus: {
    id: "focus",
    label: msgText("status.focus", "Focus"),
    mark: "ring",
    color: "var(--color-presence-focus)",
    soft: "var(--color-presence-focus-soft)",
    primaryAction: "message",
    description: msgText("status.focus.desc", "Knocks are held and delivered afterwards. Nothing is lost."),
  },
  away: {
    id: "away",
    label: msgText("status.away", "Away"),
    mark: "slash",
    color: "var(--color-presence-away)",
    soft: "var(--color-presence-away-soft)",
    primaryAction: "message",
    description: msgText("status.away.desc", "Idle for more than ten minutes."),
  },
  offline: {
    id: "offline",
    label: msgText("status.offline", "Offline"),
    mark: "hollow",
    color: "var(--color-presence-offline)",
    soft: "var(--color-presence-offline-soft)",
    primaryAction: "message",
    description: msgText("status.offline.desc", "Not signed in."),
  },
};

export const STATUS_PICKER_ORDER: Status[] = ["available", "busy", "focus", "away"];

/**
 * Avatar tints. Warm, friendly, and deliberately DESATURATED so that a person's
 * tint can never be mistaken for a presence lamp - presence owns saturation.
 */
export const AVATAR_TINTS = [
  { bg: "#EADFD3", fg: "#5C4A38" },
  { bg: "#D9E3DE", fg: "#3B5148" },
  { bg: "#E4DCE9", fg: "#4E4159" },
  { bg: "#E9DFD8", fg: "#5E4738" },
  { bg: "#DBE1EA", fg: "#3F4A5C" },
  { bg: "#E7E2D2", fg: "#57513A" },
  { bg: "#E2DDE7", fg: "#4B4557" },
  { bg: "#DFE6DC", fg: "#43503E" },
  { bg: "#EDDFDA", fg: "#63453E" },
  { bg: "#D8E2E4", fg: "#3A4C50" },
  { bg: "#E6E0D6", fg: "#584F3E" },
  { bg: "#E3DEE6", fg: "#4A4356" },
] as const;

export const tintFor = (index: number) =>
  AVATAR_TINTS[index % AVATAR_TINTS.length] ?? AVATAR_TINTS[0];

/** Room kinds map to their own quiet surface token. */
/**
 * The catalogue of room kinds. A kind is a bundle of defaults - what the room
 * is for, whether walking in opens a microphone, what it does to your status,
 * whether the floor names the people inside - and a room can override any of
 * them in its own settings. Everything that lists or labels kinds reads this.
 */
export interface RoomKindSpec {
  id: RoomKind;
  label: string;
  hint: string;
  capacity: number;
  /** Walking in opens a microphone. */
  audio: boolean;
  /** Applied on entry unless the room says otherwise. */
  entryStatus: "in_meeting" | "focus" | null;
  /** The floor shows a count rather than names, unless the room says otherwise. */
  hideOccupants?: boolean;
  /** Nobody beyond capacity, unless the room says otherwise. */
  hardCap?: boolean;
}

export const ROOM_KINDS: RoomKindSpec[] = [
  { id: "meeting", label: msgText("roomKind.meeting", "Meeting room"), hint: msgText("roomKind.meeting.hint", "Audio opens when you enter"), capacity: 6, audio: true, entryStatus: "in_meeting" },
  { id: "boardroom", label: msgText("roomKind.boardroom", "Boardroom"), hint: msgText("roomKind.boardroom.hint", "The big table. Clients may join by link"), capacity: 12, audio: true, entryStatus: "in_meeting" },
  { id: "booth", label: msgText("roomKind.booth", "Phone booth"), hint: msgText("roomKind.booth.hint", "One person, one call. Full means full"), capacity: 1, audio: true, entryStatus: "in_meeting", hardCap: true },
  { id: "studio", label: msgText("roomKind.studio", "Studio"), hint: msgText("roomKind.studio.hint", "Recording and podcasts"), capacity: 4, audio: true, entryStatus: "in_meeting" },
  { id: "training", label: msgText("roomKind.training", "Training room"), hint: msgText("roomKind.training.hint", "Rows facing a whiteboard"), capacity: 16, audio: true, entryStatus: "in_meeting" },
  { id: "focus", label: msgText("roomKind.focus", "Focus room"), hint: msgText("roomKind.focus.hint", "Heads-down work; knocks are held"), capacity: 3, audio: true, entryStatus: null },
  { id: "lounge", label: msgText("roomKind.lounge", "Lounge"), hint: msgText("roomKind.lounge.hint", "Kitchen, sofas, no agenda"), capacity: 8, audio: true, entryStatus: null },
  { id: "reception", label: msgText("roomKind.reception", "Reception"), hint: msgText("roomKind.reception.hint", "Where guests arrive"), capacity: 6, audio: true, entryStatus: null },
  { id: "outdoor", label: msgText("roomKind.outdoor", "Terrace"), hint: msgText("roomKind.outdoor.hint", "Outside. Benches and plants"), capacity: 10, audio: true, entryStatus: null },
  { id: "wellness", label: msgText("roomKind.wellness", "Wellness room"), hint: msgText("roomKind.wellness.hint", "Rest. Quiet, and nobody is named inside"), capacity: 2, audio: false, entryStatus: null, hideOccupants: true },
  { id: "prayer", label: msgText("roomKind.prayer", "Prayer room"), hint: msgText("roomKind.prayer.hint", "Quiet. Never opens audio"), capacity: 6, audio: false, entryStatus: null },
  { id: "desk", label: msgText("roomKind.desk", "Desk area"), hint: msgText("roomKind.desk.hint", "The open floor"), capacity: 16, audio: false, entryStatus: null },
];

export const ROOM_KIND_SPEC: Record<string, RoomKindSpec> = Object.fromEntries(
  ROOM_KINDS.map((k) => [k.id, k]),
);

export const ROOM_SURFACE: Record<string, string> = {
  meeting: "var(--color-floor-room)",
  boardroom: "var(--color-floor-room)",
  booth: "var(--color-floor-focus-zone)",
  studio: "var(--color-floor-focus-zone)",
  training: "var(--color-floor-room)",
  focus: "var(--color-floor-focus-zone)",
  lounge: "var(--color-floor-lounge)",
  reception: "var(--color-floor-desk)",
  outdoor: "var(--color-floor-outdoor)",
  wellness: "var(--color-floor-prayer)",
  desk: "var(--color-floor-desk)",
  prayer: "var(--color-floor-prayer)",
};

/**
 * The floor material of each room kind, as a CSS background-image laid over
 * the room's tint. Wood planks under the desks, a fine weave in the meeting
 * and focus rooms, tile in the kitchen, and a warm rug in the prayer room.
 * All are drawn at a contrast low enough that you register the material and
 * never the pattern.
 */
const CARPET =
  "radial-gradient(circle at 1px 1px, var(--mat-line-carpet) 0.8px, transparent 0) 0 0 / 6px 6px";
const TILE = [
  "repeating-linear-gradient(90deg, transparent 0 41px, var(--mat-line-tile) 41px 42px)",
  "repeating-linear-gradient(0deg, transparent 0 41px, var(--mat-line-tile) 41px 42px)",
].join(", ");
const RUG = [
  "repeating-linear-gradient(90deg, transparent 0 7px, var(--mat-line-rug) 7px 8px)",
  "repeating-linear-gradient(0deg, transparent 0 7px, var(--mat-line-rug) 7px 8px)",
].join(", ");

export const ROOM_MATERIAL: Record<string, string> = {
  boardroom: CARPET,
  booth: CARPET,
  studio: CARPET,
  training: CARPET,
  reception: TILE,
  /* decking: wide boards */
  outdoor: "repeating-linear-gradient(0deg, transparent 0 17px, var(--mat-line-wood) 17px 18px)",
  wellness: RUG,
  desk: [
    "repeating-linear-gradient(90deg, transparent 0 118px, var(--mat-line-wood) 118px 119px)",
    "repeating-linear-gradient(0deg, transparent 0 13px, rgb(150 122 84 / 0.035) 13px 14px)",
  ].join(", "),
  meeting:
    "radial-gradient(circle at 1px 1px, var(--mat-line-carpet) 0.8px, transparent 0) 0 0 / 6px 6px",
  focus:
    "radial-gradient(circle at 1px 1px, var(--mat-line-carpet) 0.8px, transparent 0) 0 0 / 6px 6px",
  lounge: [
    "repeating-linear-gradient(90deg, transparent 0 41px, var(--mat-line-tile) 41px 42px)",
    "repeating-linear-gradient(0deg, transparent 0 41px, var(--mat-line-tile) 41px 42px)",
  ].join(", "),
  prayer: [
    "repeating-linear-gradient(90deg, transparent 0 7px, var(--mat-line-rug) 7px 8px)",
    "repeating-linear-gradient(0deg, transparent 0 7px, var(--mat-line-rug) 7px 8px)",
  ].join(", "),
};

/**
 * Only these room kinds are conversations you can walk into.
 *
 * The desk area is open floor: people sit there, but "joining" it is not an act
 * of talking to anyone. The prayer room is excluded for a stronger reason - it
 * is a quiet room for prayer, and opening a live microphone in it would be a
 * straightforward violation of what the room is for. Presence still shows that
 * someone is in there, because that is what stops people walking in on them.
 */
export const isConversationRoom = (kind: string): boolean =>
  ROOM_KIND_SPEC[kind]?.audio ?? kind !== "desk";

/** Whether walking into THIS room opens a microphone: its kind, unless the
    room has been set to never carry audio. */
export const roomOpensAudio = (room: { kind: string; audio?: "on-entry" | "off" }): boolean =>
  isConversationRoom(room.kind) && room.audio !== "off";

const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Open now, honouring windows that cross midnight. No hours means always. */
export const roomIsOpenNow = (
  room: { hours?: { from: string; to: string } | null },
  now: Date = new Date(),
): boolean => {
  if (!room.hours) return true;
  const n = now.getHours() * 60 + now.getMinutes();
  const from = minutesOf(room.hours.from);
  const to = minutesOf(room.hours.to);
  return from <= to ? n >= from && n < to : n >= from || n < to;
};

export const ROOM_LABEL: Record<string, string> = Object.fromEntries(
  ROOM_KINDS.map((k) => [k.id, k.label]),
);

/* The effective behaviour of a room: its own settings over its kind's. */
export const roomHidesOccupants = (room: { kind: string; showOccupants?: boolean }): boolean =>
  room.showOccupants === undefined ? Boolean(ROOM_KIND_SPEC[room.kind]?.hideOccupants) : !room.showOccupants;

export const roomHardCap = (room: { kind: string; hardCap?: boolean }): boolean =>
  room.hardCap ?? Boolean(ROOM_KIND_SPEC[room.kind]?.hardCap);

export const roomEntryStatus = (room: {
  kind: string;
  entryStatus?: "in_meeting" | "focus" | "available" | null;
}): "in_meeting" | "focus" | "available" | null =>
  room.entryStatus === undefined ? (ROOM_KIND_SPEC[room.kind]?.entryStatus ?? null) : room.entryStatus;
