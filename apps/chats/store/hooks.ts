"use client";

/**
 * SOMION HQ - SELECTOR HOOKS
 *
 * Components never touch the store shape directly; they call these. That is
 * what lets the data source change underneath without touching the UI.
 *
 * These are deliberately granular. `usePresenceOf(userId)` exists so that a
 * moving avatar re-renders itself and nothing else - the floor canvas is never
 * re-rendered as a whole while twelve people are walking around.
 */

import { useMemo } from "react";
import { useWorkspace } from "./index";
import { capabilitiesFor, type Capabilities } from "@/lib/roles";
import type { Channel, FileRef, Id, Message, Presence, Room, Status, User } from "@/entities";
import { aggregate, type Aggregate, type DateRange } from "@/lib/analytics";
import { FACTS_FROM, FACTS_TO, getFacts } from "@/mock/analytics";

/* ----------------------------------------------------------------- people */

export const useMe = (): User => {
  const me = useWorkspace((s) => s.me);
  const users = useWorkspace((s) => s.users);
  const found = users.find((u) => u.id === me);
  if (!found) throw new Error("Signed-in user missing from the directory");
  return found;
};

export const useUsers = (): User[] => useWorkspace((s) => s.users);

export const useUser = (id: Id): User | undefined =>
  useWorkspace((s) => s.users.find((u) => u.id === id));

/** One person's presence. Subscribing per-avatar keeps the floor cheap. */
export const usePresenceOf = (userId: Id): Presence | undefined =>
  useWorkspace((s) => s.presence.find((p) => p.userId === userId));

export const useMyStatus = (): Status =>
  useWorkspace((s) => s.presence.find((p) => p.userId === s.me)?.status ?? "offline");

export const useMyPresence = (): Presence | undefined =>
  useWorkspace((s) => s.presence.find((p) => p.userId === s.me));

/** Ordered so the floor and the list agree: present people first. */
const STATUS_ORDER: Record<Status, number> = {
  available: 0,
  in_meeting: 1,
  busy: 2,
  focus: 3,
  away: 4,
  offline: 5,
};

export const usePresenceList = () => {
  const presence = useWorkspace((s) => s.presence);
  const users = useWorkspace((s) => s.users);
  return useMemo(
    () =>
      presence
        .map((p) => ({ presence: p, user: users.find((u) => u.id === p.userId) }))
        .filter((row): row is { presence: Presence; user: User } => Boolean(row.user))
        .sort(
          (a, b) =>
            STATUS_ORDER[a.presence.status] - STATUS_ORDER[b.presence.status] ||
            a.user.name.localeCompare(b.user.name),
        ),
    [presence, users],
  );
};

export const useOnlineCount = (): number =>
  useWorkspace((s) => s.presence.filter((p) => p.status !== "offline").length);

/* ------------------------------------------------------------------ floor */

export const useFloor = () => useWorkspace((s) => s.floor);

export const useRoom = (id: Id): Room | undefined =>
  useWorkspace((s) => s.floor.rooms.find((r) => r.id === id));

/** Everyone currently inside a given room. */
export const useRoomOccupants = (roomId: Id) => {
  const presence = useWorkspace((s) => s.presence);
  const users = useWorkspace((s) => s.users);
  return useMemo(
    () =>
      presence
        .filter((p) => p.roomId === roomId)
        .map((p) => ({ presence: p, user: users.find((u) => u.id === p.userId) }))
        .filter((row): row is { presence: Presence; user: User } => Boolean(row.user)),
    [presence, users, roomId],
  );
};

/* ------------------------------------------------------------------- chat */

/* These derive lists, so they must NOT filter inside the selector: a selector
   that builds a new array every call gives useSyncExternalStore a different
   snapshot each render and loops. Select the stable slice, derive in useMemo. */

export const useChannels = (): Channel[] => {
  const channels = useWorkspace((s) => s.channels);
  return useMemo(
    () => channels.filter((c) => !c.archived && c.kind !== "dm" && c.kind !== "group"),
    [channels],
  );
};

export const useDirectMessages = (): Channel[] => {
  const channels = useWorkspace((s) => s.channels);
  return useMemo(
    () => channels.filter((c) => c.kind === "dm" || c.kind === "group"),
    [channels],
  );
};

export const useArchivedChannels = (): Channel[] => {
  const channels = useWorkspace((s) => s.channels);
  return useMemo(() => channels.filter((c) => c.archived), [channels]);
};

export const useChannel = (id: Id): Channel | undefined =>
  useWorkspace((s) => s.channels.find((c) => c.id === id));

export const useMessages = (channelId: Id): Message[] => {
  const messages = useWorkspace((s) => s.messages);
  return useMemo(
    () =>
      messages
        .filter((m) => m.channelId === channelId && !m.threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, channelId],
  );
};

export const useMessage = (id: Id | null): Message | undefined =>
  useWorkspace((s) => (id ? s.messages.find((m) => m.id === id) : undefined));

/* A shared frozen empty array: `?? []` inside a selector mints a new reference
   on every call, which is the same snapshot-instability bug as filtering. */
const NO_MESSAGES: Message[] = [];

export const useThreadReplies = (parentId: Id | null): Message[] =>
  useWorkspace((s) => (parentId ? (s.threadReplies[parentId] ?? NO_MESSAGES) : NO_MESSAGES));

export const usePinned = (channelId: Id): Message[] => {
  const messages = useWorkspace((s) => s.messages);
  return useMemo(
    () => messages.filter((m) => m.channelId === channelId && m.pinned),
    [messages, channelId],
  );
};

export const useUnreadTotal = (): { unread: number; mentions: number } => {
  const channels = useWorkspace((s) => s.channels);
  return useMemo(
    () => ({
      unread: channels.reduce((n, c) => n + (c.notify === "none" ? 0 : c.unread), 0),
      mentions: channels.reduce((n, c) => n + c.mentions, 0),
    }),
    [channels],
  );
};

/** The Catch up view: mentions, DMs and followed threads in one place. */
export const useCatchUp = () => {
  const channels = useWorkspace((s) => s.channels);
  const messages = useWorkspace((s) => s.messages);
  const users = useWorkspace((s) => s.users);
  const me = useWorkspace((s) => s.me);
  const myName = users.find((u) => u.id === me)?.name ?? "";

  return useMemo(() => {
    const mentions = messages.filter(
      (m) => myName && m.text.includes(myName) && m.authorId !== me && !m.deletedAt,
    );
    const dms = channels.filter((c) => (c.kind === "dm" || c.kind === "group") && c.unread > 0);
    const threads = messages.filter((m) => m.replyCount > 0 && m.replyUserIds.includes(me));
    return { mentions, dms, threads };
  }, [channels, messages, me, myName]);
};

/**
 * The number that belongs on the Chat badge. Quiet by default is a promise
 * about what interrupts you, so the badge counts what actually needs you -
 * the same things Catch up lists - rather than every unread message.
 */
export const useNeedsYou = (): number => {
  const { mentions, dms, threads } = useCatchUp();
  return mentions.length + dms.length + threads.length;
};

/* ------------------------------------------------------------------ roles */

/** What the current viewer may do. One source, so no screen invents its own. */
export const useCan = (): Capabilities => {
  const role = useWorkspace((s) => s.viewingRole);
  const canCreateChannels = useWorkspace((s) => s.settings.canCreateChannels);
  const canInviteGuests = useWorkspace((s) => s.settings.canInviteGuests);
  const canRecord = useWorkspace((s) => s.settings.canRecord);
  return useMemo(
    () => capabilitiesFor(role, { canCreateChannels, canInviteGuests, canRecord }),
    [role, canCreateChannels, canInviteGuests, canRecord],
  );
};

/* ----------------------------------------------------------------- search */

export interface SearchResults {
  messages: Message[];
  files: { file: FileRef; message: Message }[];
  people: User[];
  channels: Channel[];
  total: number;
}

/**
 * One search, used by both the live dropdown in the top bar and the full
 * results page. Sharing it is what stops the two from disagreeing about what
 * matches - the classic way a product ends up with a preview that promises a
 * result the results page does not contain.
 */
export const useSearchResults = (query: string): SearchResults => {
  const messages = useWorkspace((s) => s.messages);
  const users = useWorkspace((s) => s.users);
  const channels = useWorkspace((s) => s.channels);
  const q = query.trim().toLowerCase();

  return useMemo(() => {
    if (!q) return { messages: [], files: [], people: [], channels: [], total: 0 };
    /* Messages and files only from conversations the person can open: public channels, and
       private ones and DMs they are in (CHT-008). */
    const me = useWorkspace.getState().me;
    const open = new Set(channels.filter((c) => c.kind === "public" || c.memberIds.includes(me)).map((c) => c.id));
    const visible = messages.filter((m) => open.has(m.channelId));
    const found = {
      messages: visible.filter((m) => !m.deletedAt && m.text.toLowerCase().includes(q)).slice(0, 25),
      files: visible
        .flatMap((m) => m.attachments.map((f) => ({ file: f, message: m })))
        .filter(({ file }) => file.name.toLowerCase().includes(q)),
      people: users.filter(
        (u) => u.name.toLowerCase().includes(q) || u.title.toLowerCase().includes(q),
      ),
      /* Private channels the person is not in must never surface, in the
         preview or the page. Search is the classic place that leaks. */
      channels: channels.filter(
        (c) =>
          c.kind !== "dm" &&
          c.kind !== "group" &&
          c.name.toLowerCase().includes(q) &&
          (c.kind === "public" || c.memberIds.includes(useWorkspace.getState().me)),
      ),
    };
    return {
      ...found,
      total: found.messages.length + found.files.length + found.people.length + found.channels.length,
    };
  }, [q, messages, users, channels]);
};

/* --------------------------------------------------------------- meetings */

export const useMeetings = () => useWorkspace((s) => s.meetings);
export const usePastMeetings = () => useWorkspace((s) => s.pastMeetings);
export const useMeeting = (id: Id) =>
  useWorkspace((s) => s.meetings.find((m) => m.id === id) ?? s.pastMeetings.find((m) => m.id === id));

/** Any guest waiting in a lobby right now, across all meetings. */
export const useWaitingGuests = () => {
  const meetings = useWorkspace((s) => s.meetings);
  return useMemo(
    () =>
      meetings.flatMap((m) =>
        m.guests.filter((g) => g.state === "lobby").map((g) => ({ meeting: m, guest: g })),
      ),
    [meetings],
  );
};

/* ---------------------------------------------------------- notifications */

export const useNotifications = () => useWorkspace((s) => s.notifications);
export const useUnreadNotifications = (): number =>
  useWorkspace((s) => s.notifications.filter((n) => !n.read).length);

/* --------------------------------------------------------------- insights */

export const useInsight = () => useWorkspace((s) => s.insight);
export const useMyTime = () => useWorkspace((s) => s.myTime);
export const useSettings = () => useWorkspace((s) => s.settings);

/* ---------------------------------------------------------------- insights */

/** The span the fact table covers. The picker cannot reach outside it. */
export const ANALYTICS_BOUNDS = { from: FACTS_FROM, to: FACTS_TO };

/**
 * Team numbers for a period and a cohort. Today this sums a local fact
 * table; in production it is one request for the same shape. Components
 * never see a fact row either way.
 */
export function useAnalytics(range: DateRange, cohort: Id[]): Aggregate {
  const rooms = useWorkspace((s) => s.floor.rooms);
  const key = cohort.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const { dayFacts, meetingFacts } = getFacts();
    return aggregate(dayFacts, meetingFacts, range, cohort, rooms);
  }, [range.from, range.to, key, rooms]);
}
