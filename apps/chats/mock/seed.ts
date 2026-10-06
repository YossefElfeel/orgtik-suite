/**
 * SOMION HQ - SEEDED WORKSPACE  [DISPOSABLE]
 *
 * Everything in mock/ is thrown away when the backend arrives. It is isolated
 * here precisely so deleting it is a single directory removal.
 *
 * The seed is deterministic: same people, same order, same messages every run.
 * Nothing narrated aloud during the demo is allowed to be random.
 */

import type {
  Channel,
  Floor,
  FloorTemplate,
  Insight,
  Meeting,
  Message,
  MyTime,
  Notification,
  Presence,
  Room,
  User,
  WorkspaceSettings,
} from "@/entities";

/** The demo runs as one fixed person. Authentication is out of scope. */
export const ME = "u-yousef";

/**
 * The demo clock is "now", fixed once at load.
 *
 * Everything below is expressed as an offset from it rather than as an absolute
 * date. A hard-coded date would make every message read "just now" whenever the
 * demo is run on a different day, which is the fastest way to make a prototype
 * look broken in front of the people deciding its future. Offsets keep the
 * workspace looking like the same lived-in morning whenever it is opened.
 */
export const DEMO_EPOCH = new Date();

/** Minutes in the past. */
const iso = (minutesAgo: number): string =>
  new Date(DEMO_EPOCH.getTime() - minutesAgo * 60_000).toISOString();

/** Minutes in the future. */
const at = (minutesAhead: number): string =>
  new Date(DEMO_EPOCH.getTime() + minutesAhead * 60_000).toISOString();

/* ------------------------------------------------------------------- people
   A small Swiss-based studio with the mix of nationalities that is actually
   typical of one. Names are real-sounding and locale-appropriate. */

export const users: User[] = [
  { id: ME, name: "Yousef El Fil", role: "owner", title: "Lead Product Designer", initials: "YE", tint: 0, timezone: "Europe/Zurich" },
  { id: "u-sara", name: "Sara Lindqvist", role: "admin", title: "Engineering Lead", initials: "SL", tint: 1, timezone: "Europe/Zurich" },
  { id: "u-omar", name: "Omar Haddad", role: "member", title: "Backend Engineer", initials: "OH", tint: 2, timezone: "Europe/Berlin" },
  { id: "u-lena", name: "Lena Brunner", role: "member", title: "Account Manager", initials: "LB", tint: 3, timezone: "Europe/Zurich" },
  { id: "u-marc", name: "Marc Oberholzer", role: "admin", title: "Managing Director", initials: "MO", tint: 4, timezone: "Europe/Zurich" },
  { id: "u-tomas", name: "Tomás Rebelo", role: "member", title: "Frontend Engineer", initials: "TR", tint: 5, timezone: "Europe/Lisbon" },
  { id: "u-nadia", name: "Nadia Kovač", role: "member", title: "Product Manager", initials: "NK", tint: 6, timezone: "Europe/Zurich" },
  { id: "u-ines", name: "Inés Caballero", role: "member", title: "Brand Designer", initials: "IC", tint: 7, timezone: "Europe/Madrid" },
  { id: "u-jonas", name: "Jonas Weber", role: "member", title: "Finance", initials: "JW", tint: 8, timezone: "Europe/Zurich" },
  { id: "u-priya", name: "Priya Raghunathan", role: "member", title: "QA Engineer", initials: "PR", tint: 9, timezone: "Europe/Berlin" },
  { id: "u-felix", name: "Felix Amsler", role: "member", title: "Support", initials: "FA", tint: 10, timezone: "Europe/Zurich" },
  { id: "u-maya", name: "Maya Toussaint", role: "member", title: "Marketing", initials: "MT", tint: 11, timezone: "Europe/Paris" },
];

export const userById = (id: string): User | undefined =>
  users.find((u) => u.id === id);

/* -------------------------------------------------------------------- floor
   Floor units are 0-100 on both axes so the canvas scales without maths in
   the components. */

export const floor: Floor = {
  id: "fl-1",
  template: "team",
  rooms: [
    { id: "r-desks", name: "Desks", kind: "desk", capacity: 16, locked: false, rect: { x: 4, y: 6, w: 44, h: 52 } },
    { id: "r-library", name: "Library", kind: "focus", capacity: 4, locked: true, rect: { x: 4, y: 63, w: 25, h: 31 } },
    { id: "r-a", name: "Room A", kind: "meeting", capacity: 8, locked: false, rect: { x: 52, y: 6, w: 24, h: 34 }, purpose: "Client calls and reviews", guestsAllowed: true },
    { id: "r-b", name: "Room B", kind: "meeting", capacity: 6, locked: false, rect: { x: 80, y: 6, w: 16, h: 34 }, purpose: "Standups and quick syncs" },
    { id: "r-prayer", name: "Prayer Room", kind: "prayer", capacity: 6, locked: false, rect: { x: 32, y: 63, w: 16, h: 31 }, purpose: "Prayer and reflection" },
    { id: "r-quiet", name: "Quiet Room", kind: "focus", capacity: 3, locked: false, rect: { x: 52, y: 44, w: 20, h: 50 }, purpose: "Heads-down work. Walking in sets you to Focus.", entryStatus: "focus" },
    { id: "r-lounge", name: "Kitchen", kind: "lounge", capacity: 10, locked: false, rect: { x: 76, y: 44, w: 20, h: 50 }, purpose: "Coffee, lunch, no agenda" },
  ],
};

/**
 * The three floor templates, as layouts. Room ids are shared across templates
 * wherever the same room exists, so switching template keeps people in the
 * rooms that survive it and puts the rest back on the open floor.
 *
 * Agency leaves the bottom-right corner free on purpose: a fifty-person floor
 * is the one that gets rooms added to it.
 */
export const floorTemplates: Record<FloorTemplate, Room[]> = {
  studio: [
    { id: "r-desks", name: "Desks", kind: "desk", capacity: 10, locked: false, rect: { x: 4, y: 6, w: 56, h: 88 } },
    { id: "r-a", name: "Room A", kind: "meeting", capacity: 6, locked: false, rect: { x: 64, y: 6, w: 32, h: 42 } },
    { id: "r-lounge", name: "Kitchen", kind: "lounge", capacity: 6, locked: false, rect: { x: 64, y: 52, w: 32, h: 42 } },
  ],
  team: floor.rooms,
  agency: [
    { id: "r-desks", name: "Desks", kind: "desk", capacity: 24, locked: false, rect: { x: 4, y: 6, w: 36, h: 52 } },
    { id: "r-library", name: "Library", kind: "focus", capacity: 4, locked: true, rect: { x: 4, y: 63, w: 16, h: 31 } },
    { id: "r-prayer", name: "Prayer Room", kind: "prayer", capacity: 6, locked: false, rect: { x: 24, y: 63, w: 16, h: 31 } },
    { id: "r-a", name: "Room A", kind: "meeting", capacity: 8, locked: false, rect: { x: 44, y: 6, w: 18, h: 30 } },
    { id: "r-b", name: "Room B", kind: "meeting", capacity: 6, locked: false, rect: { x: 66, y: 6, w: 14, h: 30 } },
    { id: "r-c", name: "Room C", kind: "meeting", capacity: 4, locked: false, rect: { x: 84, y: 6, w: 12, h: 30 } },
    { id: "r-quiet", name: "Quiet Room", kind: "focus", capacity: 4, locked: false, rect: { x: 44, y: 40, w: 18, h: 54 } },
    { id: "r-lounge", name: "Kitchen", kind: "lounge", capacity: 12, locked: false, rect: { x: 66, y: 40, w: 14, h: 54 } },
    { id: "r-booth", name: "Phone booth", kind: "booth", capacity: 1, locked: false, rect: { x: 84, y: 40, w: 12, h: 26 } },
  ],
};

export const roomById = (id: string) => floor.rooms.find((r) => r.id === id);

/* ----------------------------------------------------------------- presence
   The opening state of the demo: seven people around, two talking in Room B,
   one in Focus. This is beat 1 of the script and it must look the same every
   single time. */

export const presence: Presence[] = [
  { userId: ME, status: "available", roomId: "r-desks", position: { x: 15, y: 22 }, since: iso(4), speaking: false },
  { userId: "u-sara", status: "available", roomId: "r-desks", position: { x: 27, y: 31 }, since: iso(41), speaking: false },
  { userId: "u-lena", status: "available", roomId: "r-desks", position: { x: 38, y: 20 }, since: iso(63), speaking: false },
  { userId: "u-tomas", status: "available", roomId: "r-desks", position: { x: 20, y: 45 }, since: iso(12), speaking: false },
  { userId: "u-ines", status: "busy", customText: "Client review, back at 11", roomId: "r-desks", position: { x: 39, y: 43 }, since: iso(26), speaking: false },
  { userId: "u-nadia", status: "in_meeting", roomId: "r-b", position: { x: 85, y: 18 }, since: iso(19), speaking: true },
  { userId: "u-marc", status: "in_meeting", roomId: "r-b", position: { x: 90, y: 30 }, since: iso(19), speaking: false },
  { userId: "u-omar", status: "focus", customText: "Shipping the export job", focusUntil: at(48), roomId: "r-quiet", position: { x: 61, y: 62 }, since: iso(48), speaking: false },
  { userId: "u-priya", status: "away", roomId: "r-lounge", position: { x: 85, y: 62 }, since: iso(9), speaking: false },
  /* Offline people have no position and never appear on the floor. Somebody
     who is not signed in is not in the office; they are in the list only. */
  { userId: "u-jonas", status: "offline", position: { x: 0, y: 0 }, since: iso(880), speaking: false },
  { userId: "u-felix", status: "offline", position: { x: 0, y: 0 }, since: iso(1020), speaking: false },
  { userId: "u-maya", status: "offline", position: { x: 0, y: 0 }, since: iso(760), speaking: false },
];

/* ----------------------------------------------------------------- channels */

export const channels: Channel[] = [
  { id: "c-general", name: "general", kind: "public", topic: "Company-wide announcements", memberIds: users.map((u) => u.id), unread: 0, mentions: 0, archived: false, notify: "mentions" },
  { id: "c-design", name: "design", kind: "public", topic: "Design critique and handoff", memberIds: [ME, "u-ines", "u-nadia", "u-tomas"], unread: 4, mentions: 1, archived: false, notify: "mentions" },
  { id: "c-engineering", name: "engineering", kind: "public", topic: "Builds, reviews, incidents", memberIds: [ME, "u-sara", "u-omar", "u-tomas", "u-priya"], unread: 11, mentions: 0, archived: false, notify: "mentions" },
  { id: "c-clients", name: "clients", kind: "private", topic: "Account conversations", memberIds: [ME, "u-lena", "u-marc", "u-nadia"], unread: 2, mentions: 1, archived: false, notify: "mentions" },
  { id: "c-hiring", name: "hiring", kind: "private", topic: "Open roles and candidates", memberIds: [ME, "u-marc", "u-sara"], unread: 0, mentions: 0, archived: false, notify: "none" },
  { id: "c-random", name: "random", kind: "public", topic: "Non-work", memberIds: users.map((u) => u.id), unread: 7, mentions: 0, archived: false, notify: "none" },
  { id: "c-2025-rebrand", name: "2025-rebrand", kind: "public", topic: "Archived after launch", memberIds: [ME, "u-ines"], unread: 0, mentions: 0, archived: true, notify: "mentions" },
  { id: "dm-sara", name: "Sara Lindqvist", kind: "dm", memberIds: [ME, "u-sara"], unread: 2, mentions: 2, archived: false, notify: "mentions" },
  { id: "dm-lena", name: "Lena Brunner", kind: "dm", memberIds: [ME, "u-lena"], unread: 0, mentions: 0, archived: false, notify: "mentions" },
  { id: "dm-omar", name: "Omar Haddad", kind: "dm", memberIds: [ME, "u-omar"], unread: 0, mentions: 0, archived: false, notify: "mentions" },
  { id: "gdm-launch", name: "Launch crew", kind: "group", memberIds: [ME, "u-nadia", "u-ines", "u-maya"], unread: 1, mentions: 0, archived: false, notify: "mentions" },
];

/* ------------------------------------------------------------------- tasks
   The fake Task Manager screen. It exists only to carry the shared "Discuss"
   button, which is the module's whole differentiator. */

export interface MockTask {
  id: string;
  title: string;
  status: string;
  assigneeId: string;
  ownerId: string;
  due: string;
  client: string;
  description: string;
}

export const tasks: MockTask[] = [
  {
    id: "t-4471",
    title: "Renew Baumgartner AG retainer",
    status: "In progress",
    assigneeId: "u-lena",
    ownerId: "u-marc",
    due: at(7 * 60),
    client: "Baumgartner AG",
    description:
      "Retainer runs out at the end of the month. Lena is preparing the renewal; Marc signs. The rate change from the July conversation still needs to be reflected before this goes out.",
  },
  {
    id: "t-4468",
    title: "Q3 invoice run",
    status: "Blocked",
    assigneeId: "u-jonas",
    ownerId: "u-marc",
    due: at(2 * 60),
    client: "Internal",
    description: "Waiting on timesheet approvals from two people before the run can go out.",
  },
  {
    id: "t-4462",
    title: "Migrate file storage to the new region",
    status: "In review",
    assigneeId: "u-omar",
    ownerId: "u-sara",
    due: at(6 * 60),
    client: "Internal",
    description: "Region pinning for the Swiss data centre. Needs a review pass before it goes near production.",
  },
];

export const taskById = (id: string) => tasks.find((t) => t.id === id);

/* ---------------------------------------------------------------- messages
   Written as a real working morning, not as filler. Conversations reference
   each other and the tasks above. */

const m = (
  id: string,
  channelId: string,
  authorId: string,
  text: string,
  minutesAgo: number,
  extra: Partial<Message> = {},
): Message => ({
  id,
  channelId,
  authorId,
  text,
  createdAt: iso(minutesAgo),
  replyCount: 0,
  replyUserIds: [],
  reactions: [],
  attachments: [],
  pinned: false,
  ...extra,
});

export const messages: Message[] = [
  /* -- general -- */
  m("m-1", "c-general", "u-marc", "Morning. Reminder that Thursday is a half day for the office move, so anything client-facing should land Wednesday.", 186, { pinned: true, reactions: [{ emoji: "👍", userIds: ["u-sara", "u-lena", "u-nadia", "u-tomas"] }] }),
  m("m-2", "c-general", "u-maya", "The new case study is live. Took the Baumgartner numbers out at their request, so it reads a bit thinner than the draft.", 128),
  m("m-3", "c-general", "u-sara", "Deploy at 14:00 today. Should be invisible, but if search gets slow that is me.", 44),

  /* -- design -- */
  m("m-10", "c-design", "u-ines", "Pushed the second pass on the invoice template. The alignment issue on the totals block is fixed.", 97, { attachments: [{ id: "f-1", name: "invoice-template-v2.fig", size: "4.2 MB", kind: "doc" }] }),
  m("m-11", "c-design", "u-nadia", "This is much better. One thing: the due date is still competing with the amount for attention.", 91, { replyCount: 3, replyUserIds: ["u-ines", ME] }),
  m("m-12", "c-design", "u-tomas", "I can build the totals block today if the spacing is settled.", 62),
  m("m-13", "c-design", "u-ines", `@Yousef El Fil can you look at the empty state before I send this on? It is the last piece.`, 38),
  m("m-13b", "c-engineering", "u-sara", "Deploy notes for tonight are in the repo: https://github.com/somion/hq-gateway/pull/482 - a review by 17:00 would be good.", 151),

  /* -- engineering -- */
  m("m-20", "c-engineering", "u-omar", "The export job is running about four times slower since the region change. Looking at it now.", 152),
  m("m-21", "c-engineering", "u-sara", "Is it the job itself or the storage round trip?", 149),
  m("m-22", "c-engineering", "u-omar", "Storage round trip. Every file is crossing the region boundary twice.", 147, { reactions: [{ emoji: "😩", userIds: ["u-sara", "u-priya"] }] }),
  m("m-23", "c-engineering", "u-priya", "I can reproduce it on staging with anything over about 40 MB.", 121),
  m("m-24", "c-engineering", "u-tomas", "Front end is fine, it just waits longer. No changes needed on my side.", 88),

  /* -- clients -- */
  m("m-30", "c-clients", "u-lena", "Baumgartner asked whether we can do the review call at 11 instead of 15:00. I said yes.", 74),
  m("m-31", "c-clients", "u-marc", `@Yousef El Fil are you joining that one? Anna wants to see the invoice work.`, 71),

  /* -- a conversation attached to a task, so the differentiator is visible at
        rest rather than only after someone presses Discuss -- */
  m("m-ctx-task-t-4471", "c-clients", "u-lena", "Starting a thread on this so the rate change does not get lost again.", 118, {
    replyCount: 2,
    replyUserIds: ["u-marc", ME],
    contextRef: {
      type: "task",
      id: "t-4471",
      title: "Renew Baumgartner AG retainer",
      status: "In progress",
      owner: "u-marc",
      module: "Task Manager",
      state: "live",
    },
  }),

  /* -- DMs -- */
  m("m-40", "dm-sara", "u-sara", "Do you have ten minutes before the deploy? I want to walk through the search change with you.", 33),
  m("m-41", "dm-sara", "u-sara", "No rush, whenever you surface.", 31),
  m("m-42", "dm-lena", ME, "Sent the retainer numbers over. Shout if the rate change looks wrong.", 240),
  m("m-43", "dm-lena", "u-lena", "Got them, thank you. Looks right to me.", 236),

  /* -- group DM -- */
  m("m-50", "gdm-launch", "u-maya", "Launch post is scheduled for Tuesday 09:00. Last chance to change the headline is Monday afternoon.", 55),

  /* -- random -- */
  m("m-60", "c-random", "u-felix", "Someone has left a very good cardamom bun in the kitchen and I need to know whose it is before I make a decision.", 210, { reactions: [{ emoji: "😂", userIds: ["u-lena", "u-tomas", "u-priya", "u-ines"] }] }),
  m("m-61", "c-random", "u-priya", "It is mine and it is spoken for.", 205),
];

/** Thread replies, keyed to their parent message. */
export const threadReplies: Record<string, Message[]> = {
  "m-ctx-task-t-4471": [
    m("m-ctx-r1", "c-clients", "u-marc", "The July rate is the one. I will sign once Lena has it in the document.", 112, { threadId: "m-ctx-task-t-4471" }),
    m("m-ctx-r2", "c-clients", ME, "Updated the figures. Ready for you whenever.", 104, { threadId: "m-ctx-task-t-4471" }),
  ],
  "m-11": [
    m("m-11-r1", "c-design", "u-ines", "Fair. I could drop the due date to the same weight as the reference line.", 89, { threadId: "m-11" }),
    m("m-11-r2", "c-design", ME, "Or keep the weight and move it under the amount. It only competes because they are side by side.", 86, { threadId: "m-11" }),
    m("m-11-r3", "c-design", "u-nadia", "That reads better to me. Try it and we look at it in critique.", 84, { threadId: "m-11" }),
  ],
};

/* ---------------------------------------------------------------- meetings */

export const meetings: Meeting[] = [
  {
    id: "mt-1",
    title: "Baumgartner AG - invoice review",
    startsAt: at(12),
    endsAt: at(57),
    roomId: "r-a",
    participantIds: [ME, "u-lena", "u-marc"],
    guests: [{ name: "Anna Baumgartner", email: "a.baumgartner@baumgartner.ch", company: "Baumgartner AG", state: "invited" }],
    recordingState: "none",
    contextRef: { type: "client", id: "cl-baum", title: "Baumgartner AG", status: "Active retainer", module: "Sales CRM", state: "live", owner: "u-lena" },
  },
  {
    id: "mt-2",
    title: "Design critique",
    startsAt: at(4 * 60),
    endsAt: at(5 * 60),
    roomId: "r-a",
    participantIds: [ME, "u-ines", "u-nadia", "u-tomas"],
    guests: [],
    recordingState: "none",
  },
  {
    id: "mt-3",
    title: "Weekly engineering sync",
    startsAt: at(6 * 60),
    endsAt: at(6 * 60 + 30),
    roomId: "r-b",
    participantIds: ["u-sara", "u-omar", "u-priya", "u-tomas"],
    guests: [],
    recordingState: "none",
  },
];

/** Meetings already finished, for the "Past" tab. */
export const pastMeetings: Meeting[] = [
  {
    id: "mt-p1",
    title: "Baumgartner AG - scope call",
    startsAt: new Date(DEMO_EPOCH.getTime() - 6 * 864e5).toISOString(),
    endsAt: new Date(DEMO_EPOCH.getTime() - 6 * 864e5 + 55 * 60_000).toISOString(),
    roomId: "r-a",
    participantIds: [ME, "u-lena", "u-marc"],
    guests: [{ name: "Anna Baumgartner", email: "a.baumgartner@baumgartner.ch", company: "Baumgartner AG", state: "admitted" }],
    recordingState: "ready",
    contextRef: { type: "client", id: "cl-baum", title: "Baumgartner AG", status: "Active retainer", module: "Sales CRM", state: "live", owner: "u-lena" },
    notes: "Agreed the retainer renews at the revised rate. Anna sends the signed scope by Friday.",
  },
  {
    id: "mt-p2",
    title: "Q3 planning",
    startsAt: new Date(DEMO_EPOCH.getTime() - 11 * 864e5).toISOString(),
    endsAt: new Date(DEMO_EPOCH.getTime() - 11 * 864e5 + 88 * 60_000).toISOString(),
    roomId: "r-a",
    participantIds: [ME, "u-marc", "u-sara", "u-nadia"],
    guests: [],
    recordingState: "ready",
  },
];

/* ----------------------------------------------------------- notifications */

export const notifications: Notification[] = [
  { id: "n-1", kind: "mention", refId: "c-design", actorId: "u-ines", title: "Inés Caballero mentioned you", body: "can you look at the empty state before I send this on?", read: false, createdAt: iso(38) },
  { id: "n-2", kind: "dm", refId: "dm-sara", actorId: "u-sara", title: "Sara Lindqvist", body: "Do you have ten minutes before the deploy?", read: false, createdAt: iso(33) },
  { id: "n-3", kind: "mention", refId: "c-clients", actorId: "u-marc", title: "Marc Oberholzer mentioned you", body: "are you joining that one? Anna wants to see the invoice work.", read: false, createdAt: iso(71) },
  { id: "n-4", kind: "reminder", refId: "mt-1", title: "Baumgartner AG - invoice review", body: "Starts in 10 minutes in Room A", read: true, createdAt: iso(2) },
];

/* -------------------------------------------------------------- insights --
   Team-level only. Deliberately uneven numbers: real weeks are not tidy. */

const hoursGrid: number[][] = [
  [0, 0, 0, 0, 0, 0, 1, 3, 7, 9, 10, 9, 5, 8, 9, 8, 6, 3, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 4, 8, 11, 11, 10, 4, 9, 10, 9, 7, 4, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 4, 9, 10, 11, 9, 5, 9, 9, 8, 5, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 5, 8, 10, 9, 8, 4, 7, 8, 7, 5, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 3, 6, 8, 8, 6, 3, 5, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

export const insight: Insight = {
  week: "2026-W37",
  presenceHoursByHour: hoursGrid,
  meetingHoursByDay: [6.5, 11.25, 7, 9.75, 3.5, 0, 0],
  roomUsage: [
    { roomId: "r-a", hours: 18.5 },
    { roomId: "r-b", hours: 11.25 },
    { roomId: "r-quiet", hours: 26 },
    { roomId: "r-lounge", hours: 7.75 },
    { roomId: "r-library", hours: 2.5 },
  ],
  cohortSize: 12,
  /* Week 36, so the deltas on the dashboard are against something real. */
  previous: {
    meetingHours: 41.5,
    presentHours: 372,
    roomHours: 71.5,
    busiestHourHeadcount: 9,
  },
  history: [
    { week: "2026-W30", meetingHours: 33.0, presentHours: 340 },
    { week: "2026-W31", meetingHours: 36.5, presentHours: 355 },
    { week: "2026-W32", meetingHours: 44.0, presentHours: 366 },
    { week: "2026-W33", meetingHours: 39.25, presentHours: 351 },
    { week: "2026-W34", meetingHours: 47.5, presentHours: 379 },
    { week: "2026-W35", meetingHours: 45.0, presentHours: 384 },
    { week: "2026-W36", meetingHours: 41.5, presentHours: 372 },
    { week: "2026-W37", meetingHours: 38.0, presentHours: 388 },
  ],
  meetingSizes: [
    { band: "2", count: 14, hours: 8.5 },
    { band: "3-4", count: 11, hours: 14.25 },
    { band: "5-8", count: 6, hours: 11.75 },
    { band: "9+", count: 2, hours: 3.5 },
  ],
  /* Five rooms, ten working hours a day, five days. */
  roomCapacityHours: 250,
};

export const myTime: MyTime = {
  week: "2026-W37",
  presenceHoursByDay: [7.25, 8, 6.5, 7.75, 4.25, 0, 0],
  meetingHoursByDay: [1.5, 3.25, 1, 2.5, 0.5, 0, 0],
  focusHoursByDay: [2, 1.5, 3.25, 1.75, 1, 0, 0],
};

/* --------------------------------------------------------------- settings */

export const settings: WorkspaceSettings = {
  name: "Somion",
  template: "team",
  guestsAllowed: true,
  retentionDays: null,
  recordingAllowed: true,
  soundsEnabled: true,
  notifyOn: "mentions_dms",
  quietHours: { from: "19:00", to: "08:00" },
  autoAwayMinutes: 10,
  inactivitySignOutMinutes: 30,
  activation: { state: "trial", tier: "business", userCap: 30, trialEndsAt: new Date(DEMO_EPOCH.getTime() + 14 * 864e5).toISOString() },
  integrations: { google: "off", microsoft: "error", account: "info@somion.org" },
  focusDefaultMinutes: 25,
  earshot: "normal",
  daylight: true,
  idleMotion: true,
  roomHoverCards: true,
  defaultView: "floor",
  channelNotifyDefault: "mentions",
  editWindowMinutes: null,
  meetingDefaultMinutes: 30,
  lobby: "manual",
  canCreateChannels: "everyone",
  canInviteGuests: "everyone",
  canRecord: "everyone",
  language: "en",
  minCohort: 5,
};

/* ------------------------------------------------------- suite navigation
   The other six modules, so HQ reads as the seventh rather than as a
   standalone product. Only Tasks is navigable in the demo. */

export const suiteModules = [
  { id: "tasks", name: "Task Manager", href: "/tasks/t-4471", enabled: true },
  { id: "crm", name: "Sales CRM", href: "#", enabled: false },
  { id: "invoicing", name: "Invoicing", href: "#", enabled: false },
  { id: "hr", name: "HR", href: "#", enabled: false },
  { id: "files", name: "File Manager", href: "#", enabled: false },
  { id: "marketing", name: "Marketing Hub", href: "#", enabled: false },
  { id: "hq", name: "HQ", href: "/hq/office", enabled: true },
] as const;
