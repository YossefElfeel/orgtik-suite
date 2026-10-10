"use client";

/**
 * SOMION HQ - PROFILE AND ROOM SETTINGS
 *
 * Two small flows the office was promising and not delivering.
 *
 * The profile is deliberately thin. It shows what a colleague needs in order to
 * decide whether to interrupt someone - their role, where they are, their local
 * time - and nothing historical. "Last seen 14 minutes ago" is exactly the kind
 * of detail this product refuses to publish about people.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatCircle, HandWaving, Clock, MapPin } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip, Field } from "@/components/ui/Primitives";
import { ConfirmModal, Modal } from "@/components/ui/Overlays";
import { useFloor, usePresenceOf, useRoom, useRoomOccupants, useUser } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { STATUS_META, roomOpensAudio, ROOM_LABEL, ROOM_KINDS, ROOM_KIND_SPEC } from "@/lib/presence";
import { useT } from "@/lib/i18n";
import { playSound } from "@/lib/audio";
import type { RoomKind } from "@/entities";
import { formatTag } from "@/lib/time";

/* ---------------------------------------------------------------- profile */

export function ProfileModal({
  userId,
  open,
  onClose,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
}) {
  const user = useUser(userId);
  const presence = usePresenceOf(userId);
  const room = useRoom(presence?.roomId ?? "");
  const channels = useWorkspace((s) => s.channels);
  const me = useWorkspace((s) => s.me);
  const sendKnock = useWorkspace((s) => s.sendKnock);
  const openOrCreateDm = useWorkspace((s) => s.openOrCreateDm);
  const joinRoom = useWorkspace((s) => s.joinRoom);
  const router = useRouter();
  const t = useT();

  if (!user || !presence) return null;

  const meta = STATUS_META[presence.status];
  const dm = channels.find((c) => c.kind === "dm" && c.memberIds.includes(userId));
  const isMe = userId === me;

  /* Their clock, not yours. A distributed team needs this more than it needs
     anything else a profile could carry. */
  let localTime = "";
  try {
    localTime = new Intl.DateTimeFormat(formatTag(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: user.timezone,
    }).format(new Date());
  } catch {
    localTime = "";
  }

  return (
    <Modal open={open} onClose={onClose} title={user.name} width={420}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Avatar
            name={user.name}
            initials={user.initials}
            tint={user.tint}
            status={presence.status}
            size={56}
            speaking={presence.speaking}
          />
          <div className="min-w-0 flex-1">
            <p className={"text-body-sm font-medium "+("ch-color-7f7330")} >
              <bdi>{user.title}</bdi>
            </p>
            <p className={"mt-0.5 text-body-sm "+("ch-color-4a0211")} >
              {presence.customText ?? t(`status.${presence.status}`, meta.label)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>{user.role}</Chip>
              {presence.status === "focus" && (
                <Chip tone="accent">{t("profile.focusHeld", "Knocks are held")}</Chip>
              )}
            </div>
          </div>
        </div>

        <dl className="flex flex-col gap-2.5">
          {room && (
            <div className="flex items-center gap-2.5">
              <MapPin size={14} aria-hidden="true" className={"ch-color-094083"}  />
              <dt className="sr-only">{t("profile.where", "Where")}</dt>
              <dd className={"text-body-sm "+("ch-color-7f7330")} >
                <bdi>{room.name}</bdi>
                <span className={"ms-1.5 text-caption "+("ch-color-4a0211")} >
                  {t(`roomKind.${room.kind}`, ROOM_LABEL[room.kind] ?? room.kind)}
                </span>
              </dd>
            </div>
          )}
          {localTime && (
            <div className="flex items-center gap-2.5">
              <Clock size={14} aria-hidden="true" className={"ch-color-094083"}  />
              <dt className="sr-only">{t("profile.localTime", "Their local time")}</dt>
              <dd className={"tabular text-body-sm "+("ch-color-7f7330")} >
                {localTime}
                <span className={"ms-1.5 text-caption "+("ch-color-4a0211")} >
                  {user.timezone.split("/")[1]?.replace("_", " ")}
                </span>
              </dd>
            </div>
          )}
        </dl>

        {/* The product refuses to publish activity history about a person, and
            says so here rather than leaving the absence to be noticed. */}
        <p
          className={"px-3 py-2 text-caption leading-relaxed "+("ch-background-314b28"+' '+"ch-border-radius-332348"+' '+"ch-color-4a0211")}

        >
          {t(
            "profile.noHistory",
            "There is no activity history here. Nothing is recorded about a person that they cannot see about themselves.",
          )}
        </p>

        {!isMe && (
          <div className="flex flex-wrap gap-2">
            {room && roomOpensAudio(room) && presence.status !== "focus" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  joinRoom(room.id);
                  playSound("join");
                  onClose();
                }}
              >
                {t("office.joinThem", "Join {room}", { room: room.name })}
              </Button>
            )}
            {presence.status === "available" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  sendKnock(userId);
                  playSound("knock");
                  onClose();
                }}
              >
                <HandWaving size={13} weight="bold" aria-hidden="true" />
                {t("office.knock", "Knock")}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                router.push(`/hq/chat/${dm ? dm.id : openOrCreateDm(userId)}`);
                onClose();
              }}
            >
              <ChatCircle size={13} aria-hidden="true" />
              {t("office.message", "Message")}
            </Button>
          </div>
        )}

        {/* The transparency page is linked from every profile, so what HQ
            records about a person is one step from the person. */}
        <Button size="sm" variant="ghost" href="/hq/insights/transparency" className="mt-3">
          {t("office.whatCollected", "What Chats records about people")}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- room settings */

export function RoomSettingsModal({
  roomId,
  open,
  onClose,
}: {
  roomId: string;
  open: boolean;
  onClose: () => void;
}) {
  const floor = useFloor();
  const updateRoom = useWorkspace((s) => s.updateRoom);
  const removeRoom = useWorkspace((s) => s.removeRoom);
  const occupants = useRoomOccupants(roomId);
  const t = useT();
  const room = floor.rooms.find((r) => r.id === roomId);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 4));
  const [locked, setLocked] = useState(room?.locked ?? false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<RoomKind>(room?.kind ?? "meeting");
  const [purpose, setPurpose] = useState(room?.purpose ?? "");
  const [audioOff, setAudioOff] = useState(room?.audio === "off");
  const [hardCap, setHardCap] = useState<boolean | undefined>(room?.hardCap);
  const [showOccupants, setShowOccupants] = useState<boolean | undefined>(room?.showOccupants);
  const [entryStatus, setEntryStatus] = useState<"inherit" | "in_meeting" | "focus" | "available" | "none">(
    room?.entryStatus === undefined ? "inherit" : room.entryStatus === null ? "none" : room.entryStatus,
  );
  const [guestsAllowed, setGuestsAllowed] = useState(room?.guestsAllowed ?? false);
  const [hoursOn, setHoursOn] = useState(Boolean(room?.hours));
  const [hoursFrom, setHoursFrom] = useState(room?.hours?.from ?? "08:00");
  const [hoursTo, setHoursTo] = useState(room?.hours?.to ?? "18:00");
  const spec = ROOM_KIND_SPEC[kind];

  if (!room) return null;

  const save = () => {
    if (!name.trim()) {
      setError(t("room.nameRequired", "A room needs a name people can say out loud."));
      return;
    }
    const cap = Number(capacity);
    updateRoom(roomId, {
      name: name.trim(),
      kind,
      capacity: Number.isFinite(cap) && cap > 0 ? Math.min(50, Math.round(cap)) : room.capacity,
      locked,
      purpose: purpose.trim() || undefined,
      audio: audioOff ? "off" : "on-entry",
      hardCap,
      showOccupants,
      entryStatus: entryStatus === "inherit" ? undefined : entryStatus === "none" ? null : entryStatus,
      guestsAllowed: kind === "meeting" || kind === "boardroom" ? guestsAllowed : undefined,
      hours: hoursOn ? { from: hoursFrom, to: hoursTo } : null,
    });
    onClose();
  };

  const rowStyle = { border: "1px solid var(--color-hairline-strong)", borderRadius: "var(--radius-control)" } as const;
  const toggle = (label: string, hint: string, checked: boolean, onChange: (v: boolean) => void, disabled = false) => (
    <label className="hq-row flex cursor-pointer items-start justify-between gap-3 px-3 py-2 border border-line-control rounded-field">
      <span className="min-w-0">
        <span className={"block text-body-sm font-medium "+("ch-color-7f7330")} >{label}</span>
        <span className={"mt-0.5 block text-caption "+("ch-color-4a0211")} >{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={"mt-0.5 shrink-0 "+("ch-width-f74111"+' '+"ch-height-ad1b79"+' '+"ch-accent-color-e56d5b")}

      />
    </label>
  );

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={t("room.settings", "Room settings")}
      description={t("room.settingsDesc", "Everyone on the floor sees these immediately.")}
      width={500}
      footer={
        <>
          {floor.rooms.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmRemove(true)}
              className={"ch-color-1fd63a"+' '+"ch-margin-inline-end-237aa8"}
            >
              {t("room.remove", "Remove room")}
            </Button>
          )}
          <Button size="sm" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={save}>
            {t("common.save", "Save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label={t("room.name", "Name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          {...(error ? { error } : {})}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="room-kind" className={"text-body-sm font-medium "+("ch-color-7f7330")} >
            {t("room.kind", "What kind of room")}
          </label>
          <select
            id="room-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as RoomKind)}
            className={"ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-d1b3a3"+' '+"ch-font-size-ba0694"+' '+"ch-min-height-9efc87"+' '+"ch-color-7f7330"}
          >
            {ROOM_KINDS.filter((k) => k.id !== "desk" || room.kind === "desk").map((k) => (
              <option key={k.id} value={k.id}>
                {t(`roomKind.${k.id}`, k.label)}
              </option>
            ))}
          </select>
          {spec && (
            <span className={"text-caption "+("ch-color-094083")} >
              {t(`roomKind.${spec.id}.hint`, spec.hint)}. {t("room.kindFurniture", "Changing the kind refurnishes the room.")}
            </span>
          )}
        </div>

        <Field
          label={t("room.purpose", "What is it for?")}
          hint={t("room.purposeHint", "One line, shown when the room is empty and on hover")}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder={spec ? t(`roomKind.${spec.id}.hint`, spec.hint) : ""}
        />

        <Field
          label={t("room.capacity", "Capacity")}
          hint={
            (hardCap ?? Boolean(spec?.hardCap))
              ? t("room.capacityHardHint", "Nobody beyond this number can enter.")
              : t("room.capacityHint", "The room shows as full beyond this, but nobody is blocked.")
          }
          type="number"
          min={1}
          max={50}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />

        <p className={"pt-1 text-body-sm font-medium "+("ch-color-7f7330")} >
          {t("room.behaviour", "Behaviour")}
        </p>

        {toggle(
          t("room.audio", "Open audio when someone enters"),
          spec && !spec.audio
            ? t("room.audioKindOff", "This kind of room never opens a microphone.")
            : t("room.audioHint", "Off makes it a quiet room: presence, no microphone."),
          !audioOff && Boolean(spec?.audio),
          (v) => setAudioOff(!v),
          Boolean(spec && !spec.audio),
        )}

        {toggle(
          t("room.hardCap", "Hard capacity"),
          t("room.hardCapHint", "Refuse entry beyond capacity instead of only labelling the room full."),
          hardCap ?? Boolean(spec?.hardCap),
          (v) => setHardCap(v),
        )}

        {toggle(
          t("room.showOccupants", "Name who is inside"),
          t("room.showOccupantsHint", "Off shows a count on the floor and no tiles. For rooms where privacy matters."),
          showOccupants ?? !Boolean(spec?.hideOccupants),
          (v) => setShowOccupants(v),
        )}

        {(kind === "meeting" || kind === "boardroom") &&
          toggle(
            t("room.guests", "Clients may join by link"),
            t("room.guestsHint", "A meeting booked here can carry a guest link."),
            guestsAllowed,
            setGuestsAllowed,
          )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="room-entry" className={"text-body-sm font-medium "+("ch-color-7f7330")} >
            {t("room.entryStatus", "Status on entry")}
          </label>
          <select
            id="room-entry"
            value={entryStatus}
            onChange={(e) => setEntryStatus(e.target.value as typeof entryStatus)}
            className={"ch-background-751d03"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-d1b3a3"+' '+"ch-font-size-ba0694"+' '+"ch-min-height-9efc87"+' '+"ch-color-7f7330"}
          >
            <option value="inherit">
              {t("room.entryInherit", "As the kind implies ({s})", {
                s: spec?.entryStatus === "in_meeting" ? "In a meeting" : spec?.entryStatus === "focus" ? "Focus" : "no change",
              })}
            </option>
            <option value="in_meeting">{t("status.in_meeting", "In a meeting")}</option>
            <option value="focus">{t("status.focus", "Focus")}</option>
            <option value="available">{t("status.available", "Available")}</option>
            <option value="none">{t("room.entryNone", "Leave status alone")}</option>
          </select>
        </div>

        {toggle(
          t("room.hours", "Opening hours"),
          t("room.hoursHint", "Outside them the room is closed and cannot be entered."),
          hoursOn,
          setHoursOn,
        )}
        {hoursOn && (
          <div className="flex items-end gap-3 ps-3">
            <label className={"flex flex-col gap-1 text-caption "+("ch-color-4a0211")} >
              {t("common.from", "From")}
              <input
                type="time"
                value={hoursFrom}
                onChange={(e) => setHoursFrom(e.target.value)}
                className={"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-8fb0de"+' '+"ch-font-size-ba0694"}
              />
            </label>
            <label className={"flex flex-col gap-1 text-caption "+("ch-color-4a0211")} >
              {t("common.to", "To")}
              <input
                type="time"
                value={hoursTo}
                onChange={(e) => setHoursTo(e.target.value)}
                className={"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-padding-8fb0de"+' '+"ch-font-size-ba0694"}
              />
            </label>
          </div>
        )}

        <label
          className={"hq-row flex cursor-pointer items-start justify-between gap-3 px-3 py-2.5 "+("ch-border-8ff264"+' '+"ch-border-radius-332348")}

        >
          <span className="min-w-0">
            <span className={"block text-body-sm font-medium "+("ch-color-7f7330")} >
              {t("room.locked", "Lock this room")}
            </span>
            <span className={"mt-0.5 block text-caption "+("ch-color-4a0211")} >
              {t("room.lockedHint", "People knock instead of walking in. Useful for a one to one.")}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={locked}
            onChange={(e) => setLocked(e.target.checked)}
            className={"mt-0.5 shrink-0 "+("ch-width-f74111"+' '+"ch-height-ad1b79"+' '+"ch-accent-color-e56d5b")}

          />
        </label>
      </div>
    </Modal>

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          removeRoom(roomId);
          onClose();
        }}
        title={t("room.removeTitle", "Remove {name}?", { name: room.name })}
        body={
          occupants.length > 0
            ? t(
                "room.removeBodyOccupied",
                "{n} people are in it right now. They will be put back on the open floor, and any audio in the room ends.",
                { n: occupants.length },
              )
            : t("room.removeBody", "The room disappears from the floor for everyone. Its name can be reused.")
        }
        confirmLabel={t("room.remove", "Remove room")}
      />
    </>
  );
}

/* --------------------------------------------------------------- add room */

/* Every kind but the open floor, which a floor has exactly one of. */
const KINDS = ROOM_KINDS.filter((k) => k.id !== "desk");

export function AddRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addRoom = useWorkspace((s) => s.addRoom);
  const t = useT();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<RoomKind>("meeting");
  const [capacity, setCapacity] = useState("6");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setKind("meeting");
    setCapacity("6");
    setError(null);
  };

  const submit = () => {
    if (!name.trim()) {
      setError(t("room.nameRequired", "A room needs a name people can say out loud."));
      return;
    }
    const id = addRoom({ name, kind, capacity: Number(capacity) || 4 });
    if (!id) {
      setError(t("room.noSpace", "There is no space left on the floor for a room of this kind. Remove one first, or switch to a larger template."));
      return;
    }
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t("room.addTitle", "Add a room")}
      description={t("room.addDesc", "It is placed in the first free space on the floor and appears for everyone at once.")}
      width={440}
      footer={
        <>
          <Button
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={submit}>
            {t("room.add", "Add room")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label={t("room.name", "Name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder={t("room.namePlaceholder", "Room C")}
          autoFocus
          {...(error ? { error } : {})}
        />

        <fieldset className="flex flex-col gap-1.5">
          <legend className={"pb-1.5 text-body-sm font-medium "+("ch-color-7f7330")} >
            {t("room.kind", "What kind of room")}
          </legend>
          {KINDS.map((k) => (
            <label
              key={k.id}
              className={"hq-row flex cursor-pointer items-start gap-2.5 px-3 py-2 "+((kind === k.id?"ch-border-c98846":"ch-border-8ff264")+' '+"ch-border-radius-332348"+' '+(kind === k.id?"ch-background-1416a8":"ch-background-751d03"))}

            >
              <input
                type="radio"
                name="room-kind"
                checked={kind === k.id}
                onChange={() => {
                  setKind(k.id);
                  setCapacity(String(k.capacity));
                }}
                className={"mt-0.5 "+("ch-accent-color-e56d5b")}

              />
              <span className="min-w-0">
                <span className={"block text-body-sm font-medium "+("ch-color-7f7330")} >
                  {t(`roomKind.${k.id}`, k.label)}
                </span>
                <span className={"block text-caption "+("ch-color-4a0211")} >
                  {t(`roomKind.${k.id}.hint`, k.hint)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <Field
          label={t("room.capacity", "Capacity")}
          type="number"
          min={1}
          max={50}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </div>
    </Modal>
  );
}
