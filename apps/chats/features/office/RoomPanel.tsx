"use client";

/**
 * SOMION HQ - ROOM PANEL
 *
 * The room you are in, as a panel: who is here and how loud each of them
 * is to you, the room's own chat, and the controls the room offers - lock
 * for an admin, leave for everyone. The floor shows the room from outside;
 * this is the inside.
 *
 * The room chat is an ordinary channel created on first use, so a note
 * left in Room B is still there tomorrow and still searchable, exactly like
 * a meeting's chat.
 */

import { useEffect, useRef } from "react";
import { LockSimple, LockSimpleOpen, SignOut, SpeakerSlash, SpeakerHigh, X } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip } from "@/components/ui/Primitives";
import { Composer } from "@/features/chat/Composer";
import { Message } from "@/features/chat/Message";
import { useCan, useMessages, useRoom, useRoomOccupants } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useBackToClose, useEscape } from "@/lib/useDismiss";
import { useT } from "@/lib/i18n";
import { STATUS_META } from "@/lib/presence";

export function RoomPanel({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const room = useRoom(roomId);
  const occupants = useRoomOccupants(roomId);
  const me = useWorkspace((s) => s.me);
  const localMutes = useWorkspace((s) => s.localMutes);
  const localVolumes = useWorkspace((s) => s.localVolumes);
  const toggleLocalMute = useWorkspace((s) => s.toggleLocalMute);
  const setLocalVolume = useWorkspace((s) => s.setLocalVolume);
  const updateRoom = useWorkspace((s) => s.updateRoom);
  const leaveRoom = useWorkspace((s) => s.leaveRoom);
  const ensureRoomChannel = useWorkspace((s) => s.ensureRoomChannel);
  const sendMessage = useWorkspace((s) => s.sendMessage);
  const can = useCan();
  const t = useT();
  useBackToClose(true, onClose);
  useEscape(true, onClose);

  /* The room's channel is created on first open, after render, never during it. */
  const channelId = room?.channelId ?? "";
  useEffect(() => {
    if (room && !room.channelId) ensureRoomChannel(roomId);
  }, [room, roomId, ensureRoomChannel]);
  const messages = useMessages(channelId);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!room) return null;

  return (
    <aside
      role="dialog"
      aria-label={t("room.panel", "{name}: inside the room", { name: room.name })}
      className={"hq-floating hq-rise fixed inset-y-0 end-0 z-[45] flex w-full max-w-[360px] flex-col "+("ch-background-var---color-surface"+' '+"ch-border-inline-start-1px-solid-var---color-hairline")}

    >
      <header className={"flex shrink-0 items-center justify-between gap-2 px-4 py-3 "+("ch-border-bottom-1px-solid-var---color-hairline")} >
        <div className="min-w-0">
          <h2 className={"flex items-center gap-1.5 text-body-sm font-semibold "+("ch-color-var---color-ink")} >
            <bdi>{room.name}</bdi>
            {room.locked && <LockSimple size={12} weight="bold" aria-hidden="true" className={"ch-color-var---color-ink-subtle"}  />}
          </h2>
          <p className={"truncate text-caption "+("ch-color-var---color-ink-subtle")} >
            {t("room.inside", "{n} of {cap} inside", { n: occupants.length, cap: room.capacity })}
            {room.purpose ? ` · ${room.purpose}` : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" iconOnly label={t("common.close", "Close")} onClick={onClose}>
          <X size={14} weight="bold" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <section className="px-3 pt-3">
          <h3 className={"px-1 pb-1 text-caption font-semibold uppercase "+("ch-color-var---color-ink-subtle"+' '+"ch-letter-spacing-0-04em")} >
            {t("room.members", "In the room")}
          </h3>
          <ul className="flex flex-col">
            {occupants.map(({ user, presence }) => {
              const isMe = user.id === me;
              const mutedForMe = localMutes.includes(user.id);
              const volume = localVolumes[user.id] ?? 1;
              return (
                <li key={user.id} className="flex items-center gap-2.5 px-1 py-1.5">
                  <Avatar name={user.name} initials={user.initials} tint={user.tint} size={28} speaking={presence.speaking} hideStatus />
                  <span className="min-w-0 flex-1">
                    <span className={"block truncate text-body-sm font-medium "+("ch-color-var---color-ink")} >
                      <bdi>{user.name}</bdi>
                      {isMe && <span className={"ch-color-var---color-ink-subtle"} > · {t("office.you", "you")}</span>}
                    </span>
                    <span className={"block truncate text-caption "+("ch-color-var---color-ink-muted")} >
                      {presence.speaking ? t("room.speaking", "Speaking") : STATUS_META[presence.status].label}
                      {presence.muted ? ` · ${t("call.mutedByHost", "muted")}` : ""}
                    </span>
                  </span>
                  {!isMe && (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={150}
                        value={mutedForMe ? 0 : Math.round(volume * 100)}
                        onChange={(e) => setLocalVolume(user.id, Number(e.target.value) / 100)}
                        aria-label={t("office.volumeOf", "Volume of {name}", { name: user.name })}
                        disabled={mutedForMe}
                        className={"ch-width-64px"+' '+"ch-accent-color-var---color-accent"}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        label={mutedForMe ? t("office.hearAgain", "Hear {name} again", { name: user.name }) : t("office.muteForMe", "Mute for me")}
                        aria-pressed={mutedForMe}
                        onClick={() => toggleLocalMute(user.id)}
                        className={(mutedForMe?"ch-color-var---color-danger-600":"ch-color-var---color-ink-subtle")}
                      >
                        {mutedForMe ? <SpeakerSlash size={14} weight="fill" aria-hidden="true" /> : <SpeakerHigh size={14} aria-hidden="true" />}
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-3 flex min-h-0 flex-1 flex-col px-3">
          <h3 className={"px-1 pb-1 text-caption font-semibold uppercase "+("ch-color-var---color-ink-subtle"+' '+"ch-letter-spacing-0-04em")} >
            {t("room.chat", "Room chat")}
          </h3>
          <div className={"min-h-[120px] flex-1 overflow-y-auto "+("ch-background-var---color-surface-sunken"+' '+"ch-border-radius-var---radius-control")} >
            {messages.length === 0 ? (
              <p className={"px-3 py-3 text-body-sm leading-relaxed "+("ch-color-var---color-ink-muted")} >
                {t("room.chatEmpty", "Notes left here stay with the room, and are still here tomorrow.")}
              </p>
            ) : (
              <div className="py-1">
                {messages.map((m, i) => (
                  <Message key={m.id} message={m} grouped={i > 0 && messages[i - 1]?.authorId === m.authorId} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="shrink-0">
        <Composer channelId={channelId} placeholder={t("room.chatPlaceholder", "Message {name}", { name: room.name })} draftKey={`room:${roomId}`} onSend={(text, attachments) => sendMessage(channelId, text, undefined, attachments)} />
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          {can.manageFloor ? (
            <Button size="sm" onClick={() => updateRoom(roomId, { locked: !room.locked })} aria-pressed={room.locked}>
              {room.locked ? <LockSimpleOpen size={13} weight="bold" aria-hidden="true" /> : <LockSimple size={13} weight="bold" aria-hidden="true" />}
              {room.locked ? t("room.unlock", "Unlock the room") : t("room.lock", "Lock the room")}
            </Button>
          ) : (
            <Chip>{room.locked ? t("room.lockedChip", "Locked") : t("room.openChip", "Open")}</Chip>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              leaveRoom();
              onClose();
            }}
          >
            <SignOut size={13} weight="bold" aria-hidden="true" />
            {t("call.leave", "Leave")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
