"use client";

/**
 * SOMION HQ - SIDEBAR
 *
 * Module navigation, then whatever the current area needs below it. In Chat
 * that is the channel and DM list; in Office it is the rooms. The sidebar is
 * contextual rather than a fixed tree, so the second pane is never wasted on
 * navigation the current task does not use.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellSlash, Gear, Hash, Lock, Plus, UsersThree } from "@phosphor-icons/react";
import { ModuleNav } from "./ModuleNav";
import { CreateChannelModal, NewMessageModal } from "@/features/chat/ChannelDialogs";
import { AddRoomModal, RoomSettingsModal } from "@/features/office/OfficeDialogs";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Count } from "@/components/ui/Primitives";
import {
  useChannels,
  useCan,
  useDirectMessages,
  useFloor,
  usePresenceOf,
  useRoomOccupants,
  useUser,
} from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { ROOM_LABEL } from "@/lib/presence";
import type { Channel } from "@/entities";

export function HqSidebar() {
  const pathname = usePathname();
  const t = useT();
  const inChat = pathname.startsWith("/hq/chat");
  const inOffice = pathname.startsWith("/hq/office");

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-3">
      <ModuleNav />
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {inChat && <ChatSidebar />}
        {inOffice && <OfficeSidebar />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- chat */

function ChatSidebar() {
  const channels = useChannels();
  const dms = useDirectMessages();
  const [creating, setCreating] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const can = useCan();
  const archived = useWorkspace((s) => s.channels).filter(
    (c) => c.archived && c.kind !== "dm" && c.kind !== "group",
  );
  const t = useT();

  return (
    <div className="px-2">
      <CreateChannelModal open={creating} onClose={() => setCreating(false)} />
      <NewMessageModal open={messaging} onClose={() => setMessaging(false)} />
      <SidebarHeading
        label={t("chat.channels", "Channels")}
        action={
          can.manageChannels ? (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("chat.newChannel", "New channel")}
              onClick={() => setCreating(true)}
              style={{ color: "var(--color-ink-subtle)" }}
            >
              <Plus size={13} weight="bold" aria-hidden="true" />
            </Button>
          ) : undefined
        }
      />
      <ul className="flex flex-col gap-0.5">
        {channels.map((c) => (
          <ChannelRow key={c.id} channel={c} />
        ))}
      </ul>

      {/* Archived channels stay findable by the people who can bring them
          back; for everyone else they are simply gone from the list. */}
      {can.archiveChannels && archived.length > 0 && (
        <>
          <SidebarHeading label={t("chat.archivedGroup", "Archived")} />
          <ul className="flex flex-col gap-0.5">
            {archived.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/hq/chat/${c.id}`}
                  className="hq-row flex items-center gap-2 px-2.5 py-1.5 text-[13px]"
                  style={{ borderRadius: "var(--radius-control)", color: "var(--color-ink-subtle)" }}
                >
                  <Hash size={13} aria-hidden="true" />
                  <span className="truncate line-through"><bdi>{c.name}</bdi></span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <SidebarHeading
        label={t("chat.direct", "Direct messages")}
        action={
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            label={t("chat.newMessage", "New message")}
            onClick={() => setMessaging(true)}
            style={{ color: "var(--color-ink-subtle)" }}
          >
            <Plus size={13} weight="bold" aria-hidden="true" />
          </Button>
        }
      />
      <ul className="flex flex-col gap-0.5">
        {dms.map((c) => (
          <DirectRow key={c.id} channel={c} />
        ))}
      </ul>
    </div>
  );
}

function SidebarHeading({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-1 pt-3 ps-2.5 pe-1">
      <span className="text-[11.5px] font-semibold" style={{ color: "var(--color-ink-subtle)" }}>
        {label}
      </span>
      {action}
    </div>
  );
}

function ChannelRow({ channel }: { channel: Channel }) {
  const pathname = usePathname();
  const t = useT();
  const active = pathname === `/hq/chat/${channel.id}`;
  const Icon = channel.kind === "private" ? Lock : Hash;
  /* "mentions" is the default and reads as normal; only a channel set to
     nothing is visibly quietened, because that is the one you chose to
     silence and might otherwise forget you had. */
  const silenced = channel.notify === "none";

  return (
    <li>
      <Link
        href={`/hq/chat/${channel.id}`}
        aria-current={active ? "page" : undefined}
        className="hq-row flex items-center gap-2 px-2.5"
        style={{
          borderRadius: "var(--radius-control)",
          minHeight: 30,
          fontSize: "13px",
          color: active ? "var(--color-ink-brand)" : silenced ? "var(--color-ink-subtle)" : channel.unread ? "var(--color-ink)" : "var(--color-ink-muted)",
          background: active ? "var(--color-accent-soft)" : "transparent",
          fontWeight: channel.unread && !silenced ? 600 : 400,
        }}
      >
        <Icon size={13} weight="bold" aria-hidden="true" style={{ color: "var(--color-ink-subtle)", flexShrink: 0 }} />
        <span className="min-w-0 flex-1 truncate"><bdi>{channel.name}</bdi></span>
        {silenced ? (
          <BellSlash
            size={12}
            aria-label={t("chat.silenced", "Notifications off")}
            style={{ color: "var(--color-ink-subtle)", flexShrink: 0 }}
          />
        ) : (
          <Count value={channel.unread} mention={channel.mentions > 0} />
        )}
      </Link>
    </li>
  );
}

function DirectRow({ channel }: { channel: Channel }) {
  const pathname = usePathname();
  const active = pathname === `/hq/chat/${channel.id}`;
  const isGroup = channel.kind === "group";
  /* A DM's other participant drives the avatar and, importantly, the presence
     dot - so the sidebar already answers "can I reach them right now". */
  const meId = useWorkspace((s) => s.me);
  const otherId = channel.memberIds.find((m) => m !== meId) ?? "";
  const other = useUser(otherId);
  const presence = usePresenceOf(otherId);

  return (
    <li>
      <Link
        href={`/hq/chat/${channel.id}`}
        aria-current={active ? "page" : undefined}
        className="hq-row flex items-center gap-2 px-2.5"
        style={{
          borderRadius: "var(--radius-control)",
          minHeight: 32,
          fontSize: "13px",
          color: active ? "var(--color-ink-brand)" : channel.unread ? "var(--color-ink)" : "var(--color-ink-muted)",
          background: active ? "var(--color-accent-soft)" : "transparent",
          fontWeight: channel.unread ? 600 : 400,
        }}
      >
        {isGroup || !other ? (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center"
            style={{ width: 20, height: 20, borderRadius: "var(--radius-chip)", background: "var(--color-surface-sunken)", color: "var(--color-ink-subtle)" }}
          >
            <UsersThree size={11} weight="bold" />
          </span>
        ) : (
          <Avatar
            name={other.name}
            initials={other.initials}
            tint={other.tint}
            status={presence?.status}
            size={20}
          />
        )}
        <span className="min-w-0 flex-1 truncate"><bdi>{channel.name}</bdi></span>
        <Count value={channel.unread} mention={channel.mentions > 0} />
      </Link>
    </li>
  );
}

/* ----------------------------------------------------------------- office */

function OfficeSidebar() {
  const floor = useFloor();
  const can = useCan();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const t = useT();

  return (
    <div className="px-2">
      {editing && (
        <RoomSettingsModal roomId={editing} open onClose={() => setEditing(null)} />
      )}
      <AddRoomModal open={adding} onClose={() => setAdding(false)} />
      <SidebarHeading
        label={t("office.rooms", "Rooms")}
        action={
          can.manageFloor ? (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("room.addTitle", "Add a room")}
              onClick={() => setAdding(true)}
              style={{ color: "var(--color-ink-subtle)" }}
            >
              <Plus size={13} weight="bold" aria-hidden="true" />
            </Button>
          ) : undefined
        }
      />
      <ul className="flex flex-col gap-0.5">
        {floor.rooms.map((room) => (
          <RoomRow
            key={room.id}
            roomId={room.id}
            name={room.name}
            kind={room.kind}
            capacity={room.capacity}
            {...(can.manageFloor ? { onEdit: () => setEditing(room.id) } : {})}
          />
        ))}
      </ul>
    </div>
  );
}

function RoomRow({
  roomId,
  name,
  kind,
  capacity,
  onEdit,
}: {
  roomId: string;
  name: string;
  kind: string;
  capacity: number;
  onEdit?: () => void;
}) {
  const occupants = useRoomOccupants(roomId);
  const myRoomId = useWorkspace((s) => s.presence.find((p) => p.userId === s.me)?.roomId);
  const joinRoom = useWorkspace((s) => s.joinRoom);
  const t = useT();
  const here = myRoomId === roomId;

  return (
    <li className="group/room relative">
      <button
        type="button"
        onClick={() => joinRoom(roomId)}
        data-active={here ? "true" : undefined}
        className="hq-row flex w-full items-center gap-2 px-2.5 text-start"
        style={{ borderRadius: "var(--radius-control)", minHeight: 32, fontSize: "13px" }}
      >
        <span className="min-w-0 flex-1 truncate" style={{ color: here ? "var(--color-ink-brand)" : "var(--color-ink)" }}>
          <bdi>{name}</bdi>
        </span>
        {here && (
          <span className="shrink-0 text-[11px] font-medium" style={{ color: "var(--color-ink-brand)" }}>
            {t("office.here", "you")}
          </span>
        )}
        <span className="tabular text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
          {occupants.length > 0
            ? t("office.occupancy", "{n}/{cap}", { n: occupants.length, cap: capacity })
            : t("office.emptyRoom", "empty")}
        </span>
      </button>
      {/* Settings sits on the row rather than behind a separate screen: an
          admin renaming a room is already looking at the list of rooms. A
          member never sees the control at all, rather than seeing it disabled
          and finding out on click. */}
      {onEdit && (
      <span className="absolute end-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/room:opacity-100 focus-within:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          label={t("room.settingsFor", "Settings for {name}", { name })}
          onClick={onEdit}
          style={{ color: "var(--color-ink-subtle)", background: "var(--color-surface)" }}
        >
          <Gear size={13} aria-hidden="true" />
        </Button>
      </span>
      )}
      <span className="sr-only">{t(`roomKind.${kind}`, ROOM_LABEL[kind] ?? kind)}</span>
    </li>
  );
}
