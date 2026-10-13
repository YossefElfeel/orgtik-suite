"use client";

/**
 * SOMION HQ - MEDIA DOCK
 *
 * Appears only when audio is actually connected: inside a room, or in a huddle
 * after a knock. On the open floor there is no dock, because on the open floor
 * there is no media connection. That is the product's cost model made visible -
 * presence is free, audio is not.
 */

import { roomOpensAudio } from "@/lib/presence";
import { useEffect, useState } from "react";
import { Microphone, MicrophoneSlash, PhoneX, VideoCamera, VideoCameraSlash, MonitorArrowUp, SpeakerHigh, SpeakerSlash, Users, ArrowsClockwise } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useRoom, useRoomOccupants, useUser } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useScreenShare } from "@/features/meetings/useMedia";
import { useT } from "@/lib/i18n";
import { formatDuration } from "@/lib/time";
import { audioState, playSound, resumeAudio } from "@/lib/audio";
import { RoomPanel } from "./RoomPanel";

export function MediaDock() {
  const myRoomId = useWorkspace((s) => s.presence.find((p) => p.userId === s.me)?.roomId);
  const huddleWith = useWorkspace((s) => s.huddleWith);
  const leaveRoom = useWorkspace((s) => s.leaveRoom);
  const endHuddle = useWorkspace((s) => s.endHuddle);
  const room = useRoom(myRoomId ?? "");
  const occupants = useRoomOccupants(myRoomId ?? "");
  const partner = useUser(huddleWith ?? "");
  const t = useT();

  const share = useScreenShare();
  const [muted, setMuted] = useState(false);
  const selfDeafened = useWorkspace((s) => s.selfDeafened);
  const setSelfDeafened = useWorkspace((s) => s.setSelfDeafened);
  const [cameraOn, setCameraOn] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [roomPanel, setRoomPanel] = useState(false);
  /* The link itself: connecting for a moment, then either running or, when
     the browser has not let the audio graph start, a problem it says out loud
     with a way to retry. */
  const [link, setLink] = useState<"connecting" | "ok" | "problem">("connecting");
  const checkLink = () => setLink(audioState() === "suspended" ? "problem" : "ok");

  /* The desk area is open floor: presence without a media connection. The dock
     only exists where audio actually exists. */
  const roomHasAudio = room ? roomOpensAudio(room) : false;
  const connected = Boolean((myRoomId && roomHasAudio) || huddleWith);
  useEffect(() => {
    if (!connected) return;
    setLink("connecting");
    const t1 = setTimeout(checkLink, 900);
    return () => clearTimeout(t1);
  }, [connected, myRoomId, huddleWith]);

  /* A light timer, restarted whenever the connection changes. */
  useEffect(() => {
    if (!connected) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [connected, myRoomId, huddleWith]);

  if (!connected) return null;

  const title = huddleWith && partner ? t("office.huddleWith", "Huddle with {name}", { name: partner.name }) : room?.name ?? "";

  const disconnect = () => {
    share.stop();
    playSound("leave");
    if (huddleWith) endHuddle();
    else leaveRoom();
  };

  return (
    <>
    {roomPanel && myRoomId && <RoomPanel roomId={myRoomId} onClose={() => setRoomPanel(false)} />}
    <div
      className={"hq-floating hq-rise absolute inset-x-0 bottom-4 z-[40] mx-auto flex w-fit items-center gap-2 px-2.5 py-2 "+("ch-border-radius-var---radius-chip")}

      role="region"
      aria-label={t("office.mediaDock", "Audio controls")}
    >
      <div className="flex items-center gap-2 ps-1.5 pe-1">
        <span
          aria-hidden="true"
          className={"ch-width-7px"+' '+"ch-height-7px"+' '+"ch-border-radius-var---radius-chip"+' '+(link === "ok"?"ch-background-var---color-presence-available":(link === "connecting"?"ch-background-var---color-presence-busy":"ch-background-var---color-danger-600"))}
        />
        <span className={"whitespace-nowrap text-body-sm font-medium "+("ch-color-var---color-ink")} >
          {title}
        </span>
        {link === "ok" ? (
          <span className={"tabular text-caption "+("ch-color-var---color-ink-subtle")} >
            {formatDuration(seconds)}
          </span>
        ) : link === "connecting" ? (
          <span className={"text-caption "+("ch-color-var---color-ink-muted")}  aria-live="polite">
            {t("call.connecting", "Connecting…")}
          </span>
        ) : (
          <span className={"flex items-center gap-1 text-caption "+("ch-color-var---color-danger-600")}  aria-live="polite">
            {t("call.linkProblem", "Connection problem")}
            <button
              type="button"
              className={"hq-btn inline-flex items-center gap-1 px-1.5 font-medium "+("ch-min-height-24px"+' '+"ch-border-radius-var---radius-chip"+' '+"ch-color-var---color-ink")}

              onClick={() => {
                resumeAudio();
                setLink("connecting");
                setTimeout(checkLink, 400);
              }}
            >
              <ArrowsClockwise size={12} weight="bold" aria-hidden="true" />
              {t("call.retry", "Retry")}
            </button>
          </span>
        )}
      </div>

      {/* Who else is here, and who is talking. */}
      <div className={"flex items-center gap-1 border-x px-2 "+("ch-border-color-var---color-hairline")} >
        {huddleWith && partner ? (
          <Avatar name={partner.name} initials={partner.initials} tint={partner.tint} size={28} hideStatus />
        ) : (
          occupants.slice(0, 5).map(({ user, presence }) => (
            <Avatar
              key={user.id}
              name={user.name}
              initials={user.initials}
              tint={user.tint}
              size={28}
              speaking={presence.speaking}
              hideStatus
            />
          ))
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          iconOnly
          label={muted ? t("call.unmute", "Unmute") : t("call.mute", "Mute")}
          onClick={() => setMuted((m) => !m)}
          className={(muted?"ch-color-var---color-danger-600":"ch-color-var---color-ink")}
        >
          {muted ? <MicrophoneSlash size={17} weight="fill" aria-hidden="true" /> : <Microphone size={17} aria-hidden="true" />}
        </Button>
        <Button
          variant="ghost"
          iconOnly
          label={selfDeafened ? t("call.undeafen", "Hear the room again") : t("call.deafen", "Deafen: hear nobody")}
          aria-pressed={selfDeafened}
          onClick={() => setSelfDeafened(!selfDeafened)}
          className={(selfDeafened?"ch-color-var---color-danger-600":"ch-color-var---color-ink")}
        >
          {selfDeafened ? <SpeakerSlash size={17} weight="fill" aria-hidden="true" /> : <SpeakerHigh size={17} aria-hidden="true" />}
        </Button>
        <Button
          variant="ghost"
          iconOnly
          label={cameraOn ? t("call.cameraOff", "Turn camera off") : t("call.cameraOn", "Turn camera on")}
          onClick={() => setCameraOn((c) => !c)}
          className={(cameraOn?"ch-color-var---color-ink":"ch-color-var---color-ink-subtle")}
        >
          {cameraOn ? <VideoCamera size={17} weight="fill" aria-hidden="true" /> : <VideoCameraSlash size={17} aria-hidden="true" />}
        </Button>
        <Button
          variant="ghost"
          iconOnly
          label={share.stream ? t("call.stopShare", "Stop sharing") : t("call.share", "Share your screen")}
          aria-pressed={Boolean(share.stream)}
          onClick={() => (share.stream ? share.stop() : void share.start())}
          className={(share.stream?"ch-color-var---color-ink-brand":"ch-color-var---color-ink-subtle")}
        >
          <MonitorArrowUp size={17} weight={share.stream ? "fill" : "regular"} aria-hidden="true" />
        </Button>
        {myRoomId && (
          <Button
            variant="ghost"
            iconOnly
            label={t("room.open", "Room details")}
            aria-pressed={roomPanel}
            onClick={() => setRoomPanel((v) => !v)}
            className={(roomPanel?"ch-color-var---color-ink-brand":"ch-color-var---color-ink")}
          >
            <Users size={17} aria-hidden="true" />
          </Button>
        )}
        <Button variant="danger" iconOnly label={t("call.leave", "Leave")} onClick={disconnect}>
          <PhoneX size={16} weight="fill" aria-hidden="true" />
        </Button>
      </div>
    </div>
    </>
  );
}
