/**
 * SOMION HQ - ENTITY TYPES
 *
 * This file is written as the API contract, not as demo convenience. It is the
 * starting point handed to the backend team for the OpenAPI schema (see
 * HANDOFF.md). Everything is tenant-scoped implicitly; the demo runs one tenant.
 *
 * IDs are strings. Timestamps are ISO 8601 strings.
 * Nothing here imports React or touches the store.
 */

export type Id = string;
export type IsoDateTime = string;

/* ---------------------------------------------------------------- identity */

/** The six presence states pinned by the product spec (requirement OF-2). */
export type Status =
  | "available"
  | "busy"
  | "focus"
  | "in_meeting"
  | "away"
  | "offline";

/**
 * Whether there is a session at all. Ended by the inactivity policy or by
 * choice; `resume` is the status to come back to.
 */
/** Where idleness was measured: the whole computer, or only this tab. */
export type IdleScope = "computer" | "page";

export type Session =
  | { state: "active" }
  | { state: "signed_out"; reason: "inactive" | "manual"; at: IsoDateTime; idleMinutes?: number; scope?: IdleScope; resume: Status };

/** Roles are inherited from the SaaS layer. HQ never maintains its own list. */
export type Role = "owner" | "admin" | "member" | "guest";

export interface User {
  id: Id;
  name: string;
  role: Role;
  title: string;
  /** Initials render the avatar. No stock photography, no generic egg icons. */
  initials: string;
  /** Stable hue index into the avatar tint ramp, derived server-side. */
  tint: number;
  timezone: string;
}

export interface Presence {
  userId: Id;
  status: Status;
  customText?: string;
  /** Room the person currently occupies, if any. */
  roomId?: Id;
  /** Position on the floor, in floor units (0-100 on both axes). */
  position: { x: number; y: number };
  since: IsoDateTime;
  /** Set while status is "focus". Knocks are deferred until this passes. */
  focusUntil?: IsoDateTime;
  /** True only while the person is actually producing audio. */
  speaking: boolean;
  /** A moderator has cut their microphone for everyone. */
  muted?: boolean;
  /** A moderator has cut what they hear. */
  deafened?: boolean;
}

/* ------------------------------------------------------------------- floor */

export type FloorTemplate = "studio" | "team" | "agency";
export type RoomKind =
  | "meeting"
  | "boardroom"
  | "booth"
  | "studio"
  | "training"
  | "focus"
  | "lounge"
  | "reception"
  | "outdoor"
  | "wellness"
  | "prayer"
  | "desk";

export interface Room {
  id: Id;
  name: string;
  kind: RoomKind;
  capacity: number;
  locked: boolean;
  /** Rectangle in floor units (0-100 on both axes). */
  rect: { x: number; y: number; w: number; h: number };

  /* ---- behaviour, all optional: a room with none of these set behaves the
     way its kind implies ---- */

  /** One line on what the room is for; shown when it is empty and on hover. */
  purpose?: string;
  /** "off" never opens a microphone, whatever the kind. */
  audio?: "on-entry" | "off";
  /** Refuse entry beyond capacity instead of only labelling the room full. */
  hardCap?: boolean;
  /** Applied to whoever walks in. `null` leaves their status alone. */
  entryStatus?: "in_meeting" | "focus" | "available" | null;
  /** Meeting rooms: clients may join this room by link. */
  guestsAllowed?: boolean;
  /** When false, the floor shows a count for this room and no names. */
  showOccupants?: boolean;
  /** Opening hours; outside them the room is closed. */
  hours?: { from: string; to: string } | null;
  /** The room's own chat, created on first use. */
  channelId?: Id;
}

export interface Floor {
  id: Id;
  template: FloorTemplate;
  rooms: Room[];
}

/* -------------------------------------------------------------------- chat */

export type ChannelKind = "public" | "private" | "dm" | "group";

/**
 * How loudly a channel is allowed to interrupt you. A single mute switch is too
 * blunt: the useful middle is a busy channel you still want to be pulled into
 * by name, which is also the workspace default.
 */
export type NotifyLevel = "all" | "mentions" | "none";

export interface Channel {
  id: Id;
  name: string;
  kind: ChannelKind;
  topic?: string;
  memberIds: Id[];
  unread: number;
  mentions: number;
  archived: boolean;
  notify: NotifyLevel;
}

/**
 * A live card for an object owned by another Business OS module.
 * HQ renders these; the owning module supplies the fields through a small
 * "card" endpoint. This is the module's differentiator (requirement CH-9).
 */
export type ObjectKind =
  | "task"
  | "client"
  | "deal"
  | "invoice"
  | "employee"
  | "file";

export interface ObjectRef {
  type: ObjectKind;
  id: Id;
  title: string;
  status: string;
  owner?: Id;
  due?: IsoDateTime;
  amount?: string;
  /** The module the card belongs to, for the "open in" affordance. */
  module: string;
  /** Drives the stale / no-permission / deleted card states. */
  state: "live" | "stale" | "no_permission" | "deleted";
}

export interface FileRef {
  id: Id;
  reference?: { workspaceId: string; fileId: string; versionId: string };
  state?: "available" | "unavailable";
  mimetype?: string;
  contentPath?: string;
  name: string;
  /** Size already formatted for display; the File Manager owns the raw bytes. */
  size: string;
  /** Canonical bytes, when available; display with the current locale formatter. */
  bytes?: number;
  kind: "pdf" | "image" | "sheet" | "doc" | "video" | "other";
}

export interface Reaction {
  emoji: string;
  userIds: Id[];
}

export interface Message {
  id: Id;
  channelId: Id;
  authorId: Id;
  text: string;
  createdAt: IsoDateTime;
  editedAt?: IsoDateTime;
  deletedAt?: IsoDateTime;
  /** Present when this message is a reply inside a thread. */
  threadId?: Id;
  replyCount: number;
  /** Last few repliers, for the thread summary line on the parent message. */
  replyUserIds: Id[];
  reactions: Reaction[];
  attachments: FileRef[];
  /** Set on the first message of a thread started from a Business OS object. */
  contextRef?: ObjectRef;
  pinned: boolean;
  /** Rendered as a system line rather than a person's message. */
  system?: boolean;
  /**
   * Set on the message that announces a meeting started in this conversation.
   * It renders as the meeting itself, so the way in is one click from the
   * transcript for as long as the call runs.
   */
  meetingId?: Id;
}

/* ---------------------------------------------------------------- meetings */

/* `left` is a guest who was in the call and has gone: they still count as
   having come, and the stage no longer shows them. */
export type GuestState = "invited" | "lobby" | "admitted" | "declined" | "left";

export interface MeetingGuest {
  name: string;
  /**
   * How the guest is told apart. A guest who came by the meeting link was
   * never asked for an address, so theirs is a key for that visit only.
   */
  email: string;
  company?: string;
  state: GuestState;
  /** Came by the shared link rather than by an invitation. */
  viaLink?: boolean;
}

/**
 * Recording is consent-gated: it cannot start until everyone in the call has
 * been asked. `requested` is the window in which they are being asked, and it
 * is a real state rather than an instant, because someone can decline.
 */
export type RecordingState =
  | "none"
  | "requested"
  | "recording"
  | "processing"
  | "ready"
  | "declined";

export interface Meeting {
  id: Id;
  title: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  roomId?: Id;
  participantIds: Id[];
  guests: MeetingGuest[];
  /**
   * The secret in the guest link (/guest/<guestKey>): random, never the meeting id, and replaced
   * by "Reset link", after which the old link stops working (CHT-005).
   */
  guestKey?: string;
  recordingState?: RecordingState;
  /**
   * The recording lives in the File Manager, like every other artefact. HQ
   * keeps the reference, never a second copy.
   */
  recordingFile?: FileRef;
  /**
   * The meeting's conversation. Created on the first message sent during the
   * call, and deliberately outliving it: a decision made in a meeting should
   * still be findable when the call is over.
   */
  channelId?: Id;
  /** Set when the call actually ends, which is not the same as `endsAt`. */
  endedAt?: IsoDateTime;
  /** Who was actually there, as opposed to who was invited. */
  attendedIds?: Id[];
  /** What the meeting is for, written when it is scheduled. */
  description?: string;
  /** Whoever is sharing a screen right now, if anyone. */
  sharingUserId?: Id;
  /** A weekly meeting is scheduled as its next occurrences, each marked. */
  recurrence?: "weekly";
  /**
   * Started on the spot with Meet now rather than scheduled. It begins the
   * minute it is created, runs for the workspace's default length and has no
   * room: whoever needs to be in it is sent the way in.
   */
  instant?: boolean;
  /** Links the meeting back to a CRM client or a project. */
  contextRef?: ObjectRef;
  notes?: string;
}

/* ------------------------------------------------------------------- knock */

export type KnockState =
  | "pending"
  | "accepted"
  | "declined"
  | "deferred"
  | "missed";

export interface Knock {
  id: Id;
  fromId: Id;
  toId: Id;
  reason?: string;
  state: KnockState;
  createdAt: IsoDateTime;
}

/* ----------------------------------------------------------- notifications */

export type NotificationKind = "mention" | "dm" | "knock" | "reminder";

export interface Notification {
  id: Id;
  kind: NotificationKind;
  /** Channel, knock or meeting id depending on kind. */
  refId: Id;
  actorId?: Id;
  title: string;
  body: string;
  read: boolean;
  createdAt: IsoDateTime;
}

/* -------------------------------------------------------------- insights --
   Aggregated at team level only, never per person. The transparency page
   (requirement IN-4) describes exactly what is collected. A cohort below
   MIN_COHORT is not rendered at all. */

export const MIN_COHORT = 5;

export interface Insight {
  week: string;
  /** [dayIndex][hourIndex] -> number of people present. Team totals only. */
  presenceHoursByHour: number[][];
  meetingHoursByDay: number[];
  roomUsage: { roomId: Id; hours: number }[];
  /** Size of the group these numbers describe. Below MIN_COHORT: suppressed. */
  cohortSize: number;
  /**
   * The same totals for the period before. A delta is only worth showing if it
   * is measured; an arrow with no prior period behind it is decoration that
   * looks like information.
   */
  previous?: {
    meetingHours: number;
    presentHours: number;
    roomHours: number;
    busiestHourHeadcount: number;
  };
  /**
   * Eight weeks of team totals, oldest first, so a trend is measured rather
   * than asserted. Team-wide only, like everything else here.
   */
  history?: { week: string; meetingHours: number; presentHours: number }[];
  /**
   * How meetings were sized this week. The distribution is the number worth
   * knowing: "40 hours of meetings" says nothing about whether the team is
   * holding two-person conversations or nine-person broadcasts.
   */
  meetingSizes?: { band: "2" | "3-4" | "5-8" | "9+"; count: number; hours: number }[];
  /** Hours each room was actually available, for a utilisation rate. */
  roomCapacityHours?: number;
}

/** The personal view. Only ever shown to the person it describes. */
export interface MyTime {
  week: string;
  presenceHoursByDay: number[];
  meetingHoursByDay: number[];
  focusHoursByDay: number[];
}

/* ------------------------------------------------------------- workspace -- */

export interface WorkspaceSettings {
  name: string;
  template: FloorTemplate;
  guestsAllowed: boolean;
  retentionDays: number | null;
  recordingAllowed: boolean;
  soundsEnabled: boolean;
  notifyOn: "all" | "mentions_dms" | "none";
  quietHours: { from: string; to: string } | null;

  /* ---- presence & focus ---- */
  /** Minutes without input before a person is shown as Away. */
  autoAwayMinutes: 5 | 10 | 15 | 30 | null;
  /** Minutes without any input before the session is ended. `null` = never. */
  inactivitySignOutMinutes: 5 | 15 | 30 | 60 | null;
  focusDefaultMinutes: 25 | 50 | 90;

  /* ---- floor & audio ---- */
  /** How close "within earshot" is, for the spatial audio and the bubbles. */
  earshot: "near" | "normal" | "wide";
  daylight: boolean;
  idleMotion: boolean;
  roomHoverCards: boolean;
  defaultView: "floor" | "list";

  /* ---- chat ---- */
  channelNotifyDefault: "all" | "mentions" | "none";
  /** How long after sending a message may still be edited. `null` = always. */
  editWindowMinutes: number | null;

  /* ---- meetings ---- */
  meetingDefaultMinutes: 30 | 45 | 60;
  /** Whether a guest waits in the lobby or is let straight in. */
  lobby: "manual" | "auto";

  /* ---- access: these narrow what a role may do ---- */
  canCreateChannels: "everyone" | "admins";
  canInviteGuests: "everyone" | "admins";
  canRecord: "everyone" | "admins";

  /* ---- workspace ---- */
  language: "en" | "pseudo-de" | "pseudo-fr";
  /** Insights are suppressed below this group size. Never below five. */
  minCohort: number;

  /* ---- the module in the suite ---- */
  /** Switched on per tenant by the SaaS layer: not yet, on trial, or activated. */
  activation: Activation;
  /** Calendar connections, per provider. */
  integrations: Integrations;
}

export type ActivationState = "off" | "trial" | "active";
export interface Activation {
  state: ActivationState;
  tier: "starter" | "business" | "enterprise";
  /** Flat-price tools have no purchased-seat quantity. Access still requires an assigned grant. */
  userCap: number | null;
  trialEndsAt?: IsoDateTime;
}

export type IntegrationState = "off" | "connecting" | "connected" | "error";
export interface Integrations {
  google: IntegrationState;
  microsoft: IntegrationState;
  /** The account a connected calendar belongs to. */
  account?: string;
}
