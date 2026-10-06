"use client";

/**
 * SOMION HQ - PERSON MENU
 *
 * Clicking someone gives three actions and nothing else. The product principle
 * is one click to talk, so the primary action is decided by their status rather
 * than left to the visitor to work out: available means knock, in a room means
 * join them, focus means leave a message.
 *
 * This is a popover on the floor, not a modal. Nothing stands between seeing a
 * person and reaching them.
 */

import { useBackToClose } from "@/lib/useDismiss";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatCircle, HandWaving, SignIn, UserCircle, SpeakerHigh, MicrophoneSlash, SpeakerSlash, Microphone, SpeakerSimpleHigh, X } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { usePresenceOf, useRoom, useUser, useCan } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { STATUS_META, roomOpensAudio } from "@/lib/presence";
import { useT } from "@/lib/i18n";
import { playSound } from "@/lib/audio";
import { formatRelative } from "@/lib/time";
import { ProfileModal } from "./OfficeDialogs";

export function PersonMenu({
  userId,
  at,
  bounds,
  onClose,
}: {
  userId: string;
  /** The tile's centre, in pixels within the floor frame. */
  at: { x: number; y: number };
  /** The floor frame, so the menu can be kept inside it. */
  bounds: { w: number; h: number };
  onClose: () => void;
}) {
  const user = useUser(userId);
  const presence = usePresenceOf(userId);
  const room = useRoom(presence?.roomId ?? "");
  const sendKnock = useWorkspace((s) => s.sendKnock);
  const joinRoom = useWorkspace((s) => s.joinRoom);
  const channels = useWorkspace((s) => s.channels);
  const router = useRouter();
  const t = useT();
  const can = useCan();
  /* The menu only exists while open, so its life is the overlay's life. */
  useBackToClose(true, onClose);
  const meId = useWorkspace((s) => s.me);
  const mutedForMe = useWorkspace((s) => s.localMutes.includes(userId));
  const volume = useWorkspace((s) => s.localVolumes[userId] ?? 1);
  const toggleLocalMute = useWorkspace((s) => s.toggleLocalMute);
  const setLocalVolume = useWorkspace((s) => s.setLocalVolume);
  const setServerMute = useWorkspace((s) => s.setServerMute);
  const setServerDeafen = useWorkspace((s) => s.setServerDeafen);

  const [knocking, setKnocking] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reason, setReason] = useState("");

  /* Measured, because the menu's height depends on the person's state - a
     knock form, a focus note - and a fixed guess is exactly how it ended up
     cropped at the bottom of the frame. */
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 0;
    if (h !== height) setHeight(h);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    /* Deferred so the click that opened this does not immediately close it. */
    const id = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  if (!user || !presence) return null;

  const meta = STATUS_META[presence.status];
  const dm = channels.find((c) => c.kind === "dm" && c.memberIds.includes(userId));

  const doKnock = () => {
    sendKnock(userId, reason.trim() || undefined);
    playSound("knock");
    onClose();
  };

  const openDm = () => {
    if (dm) router.push(`/hq/chat/${dm.id}`);
    onClose();
  };

  /* Anchor beside the person, inside the frame. Below the tile if it fits,
     above it if not, and if neither fits the menu scrolls inside itself. */
  const WIDTH = Math.min(252, Math.max(200, bounds.w - 16));
  const GAP = 26;
  const left = Math.min(Math.max(at.x - WIDTH / 2, 8), Math.max(8, bounds.w - WIDTH - 8));
  const fitsBelow = at.y + GAP + height + 8 <= bounds.h;
  const fitsAbove = at.y - GAP - height >= 8;
  const top = fitsBelow
    ? at.y + GAP
    : fitsAbove
      ? at.y - GAP - height
      : Math.max(8, bounds.h - height - 8);
  const maxHeight = Math.max(160, bounds.h - 16);

  if (profileOpen) {
    return (
      <ProfileModal
        userId={userId}
        open
        onClose={() => {
          setProfileOpen(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={t("office.personMenu", "Actions for {name}", { name: user.name })}
      className="hq-floating hq-rise absolute z-[30] p-3"
      style={{
        left,
        top,
        width: WIDTH,
        maxHeight,
        overflowY: "auto",
        borderRadius: "var(--radius-card)",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        label={t("common.close", "Close")}
        onClick={onClose}
        className="absolute end-1.5 top-1.5"
        style={{ color: "var(--color-ink-subtle)" }}
      >
        <X size={13} weight="bold" aria-hidden="true" />
      </Button>
      <div className="flex items-start gap-2.5">
        <Avatar
          name={user.name}
          initials={user.initials}
          tint={user.tint}
          status={presence.status}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold" style={{ color: "var(--color-ink)" }}>
            <bdi>{user.name}</bdi>
          </p>
          <p className="truncate text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
            <bdi>{user.title}</bdi>
          </p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
            {presence.customText ?? meta.label}
            {room && (<>{" · "}<bdi>{room.name}</bdi></>)}
            <span className="tabular"> · {formatRelative(presence.since)}</span>
          </p>
        </div>
      </div>

      {/* Focus is the one state that changes what knocking means, so it says so
          rather than silently behaving differently. */}
      {presence.status === "focus" && (
        <p
          className="mt-2.5 px-2 py-1.5 text-[11.5px]"
          style={{
            background: "var(--color-presence-focus-soft)",
            color: "var(--color-paper-900)",
            borderRadius: "var(--radius-control)",
          }}
        >
          {t("office.focusUntil", "In focus. A knock is held and delivered when they finish.")}
        </p>
      )}

      {!knocking ? (
        <div className="mt-3 flex flex-col gap-1.5">
          {room && roomOpensAudio(room) && presence.status !== "focus" ? (
            <Button
              variant="primary"
              onClick={() => {
                joinRoom(presence.roomId as string);
                playSound("join");
                onClose();
              }}
            >
              <SignIn size={14} weight="bold" aria-hidden="true" />
              {t("office.joinThem", "Join {room}", { room: room?.name ?? "them" })}
            </Button>
          ) : presence.status === "offline" || presence.status === "away" ? (
            <Button variant="primary" onClick={openDm}>
              <ChatCircle size={14} weight="bold" aria-hidden="true" />
              {t("office.message", "Message")}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setKnocking(true)}>
              <HandWaving size={14} weight="bold" aria-hidden="true" />
              {t("office.knock", "Knock")}
            </Button>
          )}

          <div className="flex gap-1.5">
            <Button size="sm" className="flex-1" onClick={openDm}>
              <ChatCircle size={13} aria-hidden="true" />
              {t("office.message", "Message")}
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setProfileOpen(true)}>
              <UserCircle size={13} aria-hidden="true" />
              {t("office.profile", "Profile")}
            </Button>
          </div>

          {/* What you hear of them is yours to set; what everyone hears of them
              is a moderator's, and the labels keep the two apart. */}
          {userId !== meId && (
            <div className="mt-1.5 flex flex-col gap-1.5 border-t pt-2" style={{ borderColor: "var(--color-hairline)" }}>
              <label className="flex items-center gap-2 text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
                <SpeakerHigh size={13} aria-hidden="true" />
                <span className="sr-only">{t("office.volume", "Their volume")}</span>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={5}
                  value={Math.round(volume * 100)}
                  onChange={(e) => setLocalVolume(userId, Number(e.target.value) / 100)}
                  aria-label={t("office.volumeOf", "Volume of {name}", { name: user.name })}
                  className="min-w-0 flex-1"
                  style={{ accentColor: "var(--color-accent)" }}
                />
                <span className="tabular w-[38px] text-end">{Math.round(volume * 100)}%</span>
              </label>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1"
                  aria-pressed={mutedForMe}
                  onClick={() => toggleLocalMute(userId)}
                >
                  {mutedForMe ? <Microphone size={13} aria-hidden="true" /> : <MicrophoneSlash size={13} aria-hidden="true" />}
                  {mutedForMe ? t("office.unmuteForMe", "Unmute for me") : t("office.muteForMe", "Mute for me")}
                </Button>
                {can.moderate && (
                  <Button
                    size="sm"
                    className="flex-1"
                    aria-pressed={Boolean(presence.muted)}
                    onClick={() => setServerMute(userId, !presence.muted)}
                    style={presence.muted ? { color: "var(--color-danger-600)" } : undefined}
                  >
                    <MicrophoneSlash size={13} aria-hidden="true" />
                    {presence.muted ? t("office.unmuteMic", "Unmute mic") : t("office.muteMic", "Mute mic")}
                  </Button>
                )}
                {can.moderate && (
                  <Button
                    size="sm"
                    className="flex-1"
                    aria-pressed={Boolean(presence.deafened)}
                    onClick={() => setServerDeafen(userId, !presence.deafened)}
                    style={presence.deafened ? { color: "var(--color-danger-600)" } : undefined}
                  >
                    <SpeakerSlash size={13} aria-hidden="true" />
                    {presence.deafened ? t("office.undeafen", "Undeafen") : t("office.deafen", "Deafen")}
                  </Button>
                )}
              </div>
              {can.moderate && (
                <p className="text-[10.5px]" style={{ color: "var(--color-ink-subtle)" }}>
                  {t("office.moderationNote", "Mute mic and Deafen apply for everyone, and the person is told.")}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor="knock-reason" className="text-[12px] font-medium" style={{ color: "var(--color-ink)" }}>
            {t("office.knockReason", "What is it about?")}
          </label>
          <input
            id="knock-reason"
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doKnock()}
            placeholder={t("office.knockPlaceholder", "Optional, one line")}
            style={{
              background: "var(--color-surface-sunken)",
              border: "1px solid var(--color-hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "7px 10px",
              fontSize: "13px",
              minHeight: 34,
            }}
          />
          <div className="flex gap-1.5">
            <Button variant="primary" size="sm" className="flex-1" onClick={doKnock}>
              {t("office.sendKnock", "Knock")}
            </Button>
            <Button size="sm" onClick={() => setKnocking(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
