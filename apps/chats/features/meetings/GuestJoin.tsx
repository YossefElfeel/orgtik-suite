"use client";

/**
 * SOMION HQ - GUEST JOIN
 *
 * Deliberately outside the app shell. A client opening this link sees the
 * customer's name and nothing else: no suite navigation, no Somion branding, no
 * third-party product identity. That is the promise the product makes about
 * client meetings and it is either kept on this page or nowhere.
 *
 * No account, no install, minimum data: a name, and an optional email. The
 * recording notice appears before joining, not after.
 */

import { useEffect, useId, useState } from "react";
import { CheckCircle, ShieldCheck, Users } from "@phosphor-icons/react";
import { PreJoin } from "./PreJoin";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useT } from "@/lib/i18n";
import { ClientOnly } from "@/features/shell/ClientOnly";
import { useWorkspace } from "@/store";
import { askForMeeting, startTabRelay } from "@/mock/tab-relay";
import { formatRange, formatTime } from "@/lib/time";

type Stage = "prejoin" | "lobby" | "admitted" | "declined" | "left";

/* Names compared the way people type them: case and spacing aside. */
const sameName = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

/* A heading that takes focus when it appears, so a screen reader hears the
   new state instead of silence where the form used to be. */
const focusOnMount = (el: HTMLElement | null) => el?.focus({ preventScroll: true });

export function GuestJoin({ token }: { token: string }) {
  return (
    <ClientOnly>
      <>
        <GuestJoinInner token={token} />
      </>
    </ClientOnly>
  );
}

function GuestJoinInner({ token }: { token: string }) {
  const meeting = useWorkspace(
    (s) => s.meetings.find((m) => m.guestKey === token) ?? s.pastMeetings.find((m) => m.guestKey === token),
  );
  const isPast = useWorkspace((s) => s.pastMeetings.some((m) => m.guestKey === token));
  const users = useWorkspace((s) => s.users);
  const settings = useWorkspace((s) => s.settings);
  const applyEvent = useWorkspace((s) => s.applyEvent);
  const t = useT();

  const [stage, setStage] = useState<Stage>("prejoin");
  const [guestName, setGuestName] = useState("");
  /* Who this visitor is to the meeting, settled the first time they ask. */
  const [guestKey, setGuestKey] = useState<string | null>(null);
  /* A meeting this page has not heard of may have been started a moment ago
     somewhere else. Ask before saying the link is dead. */
  const [looking, setLooking] = useState(() => !meeting);

  useEffect(() => {
    startTabRelay();
    const known = useWorkspace.getState();
    if ([...known.meetings, ...known.pastMeetings].some((m) => m.guestKey === token)) return;
    askForMeeting(token);
    const id = setTimeout(() => setLooking(false), 1200);
    return () => clearTimeout(id);
  }, [token]);

  /* Closing the tab is leaving too. Without this the host would keep a
     waiting guest, or a tile, for someone long gone. */
  const meetingId = meeting?.id;
  useEffect(() => {
    if (!meetingId || !guestKey || (stage !== "lobby" && stage !== "admitted")) return;
    const leave = () => applyEvent({ type: "meeting.guest_left", meetingId, guestEmail: guestKey });
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [meetingId, guestKey, stage, applyEvent]);

  if (!meeting && looking) {
    return (
      <Frame workspace={settings.name}>
        <Centered
          title={t("guest.lookingTitle", "Opening the meeting")}
          body={t("guest.lookingBody", "Checking that the link is still active.")}
        >
          <Dots />
        </Centered>
      </Frame>
    );
  }

  if (!meeting) {
    return (
      <Frame workspace={settings.name}>
        <div className="py-10 text-center">
          <h1
            ref={focusOnMount}
            tabIndex={-1}
            aria-describedby="guest-expired-body"
            className="text-[18px] font-semibold outline-none"
            style={{ color: "var(--color-ink)" }}
          >
            {t("guest.expiredTitle", "This link is no longer active")}
          </h1>
          <p id="guest-expired-body" className="mx-auto mt-2 max-w-[420px] text-[13.5px]" style={{ color: "var(--color-ink-muted)" }}>
            {t("guest.expiredBody", "The meeting has finished, or the link has expired. Ask your host for a new one.")}
          </p>
        </div>
      </Frame>
    );
  }

  const hosts = meeting.participantIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const join = (name?: string) => {
    const given = (name ?? guestName).trim();
    setGuestName(given);
    setStage("lobby");
    /* Someone who came by the shared link is always a new guest, waiting under the name they gave.
       A typed name never takes over an invitation: anyone can type a name (CHT-011). An invited
       guest's own link says who it is for; that is the backend's to issue. */
    const key = guestKey ?? `link-${Date.now().toString(36)}`;
    setGuestKey(key);
    applyEvent({
      type: "meeting.guest_arrived",
      meetingId: meeting.id,
      guestEmail: key,
      name: given || t("call.guest", "Guest"),
    });
  };

  const leave = () => {
    if (guestKey) applyEvent({ type: "meeting.guest_left", meetingId: meeting.id, guestEmail: guestKey });
    setStage("left");
  };

  /* When the host admits, the workspace state changes and the guest advances.
     The guest is never left wondering whether the click worked. */
  const mine = guestKey ? meeting.guests.find((g) => g.email === guestKey) : undefined;
  if (stage === "lobby" && mine?.state === "admitted") setStage("admitted");
  if (stage === "lobby" && mine?.state === "declined") setStage("declined");
  /* The host ending the call ends it here too, wherever the guest was. */
  const over = isPast || Boolean(meeting.endedAt);

  const firstNames = hosts.map((h) => h.name.split(" ")[0]);
  const hostLine =
    firstNames.length === 1
      ? t("guest.host", "{name} is in this meeting", { name: firstNames[0] ?? "" })
      : t("guest.hosts", "{names} are in this meeting", { names: firstNames.join(", ") });

  return (
    <Frame workspace={settings.name}>
      {!over && stage === "prejoin" && (
        <>
          <div
            className="mx-auto mb-1 flex w-full max-w-[720px] flex-col gap-3 px-5 pt-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Users size={15} aria-hidden="true" style={{ color: "var(--color-ink-muted)" }} />
              <span className="text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
                {hostLine}
              </span>
              <span className="flex -space-x-1.5 rtl:space-x-reverse">
                {hosts.map((h) => (
                  <Avatar key={h.id} name={h.name} initials={h.initials} tint={h.tint} size={20} hideStatus />
                ))}
              </span>
            </div>
          </div>
          <PreJoin
            title={meeting.title}
            subtitle={
              meeting.instant
                ? t("guest.subtitleInstant", "Started {time}. Hosted by {workspace}.", {
                    time: formatTime(meeting.startsAt),
                    workspace: settings.name,
                  })
                : t("guest.subtitle", "{time}. Hosted by {workspace}.", {
                    time: formatRange(meeting.startsAt, meeting.endsAt),
                    workspace: settings.name,
                  })
            }
            askForName
            recordingNotice={settings.recordingAllowed}
            joinLabel={t("guest.ask", "Ask to join")}
            onJoin={join}
          />
        </>
      )}

      {!over && stage === "lobby" && (
        <Centered
          title={t("guest.lobbyTitle", "Waiting for the host")}
          body={
            guestName
              ? t("guest.lobbyBodyNamed", "Thanks, {name}. We have told the host you are here. This usually takes a moment.", {
                  name: guestName,
                })
              : t("guest.lobbyBody", "We have told the host you are here. This usually takes a moment.")
          }
        >
          <Dots />
        </Centered>
      )}

      {!over && stage === "admitted" && (
        <Centered
          icon={<CheckCircle size={22} weight="fill" aria-hidden="true" style={{ color: "var(--color-success-600)" }} />}
          title={t("guest.admittedTitle", "You are in")}
          body={t("guest.admittedBody", "The host admitted you. Your microphone is live.")}
        >
          <Button className="mt-4" onClick={leave}>
            {t("guest.leave", "Leave meeting")}
          </Button>
        </Centered>
      )}

      {!over && stage === "left" && (
        <Centered
          title={t("guest.leftTitle", "You left the meeting")}
          body={t("guest.leftBody", "You can close this tab. Nothing was installed and no account was created.")}
        >
          <Button className="mt-4" onClick={() => join(guestName)}>
            {t("guest.rejoin", "Rejoin")}
          </Button>
        </Centered>
      )}

      {!over && stage === "declined" && (
        <Centered
          title={t("guest.declinedTitle", "The host did not let you in this time")}
          body={t("guest.declinedBody", "They may be in a different conversation, or the meeting may have moved. You can ask again, or check with them directly.")}
        >
          <Button className="mt-4" onClick={() => join(guestName)}>
            {t("guest.askAgain", "Ask again")}
          </Button>
        </Centered>
      )}

      {over && (
        <Centered
          title={t("guest.endedTitle", "The meeting has ended")}
          body={t("guest.endedBody", "You can close this tab. Nothing was installed and no account was created.")}
        />
      )}
    </Frame>
  );
}

/** The quiet sign that something is on its way. */
function Dots() {
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="hq-skeleton"
          style={{ width: 6, height: 6, borderRadius: "var(--radius-chip)", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/** The customer's frame. No suite chrome, no vendor logo. */
function Frame({ children, workspace }: { children: React.ReactNode; workspace: string }) {
  const t = useT();
  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ background: "var(--color-ground)" }}>
      <header
        className="flex shrink-0 items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--color-hairline)", background: "var(--color-surface)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex items-center justify-center text-[13px] font-bold"
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              background: "var(--color-accent)",
              color: "var(--color-ink-inverse)",
            }}
          >
            {workspace.slice(0, 1)}
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em]" style={{ color: "var(--color-ink)" }}>
            {workspace}
          </span>
        </div>

        {/* Trust signals a guest actually needs, stated plainly. */}
        <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
          <ShieldCheck size={13} aria-hidden="true" />
          {t("guest.trust", "No account needed. Nothing to install.")}
        </span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>

      <footer className="px-5 py-4 text-center text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
        {t("guest.footer", "Meeting hosted by {workspace}.", { workspace })}
      </footer>
    </div>
  );
}

function Centered({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const bodyId = useId();
  return (
    <div className="flex flex-1 items-center justify-center px-5">
      <div className="max-w-[420px] text-center">
        {icon && <div className="mb-3 flex justify-center">{icon}</div>}
        <h1
          ref={focusOnMount}
          tabIndex={-1}
          aria-describedby={bodyId}
          className="text-[18px] font-semibold tracking-[-0.01em] outline-none"
          style={{ color: "var(--color-ink)" }}
        >
          {title}
        </h1>
        <p id={bodyId} className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
          {body}
        </p>
        {children}
      </div>
    </div>
  );
}
