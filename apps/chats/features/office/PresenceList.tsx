"use client";

/**
 * SOMION HQ - WHO IS AROUND
 *
 * Presence without the map. This is the mobile substitute for the floor, and
 * on desktop it is the answer to the category's biggest known failure: the map
 * stops being used once the novelty wears off, so everything the map does must
 * also work as a list.
 *
 * Every row offers exactly one direct action, chosen by the person's status.
 */

import { useRouter } from "next/navigation";
import { ChatCircle, HandWaving, SignIn } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useFloor, useMe, usePresenceList } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { STATUS_META, roomOpensAudio } from "@/lib/presence";
import { useT } from "@/lib/i18n";
import { playSound } from "@/lib/audio";
import type { Presence, Status, User } from "@/entities";

export function PresenceList({ compact = false }: { compact?: boolean }) {
  const people = usePresenceList();
  const me = useMe();
  const t = useT();

  /* Grouped the way the floor looks: each room by name, the desk area as
     the open floor, and the offline last. A desk is not a room. */
  const floor = useFloor();
  const online = people.filter((p) => p.presence.status !== "offline");
  const byRoom = floor.rooms
    .filter((r) => r.kind !== "desk")
    .map((r) => ({ room: r, people: online.filter((p) => p.presence.roomId === r.id) }))
    .filter((g) => g.people.length > 0);
  const deskIds = new Set(floor.rooms.filter((r) => r.kind === "desk").map((r) => r.id));
  const onFloor = online.filter((p) => !p.presence.roomId || deskIds.has(p.presence.roomId));
  const offline = people.filter((p) => p.presence.status === "offline");

  return (
    <div className="flex flex-col">
      {onFloor.length > 0 && (
        <Group label={t("office.atDesks", "At their desks")}>
          {onFloor.map(({ user, presence }) => (
            <PersonRow key={user.id} user={user} presence={presence} isMe={user.id === me.id} compact={compact} />
          ))}
        </Group>
      )}
      {byRoom.map(({ room, people: inside }) => (
        <Group key={room.id} label={room.name}>
          {inside.map(({ user, presence }) => (
            <PersonRow key={user.id} user={user} presence={presence} isMe={user.id === me.id} compact={compact} />
          ))}
        </Group>
      ))}
      {offline.length > 0 && (
        <Group label={t("office.offline", "Offline")}>
          {offline.map(({ user, presence }) => (
            <PersonRow key={user.id} user={user} presence={presence} isMe={user.id === me.id} compact={compact} />
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="pb-1">
      <h3
        className={"px-3 pb-1 pt-3 text-caption font-semibold "+("ch-color-var---color-ink-subtle")}

      >
        <bdi>{label}</bdi>
      </h3>
      <ul>{children}</ul>
    </section>
  );
}

function PersonRow({
  user,
  presence,
  isMe,
  compact,
}: {
  user: User;
  presence: Presence;
  isMe: boolean;
  compact: boolean;
}) {
  const router = useRouter();
  const floor = useFloor();
  const sendKnock = useWorkspace((s) => s.sendKnock);
  const joinRoom = useWorkspace((s) => s.joinRoom);
  const knock = useWorkspace((s) => s.knock);
  const meId = useWorkspace((s) => s.me);
  const notify = useWorkspace((s) => s.notify);
  const t = useT();

  /* The floor shows a knock as a pulse on the tile; the list has no tile, so
     the row itself carries the state until the person answers. */
  const knocking = knock?.state === "pending" && knock.fromId === meId && knock.toId === user.id;

  const meta = STATUS_META[presence.status];
  const room = floor.rooms.find((r) => r.id === presence.roomId);
  const openOrCreateDm = useWorkspace((s) => s.openOrCreateDm);

  const action = resolveAction(presence.status, Boolean(room && roomOpensAudio(room)));

  const run = () => {
    if (action === "join" && presence.roomId) {
      joinRoom(presence.roomId);
      playSound("join");
    } else if (action === "knock") {
      sendKnock(user.id);
      playSound("knock");
      notify(
        t("office.knockingTitle", "Knocking on {name}", { name: user.name }),
        t("office.knockingBody", "You will hear when they answer. During Focus a knock is held and delivered later."),
      );
    } else {
      /* A person you have never messaged is not a dead end: the conversation
         is created on the way there. */
      router.push(`/hq/chat/${openOrCreateDm(user.id)}`);
    }
  };

  const ACTION_LABEL: Record<typeof action, string> = {
    join: t("office.join", "Join"),
    knock: t("office.knock", "Knock"),
    message: t("office.message", "Message"),
  };
  const ACTION_ICON = { join: SignIn, knock: HandWaving, message: ChatCircle }[action];

  return (
    <li>
      <div
        className={"hq-row flex items-center gap-2.5 px-3 "+((compact?"ch-min-height-44px":"ch-min-height-52px"))}

      >
        <Avatar
          name={user.name}
          initials={user.initials}
          tint={user.tint}
          status={presence.status}
          size={compact ? 28 : 40}
          speaking={presence.speaking}
        />
        <div className="min-w-0 flex-1">
          <p className={"truncate text-body-sm font-medium "+("ch-color-var---color-ink")} >
            <bdi>{user.name}</bdi>
            {isMe && (
              <span className={"ms-1.5 text-caption font-normal "+("ch-color-var---color-ink-subtle")} >
                {t("office.you", "you")}
              </span>
            )}
          </p>
          {/* Status in words, always. The colour is a second signal, never the
              only one. */}
          <p className={"truncate text-caption "+("ch-color-var---color-ink-muted")} >
            {presence.customText ? <bdi>{presence.customText}</bdi> : t(`status.${presence.status}`, meta.label)}
            {room && (
              <>
                {" · "}
                <bdi>{room.name}</bdi>
              </>
            )}
          </p>
        </div>
        {!isMe && (
          <Button size="sm" onClick={run} className="shrink-0" disabled={knocking} aria-live="polite">
            <ACTION_ICON size={13} weight="bold" aria-hidden="true" />
            {knocking ? t("office.knocking", "Knocking…") : ACTION_LABEL[action]}
          </Button>
        )}
      </div>
    </li>
  );
}

/** One action per state, decided here so every surface agrees. */
function resolveAction(status: Status, inConversationRoom: boolean): "join" | "knock" | "message" {
  if (inConversationRoom && status !== "focus") return "join";
  if (status === "available") return "knock";
  return "message";
}
