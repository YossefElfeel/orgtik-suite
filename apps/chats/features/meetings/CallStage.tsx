"use client";

/**
 * SOMION HQ - CALL STAGE
 *
 * Grid and speaker views, a real self-view, a real screen share, participants,
 * raise hand, in-call chat, and the lobby the host admits guests from.
 *
 * Remote participants are audio-first tiles rather than fabricated video. That
 * is not a shortcut: the product's own position is that rooms are audio-first
 * and the camera is optional, so a wall of stock faces would misrepresent what
 * the thing actually does.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChatCircle,
  Record,
  Stop,
  Hand,
  Microphone,
  MicrophoneSlash,
  MonitorArrowUp,
  PencilSimple,
  PhoneX,
  Users,
  VideoCamera,
  VideoCameraSlash,
  X,
  SquaresFour,
  UserFocus,
  UserPlus,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip, EmptyState } from "@/components/ui/Primitives";
import { Whiteboard } from "./Whiteboard";
import { InviteCard } from "./ShareMeeting";
import { Composer } from "@/features/chat/Composer";
import { Message } from "@/features/chat/Message";
import { Modal } from "@/components/ui/Overlays";
import { useCamera, useScreenShare, useStreamRef } from "./useMedia";
import { useCan, useMe, useMeeting, useMessages, useUser, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatDuration } from "@/lib/time";
import { playSound } from "@/lib/audio";
import { ConfirmDialog } from "@orgtik/ui";

type Panel = "none" | "people" | "chat" | "board";

export function CallStage({
  meetingId,
  onLeave,
  startMuted = false,
  startCamera = false,
}: {
  meetingId: string;
  onLeave: () => void;
  /** What the person chose on the pre-join (CHT-010). */
  startMuted?: boolean;
  startCamera?: boolean;
}) {
  const meeting = useMeeting(meetingId);
  const me = useMe();
  const admitGuest = useWorkspace((s) => s.admitGuest);
  const declineGuest = useWorkspace((s) => s.declineGuest);
  const sharer = useUser(meeting?.sharingUserId ?? "");
  const t = useT();

  const camera = useCamera();
  const share = useScreenShare();
  const selfRef = useStreamRef(camera.stream);
  /* The camera comes on if it was on in the pre-join. Once, on entry. */
  const cameraAsked = useRef(false);
  useEffect(() => {
    if (startCamera && !cameraAsked.current) {
      cameraAsked.current = true;
      void camera.start();
    }
  }, [startCamera, camera]);
  const shareRef = useStreamRef(share.stream);

  const [muted, setMuted] = useState(startMuted);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [handUp, setHandUp] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");
  const [seconds, setSeconds] = useState(0);
  const ensureMeetingChannel = useWorkspace((st) => st.ensureMeetingChannel);
  const requestRecording = useWorkspace((st) => st.requestRecording);
  const startRecording = useWorkspace((st) => st.startRecording);
  const can = useCan();
  /* Alone in a meeting you just started, the only thing left to do is ask
     someone in, so the invitation is already open. It steps aside by itself
     once someone is let in; opened from the dock, it stays until closed. */
  const alone = Boolean(meeting?.instant) && meeting?.participantIds.length === 1 && meeting.guests.length === 0;
  const [inviting, setInviting] = useState<"auto" | "open" | "closed">(() =>
    can.inviteGuests && alone ? "auto" : "closed",
  );
  const someoneIn = meeting?.guests.some((g) => g.state === "admitted") ?? false;
  useEffect(() => {
    if (someoneIn) setInviting((v) => (v === "auto" ? "closed" : v));
  }, [someoneIn]);
  /* Closing the card hands focus back to the button that opens it, rather
     than dropping it on the page when the focused control disappears. */
  const inviteButton = useRef<HTMLButtonElement>(null);
  const closeInvite = () => {
    setInviting("closed");
    inviteButton.current?.focus();
  };
  const [view, setView] = useState<"grid" | "speaker">("grid");
  /* A string, not a Set: a selector that returns a fresh object on every
     read re-renders on every store change, without end. */
  const speakingKey = useWorkspace((st) => st.presence.filter((p) => p.speaking).map((p) => p.userId).join(","));
  const speakingIds = new Set(speakingKey.split(",").filter(Boolean));
  const setServerMute = useWorkspace((s) => s.setServerMute);
  const declineRecording = useWorkspace((st) => st.declineRecording);
  const stopRecording = useWorkspace((st) => st.stopRecording);
  const endMeeting = useWorkspace((st) => st.endMeeting);
  const sendMessage = useWorkspace((st) => st.sendMessage);
  const settings = useWorkspace((st) => st.settings);
  const [chatChannelId, setChatChannelId] = useState<string | null>(null);
  const allUsers = useUsers();

  const recording = meeting?.recordingState ?? "none";

  /* The conversation is created the first time the panel is opened, not on
     entry: a call nobody typed in should not leave an empty channel behind. */
  useEffect(() => {
    if (panel === "chat" && !chatChannelId && meeting) {
      setChatChannelId(ensureMeetingChannel(meeting.id));
    }
  }, [panel, chatChannelId, meeting, ensureMeetingChannel]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const waiting = useMemo(
    () => meeting?.guests.filter((g) => g.state === "lobby") ?? [],
    [meeting],
  );
  const admitted = useMemo(
    () => meeting?.guests.filter((g) => g.state === "admitted") ?? [],
    [meeting],
  );

  /* The lobby is announced, not silently queued. A guest left waiting because
     nobody noticed is the failure this whole flow exists to prevent. */
  useEffect(() => {
    if (waiting.length > 0) playSound("knock");
  }, [waiting.length]);

  if (!meeting) {
    /* A call for a meeting that is not there is a page, not a blank: it says
       so and offers the way back. */
    return (
      <EmptyState
        title={t("meetings.gone", "This meeting is not here")}
        body={t("meetings.goneBody", "It may have been cancelled.")}
        action={
          <Button size="sm" href="/hq/meetings">
            {t("meetings.back", "Back to meetings")}
          </Button>
        }
      />
    );
  }

  const participants = meeting.participantIds;
  /* The person who started the meeting (its first participant), or a moderator. */
  const isHost = participants[0] === me.id || can.moderate;
  const stopMedia = () => {
    camera.stop();
    share.stop();
    /* Stopping the recording is not optional on the way out: leaving a call still recording is
       how a private conversation ends up on tape. */
    if (recording === "recording") stopRecording(meeting.id);
  };
  const sharing = Boolean(share.stream);
  const remoteShare = meeting.sharingUserId && meeting.sharingUserId !== me.id ? meeting.sharingUserId : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: "var(--color-paper-900)" }}>
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h1 className="truncate text-[14px] font-semibold" style={{ color: "var(--color-paper-100)" }}>
            <bdi>{meeting.title}</bdi>
          </h1>
          <span className="tabular text-[12px]" style={{ color: "var(--color-paper-500)" }}>
            {formatDuration(seconds)}
          </span>
        </div>
        {recording === "recording" && (
          <Chip tone="danger">
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: "var(--radius-chip)",
                background: "var(--color-danger-600)",
                display: "inline-block",
              }}
            />
            {t("call.recording", "Recording")}
          </Chip>
        )}
        {recording === "processing" && <Chip>{t("call.processing", "Processing recording")}</Chip>}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col p-3">
          {inviting !== "closed" && can.inviteGuests && (
            <InviteCard
              id="call-invite"
              meeting={meeting}
              ready={alone}
              focusCopy={inviting === "open"}
              onClose={closeInvite}
            />
          )}
          {/* Lobby. Sits above the stage because admitting someone is more
              urgent than anything else on this screen. */}
          {waiting.length > 0 && (
            <div
              className="mb-3 flex flex-wrap items-center gap-3 px-3 py-2.5"
              style={{
                background: "var(--color-paper-800)",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--color-paper-700)",
              }}
            >
              {waiting.map((g) => (
                <div key={g.email} className="flex flex-1 items-center gap-2.5">
                  <Avatar name={g.name} initials={initialsOf(g.name)} tint={3} size={28} guest hideStatus />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium" style={{ color: "var(--color-paper-100)" }}>
                      {t("call.waiting", "{name} is waiting", { name: g.name })}
                    </p>
                    {g.company && (
                      <p className="truncate text-[11.5px]" style={{ color: "var(--color-paper-500)" }}>
                        {g.company}
                      </p>
                    )}
                  </div>
                  <Button variant="primary" size="sm" onClick={() => admitGuest(meeting.id, g.email)}>
                    {t("call.admit", "Admit")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => declineGuest(meeting.id, g.email)} style={{ color: "var(--color-paper-100)" }}>
                    {t("call.decline", "Decline")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {remoteShare && !sharing ? (
            /* Someone else's screen: the view from the other side of the
               presenter. The share fills the stage; people become a strip. */
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: "var(--color-paper-950)", borderRadius: "var(--radius-card)" }}>
                <RemoteShare title={meeting.title} />
                <span
                  className="absolute start-3 top-3 px-2 py-1 text-[11.5px] font-medium"
                  style={{ background: "var(--color-paper-900)", color: "var(--color-paper-100)", borderRadius: "var(--radius-chip)" }}
                >
                  {t("call.theirShare", "{name} is sharing their screen", { name: sharer?.name ?? "" })}
                </span>
              </div>
              <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
                <SelfTile camera={camera} selfRef={selfRef} muted={muted} small />
                {participants
                  .filter((id) => id !== me.id)
                  .map((id) => (
                    <ParticipantTile key={id} userId={id} small />
                  ))}
              </div>
            </div>
          ) : sharing ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div
                className="relative min-h-0 flex-1 overflow-hidden"
                style={{ background: "var(--color-paper-950)", borderRadius: "var(--radius-card)" }}
              >
                <video
                  ref={shareRef}
                  muted
                  playsInline
                  className="h-full w-full object-contain"
                  aria-label={t("call.yourScreen", "Your shared screen")}
                />
                <span
                  className="absolute start-3 top-3 px-2 py-1 text-[11.5px] font-medium"
                  style={{ background: "var(--color-paper-900)", color: "var(--color-paper-100)", borderRadius: "var(--radius-chip)" }}
                >
                  {t("call.youAreSharing", "You are sharing your screen")}
                </span>
              </div>
              <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
                <SelfTile camera={camera} selfRef={selfRef} muted={muted} small />
                {participants
                  .filter((id) => id !== me.id)
                  .map((id) => (
                    <ParticipantTile key={id} userId={id} small />
                  ))}
              </div>
            </div>
          ) : panel === "board" ? (
            <div className="min-h-0 flex-1 overflow-hidden" style={{ borderRadius: "var(--radius-card)" }}>
              <Whiteboard />
            </div>
          ) : view === "speaker" && participants.length > 1 ? (
            /* Speaker view: whoever is speaking, or the first other person,
               fills the stage; everyone else is a strip along the bottom. */
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="min-h-0 flex-1">
                {(() => {
                  const others = participants.filter((id) => id !== me.id);
                  const speaking = others.find((id) => speakingIds.has(id));
                  const focus = speaking ?? others[0];
                  return focus ? <ParticipantTile userId={focus} /> : <SelfTile camera={camera} selfRef={selfRef} muted={muted} />;
                })()}
              </div>
              <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
                <SelfTile camera={camera} selfRef={selfRef} muted={muted} small />
                {participants
                  .filter((id) => id !== me.id)
                  .slice(1)
                  .map((id) => (
                    <ParticipantTile key={id} userId={id} small />
                  ))}
                {admitted.map((g) => (
                  <GuestTile key={g.email} name={g.name} company={g.company} />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="grid min-h-0 flex-1 gap-2"
              style={{
                gridTemplateColumns: `repeat(${gridColumns(participants.length + admitted.length)}, minmax(0, 1fr))`,
                gridAutoRows: "1fr",
              }}
            >
              <SelfTile camera={camera} selfRef={selfRef} muted={muted} />
              {participants
                .filter((id) => id !== me.id)
                .map((id) => (
                  <ParticipantTile key={id} userId={id} />
                ))}
              {admitted.map((g) => (
                <GuestTile key={g.email} name={g.name} company={g.company} />
              ))}
            </div>
          )}
        </div>

        {(panel === "people" || panel === "chat") && (
          <aside
            className="hidden w-[300px] shrink-0 flex-col lg:flex"
            style={{ background: "var(--color-surface)", borderInlineStart: "1px solid var(--color-hairline)" }}
          >
            <header
              className="flex items-center justify-between px-3 py-2.5"
              style={{ borderBottom: "1px solid var(--color-hairline)" }}
            >
              <strong className="text-[13px]">
                {panel === "people" ? t("call.people", "People") : t("call.chat", "Chat")}
              </strong>
              <Button variant="ghost" size="sm" iconOnly label={t("common.close", "Close")} onClick={() => setPanel("none")}>
                <X size={13} weight="bold" aria-hidden="true" />
              </Button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
              {panel === "people" ? (
                <>
                {/* The host can quiet the room. It is the moderator's mute,
                    so everyone sees it and the person is told. */}
                {can.moderate && participants.length > 1 && (
                  <div className="flex items-center justify-between gap-2 px-2 pb-2">
                    <span className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                      {t("call.hostControls", "Host controls")}
                    </span>
                    <Button size="sm" onClick={() => participants.filter((id) => id !== me.id).forEach((id) => setServerMute(id, true))}>
                      {t("call.muteAll", "Mute everyone")}
                    </Button>
                  </div>
                )}
                <ul className="flex flex-col gap-0.5">
                  {participants.map((id) => (
                    <PersonRow key={id} userId={id} isMe={id === me.id} handUp={id === me.id && handUp} canMute={can.moderate} />
                  ))}
                  {admitted.map((g) => (
                    <li key={g.email} className="flex items-center gap-2 px-2 py-1.5">
                      <Avatar name={g.name} initials={initialsOf(g.name)} tint={3} size={28} guest hideStatus />
                      <span className="flex-1 text-[13px]"><bdi>{g.name}</bdi></span>
                      <Chip>{t("call.guest", "Guest")}</Chip>
                    </li>
                  ))}
                </ul>
                </>
              ) : chatChannelId ? (
                <MeetingChat channelId={chatChannelId} />
              ) : null}
            </div>
            {panel === "chat" && chatChannelId && (
              <div className="shrink-0">
                <Composer
                  placeholder={t("call.chatPlaceholder", "Message the meeting")}
                  onSend={(text, attachments) => sendMessage(chatChannelId, text, undefined, attachments)}
                />
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Consent is a real gate, not a notice. Everyone in the call is told
          before anything is captured, and declining is a first-class outcome
          that leaves the meeting un-recorded. */}
      <Modal
        open={recording === "requested"}
        onClose={() => declineRecording(meeting.id)}
        title={t("call.consentTitle", "Record this meeting?")}
        width={440}
        footer={
          <>
            <Button size="sm" onClick={() => declineRecording(meeting.id)}>
              {t("call.consentNo", "Not this time")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => startRecording(meeting.id)}>
              {t("call.consentYes", "Everyone agrees, start recording")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--color-ink)", maxWidth: "56ch" }}>
            {t(
              "call.consentBody",
              "Everyone in the call, including guests, is shown a recording indicator for as long as it runs. Ask them out loud before you start.",
            )}
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              t("call.consentPoint1", "The recording is stored in Files, not in Chats."),
              t("call.consentPoint2", "It follows the workspace retention setting like any other file."),
              t("call.consentPoint3", "Anyone in the call can ask you to stop, and stopping is immediate."),
            ].map((line) => (
              <li key={line} className="flex gap-2 text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
                <span aria-hidden="true">&middot;</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
            {t("call.consentWho", "In the call: {names}.", {
              names: [
                ...participants.map((id) => allUsers.find((u) => u.id === id)?.name ?? id),
                ...admitted.map((g) => g.name),
              ].join(", "),
            })}
          </p>
        </div>
      </Modal>

      {/* Dock. It wraps rather than running off a phone's edge. */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 px-4 py-3">
        <DockButton
          active={!muted}
          danger={muted}
          label={muted ? t("call.unmute", "Unmute") : t("call.mute", "Mute")}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? <MicrophoneSlash size={18} weight="fill" aria-hidden="true" /> : <Microphone size={18} aria-hidden="true" />}
        </DockButton>

        <DockButton
          active={Boolean(camera.stream)}
          label={camera.stream ? t("call.cameraOff", "Turn camera off") : t("call.cameraOn", "Turn camera on")}
          onClick={() => (camera.stream ? camera.stop() : void camera.start())}
        >
          {camera.stream ? <VideoCamera size={18} weight="fill" aria-hidden="true" /> : <VideoCameraSlash size={18} aria-hidden="true" />}
        </DockButton>

        <DockButton
          active={sharing}
          label={sharing ? t("call.stopShare", "Stop sharing") : t("call.share", "Share your screen")}
          onClick={() => (sharing ? share.stop() : void share.start())}
        >
          <MonitorArrowUp size={18} weight={sharing ? "fill" : "regular"} aria-hidden="true" />
        </DockButton>

        <DockButton
          active={handUp}
          label={handUp ? t("call.lowerHand", "Lower hand") : t("call.raiseHand", "Raise hand")}
          onClick={() => setHandUp((h) => !h)}
        >
          <Hand size={18} weight={handUp ? "fill" : "regular"} aria-hidden="true" />
        </DockButton>

        {settings.recordingAllowed && can.startRecording && (
          <DockButton
            active={recording === "recording"}
            danger={recording === "recording"}
            label={
              recording === "recording"
                ? t("call.stopRecording", "Stop recording")
                : t("call.startRecording", "Record this meeting")
            }
            onClick={() =>
              recording === "recording" ? stopRecording(meeting.id) : requestRecording(meeting.id)
            }
          >
            {recording === "recording" ? (
              <Stop size={18} weight="fill" aria-hidden="true" />
            ) : (
              <Record size={18} aria-hidden="true" />
            )}
          </DockButton>
        )}

        <DockButton
          active={view === "speaker"}
          label={view === "speaker" ? t("call.gridView", "Grid view") : t("call.speakerView", "Speaker view")}
          onClick={() => setView((v) => (v === "speaker" ? "grid" : "speaker"))}
        >
          {view === "speaker" ? <SquaresFour size={18} aria-hidden="true" /> : <UserFocus size={18} aria-hidden="true" />}
        </DockButton>

        <DockButton
          active={panel === "board"}
          label={t("call.whiteboard", "Whiteboard")}
          onClick={() => setPanel((p) => (p === "board" ? "none" : "board"))}
        >
          <PencilSimple size={18} aria-hidden="true" />
        </DockButton>

        {can.inviteGuests && (
          <DockButton
            ref={inviteButton}
            active={inviting !== "closed"}
            expanded={inviting !== "closed"}
            controls="call-invite"
            label={t("call.invite", "Invite people")}
            onClick={() => setInviting((v) => (v === "closed" ? "open" : "closed"))}
          >
            <UserPlus size={18} weight={inviting !== "closed" ? "fill" : "regular"} aria-hidden="true" />
          </DockButton>
        )}

        <DockButton
          active={panel === "people"}
          label={t("call.people", "People")}
          onClick={() => setPanel((p) => (p === "people" ? "none" : "people"))}
        >
          <Users size={18} aria-hidden="true" />
        </DockButton>

        <DockButton
          active={panel === "chat"}
          label={t("call.chat", "Chat")}
          onClick={() => setPanel((p) => (p === "chat" ? "none" : "chat"))}
        >
          <ChatCircle size={18} aria-hidden="true" />
        </DockButton>

        {/* Leaving is yours alone: the meeting goes on for everyone else (CHT-002). Ending it for
            everyone is the host's, and says what it does first. */}
        {isHost ? (
          <ConfirmDialog
            open={confirmEnd}
            onOpenChange={setConfirmEnd}
            trigger={
              <Button variant="ghost" className="ms-2" style={{ color: "var(--color-paper-100)" }}>
                {t("call.endForAll", "End for everyone")}
              </Button>
            }
            title={t("call.endTitle", "End the meeting for everyone?")}
            impact={t(
              "call.endImpact",
              "{people, plural, =0 {Nobody else is in the call.} one {One other person drops out of the call.} other {# other people drop out of the call.}} {guests, plural, =0 {} one {One guest drops out too.} other {# guests drop out too.}}",
              { people: Math.max(0, participants.length - 1), guests: admitted.length + waiting.length },
            )}
            confirmLabel={t("call.endConfirm", "End meeting")}
            tone="danger"
            onConfirm={() => {
              stopMedia();
              endMeeting(meeting.id, participants);
              playSound("leave");
              onLeave();
            }}
          />
        ) : null}
        <Button
          variant="danger"
          onClick={() => {
            stopMedia();
            playSound("leave");
            onLeave();
          }}
          className="ms-2"
        >
          <PhoneX size={15} weight="fill" aria-hidden="true" />
          {t("call.leave", "Leave")}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- tiles */

function SelfTile({
  camera,
  selfRef,
  muted,
  small = false,
}: {
  camera: ReturnType<typeof useCamera>;
  selfRef: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  small?: boolean;
}) {
  const me = useMe();
  const t = useT();

  return (
    <TileFrame small={small}>
      {camera.stream ? (
        <video
          ref={selfRef}
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          aria-label={t("call.yourCamera", "Your camera")}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
          <Avatar name={me.name} initials={me.initials} tint={me.tint} size={small ? 28 : 56} hideStatus />
          {!small && camera.error && (
            <p className="px-3 text-center text-[11.5px]" style={{ color: "var(--color-paper-500)" }}>
              {camera.error === "denied"
                ? t("call.cameraDenied", "Camera blocked. Audio still works.")
                : t("call.cameraMissing", "No camera found. Audio still works.")}
            </p>
          )}
        </div>
      )}
      <TileLabel name={t("call.you", "You")} muted={muted} />
    </TileFrame>
  );
}

function ParticipantTile({ userId, small = false }: { userId: string; small?: boolean }) {
  const user = useUser(userId);
  if (!user) return null;
  return (
    <TileFrame small={small}>
      <div className="flex h-full w-full items-center justify-center">
        <Avatar name={user.name} initials={user.initials} tint={user.tint} size={small ? 28 : 56} hideStatus />
      </div>
      <TileLabel name={user.name} />
    </TileFrame>
  );
}

function GuestTile({ name, company }: { name: string; company?: string }) {
  return (
    <TileFrame>
      <div className="flex h-full w-full items-center justify-center">
        <Avatar name={name} initials={initialsOf(name)} tint={3} size={56} guest hideStatus />
      </div>
      <TileLabel name={company ? `${name} · ${company}` : name} guest />
    </TileFrame>
  );
}

function TileFrame({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "var(--color-paper-800)",
        borderRadius: "var(--radius-card)",
        minHeight: small ? 84 : 120,
        /* A large tile fills whatever it is given: a grid cell, or the whole
           stage in speaker view. */
        height: small ? undefined : "100%",
        width: small ? 132 : undefined,
        flexShrink: small ? 0 : undefined,
      }}
    >
      {children}
    </div>
  );
}

function TileLabel({ name, muted, guest }: { name: string; muted?: boolean; guest?: boolean }) {
  const t = useT();
  return (
    <div className="absolute bottom-2 start-2 flex items-center gap-1.5">
      <span
        className="max-w-[180px] truncate px-2 py-0.5 text-[11.5px] font-medium"
        style={{ background: "var(--color-paper-950)", color: "var(--color-paper-100)", borderRadius: "var(--radius-chip)" }}
      >
        {name}
      </span>
      {guest && <Chip>{t("call.guest", "Guest")}</Chip>}
      {muted && (
        <span
          className="flex items-center justify-center"
          style={{ width: 20, height: 20, borderRadius: "var(--radius-chip)", background: "var(--color-danger-600)" }}
          title={t("call.muted", "Muted")}
        >
          <MicrophoneSlash size={11} weight="fill" aria-hidden="true" style={{ color: "var(--color-ink-inverse)" }} />
        </span>
      )}
    </div>
  );
}

function PersonRow({ userId, isMe, handUp, canMute }: { userId: string; isMe: boolean; handUp: boolean; canMute: boolean }) {
  const user = useUser(userId);
  const muted = useWorkspace((s) => s.presence.find((p) => p.userId === userId)?.muted ?? false);
  const setServerMute = useWorkspace((s) => s.setServerMute);
  const t = useT();
  if (!user) return null;
  return (
    <li className="flex items-center gap-2 px-2 py-1.5">
      <Avatar name={user.name} initials={user.initials} tint={user.tint} size={28} hideStatus />
      <span className="flex-1 text-[13px]">
        <bdi>{user.name}</bdi>
        {isMe && <span style={{ color: "var(--color-ink-subtle)" }}> ({t("office.you", "you")})</span>}
        {muted && <span style={{ color: "var(--color-ink-subtle)" }}> · {t("call.mutedByHost", "muted")}</span>}
      </span>
      {handUp && <Hand size={14} weight="fill" aria-hidden="true" style={{ color: "var(--color-presence-busy)" }} />}
      {canMute && !isMe && (
        <Button size="sm" variant="ghost" onClick={() => setServerMute(userId, !muted)}>
          {muted ? t("call.unmute", "Unmute") : t("call.mute", "Mute")}
        </Button>
      )}
    </li>
  );
}

/**
 * The meeting's chat. It renders the ordinary transcript against an ordinary
 * channel, so a message sent mid-call is the same object as any other and is
 * still there, and still searchable, once the call has ended.
 */
function MeetingChat({ channelId }: { channelId: string }) {
  const messages = useMessages(channelId);
  const t = useT();

  if (messages.length === 0) {
    return (
      <p className="p-2 text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
        {t("call.chatEmpty", "Messages sent here stay with the meeting, and are still here afterwards.")}
      </p>
    );
  }

  return (
    <div className="mt-auto flex flex-col">
      {messages.map((m, i) => (
        <Message
          key={m.id}
          message={m}
          grouped={i > 0 && messages[i - 1]?.authorId === m.authorId}
        />
      ))}
    </div>
  );
}

function DockButton({
  children,
  label,
  onClick,
  active,
  danger,
  expanded,
  controls,
  ref,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  /** Set when the button opens something rather than toggling a state. */
  expanded?: boolean;
  controls?: string;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-label={label}
      {...(expanded === undefined
        ? { "aria-pressed": active }
        : { "aria-expanded": expanded, ...(expanded && controls ? { "aria-controls": controls } : {}) })}
      title={label}
      className="hq-btn flex items-center justify-center"
      style={{
        width: 40,
        height: 40,
        borderRadius: "var(--radius-control)",
        background: danger
          ? "var(--color-danger-600)"
          : active
            ? "var(--color-paper-700)"
            : "var(--color-paper-800)",
        color: "var(--color-paper-100)",
        border: "none",
      }}
    >
      {children}
    </button>
  );
}

/* Up to four across; beyond that the grid stays square-ish rather than
   producing a single row of letterboxes. */
function gridColumns(n: number): number {
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * What a shared screen looks like from the audience: in the product it is
 * the presenter's track; here, a page with the meeting's name on it, so the
 * layout, the label and the strip of people are real even though the pixels
 * are not.
 */
function RemoteShare({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6" aria-hidden="true">
      <div
        className="flex h-full w-full max-w-[880px] flex-col overflow-hidden"
        style={{ background: "var(--color-surface)", borderRadius: "var(--radius-control)", boxShadow: "var(--shadow-panel)" }}
      >
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: "var(--radius-chip)", background: "var(--color-paper-400)" }} />
          ))}
          <span className="ms-2 text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
            {title} · invoice-template-v2.fig
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <span style={{ width: "42%", height: 18, borderRadius: 6, background: "var(--color-paper-300)" }} />
          {[92, 84, 88, 60, 76, 40].map((w, i) => (
            <span key={i} style={{ width: `${w}%`, height: 10, borderRadius: 5, background: "var(--color-surface-sunken)" }} />
          ))}
          <div className="mt-2 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ height: 72, borderRadius: 8, background: "var(--color-surface-sunken)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
