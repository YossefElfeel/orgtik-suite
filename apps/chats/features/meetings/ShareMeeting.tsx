"use client";

/**
 * SOMION HQ - SHARING A MEETING
 *
 * One link per meeting, for the people outside the workspace. Whoever opens it
 * gives a name and, unless the lobby is off, waits until someone in the call
 * lets them in. Colleagues never need it: they join from HQ itself, from the
 * meeting list or from the card a meeting leaves in its conversation.
 *
 * Copying is one click, and where the device has a share sheet the link hands
 * over to it, so a phone sends the link the way it sends everything else.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowsClockwise, Check, Copy, Link as LinkIcon, ShareNetwork, VideoCamera, X } from "@phosphor-icons/react";
import { ConfirmDialog } from "@orgtik/ui";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Primitives";
import { useCan, useMeeting, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatTime } from "@/lib/time";
import type { Meeting } from "@/entities";

/**
 * The meeting's link, and whether this device can hand it to a share sheet.
 * Both exist only in the browser, so they resolve after mount and the server
 * and the client never disagree about the first render.
 */
function useMeetingLink(guestKey: string | undefined) {
  const workspace=useWorkspace(s=>s.workspaceId);
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
  }, []);
  return { link: origin && guestKey ? `${origin}/guest/${guestKey}?workspace=${encodeURIComponent(workspace)}` : "", canShare };
}

/** What happens to someone who opens the link, under the workspace's lobby setting. */
export function useLinkPolicy(): string {
  const lobby = useWorkspace((s) => s.settings.lobby);
  const t = useT();
  return lobby === "auto"
    ? t("meetings.linkOpen", "They need no account, and they join straight away.")
    : t("meetings.linkLobby", "They need no account, and they wait in the lobby until someone in the call lets them in.");
}

/** The link itself, with copy, the device's share sheet, and optionally a preview. */
export function MeetingLinkRow({
  meeting,
  preview = false,
  focusCopy = false,
}: {
  meeting: Meeting;
  preview?: boolean;
  /** Put focus on Copy link as soon as the row appears. */
  focusCopy?: boolean;
}) {
  const t = useT();
  const { link, canShare } = useMeetingLink(meeting.guestKey);
  const can = useCan();
  const resetGuestLink = useWorkspace((s) => s.resetGuestLink);
  const [copied, setCopied] = useState<"idle" | "done" | "blocked">("idle");
  const fieldRef = useRef<HTMLInputElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const blockedHint = t("meetings.copyBlocked", "This browser blocked copying. The link is selected: press Ctrl+C or Cmd+C.");

  /* Copy stays disabled until the link resolves, and a disabled button cannot
     take focus, so this waits for the link. */
  useEffect(() => {
    if (focusCopy && link) copyRef.current?.focus();
  }, [focusCopy, link]);

  useEffect(() => {
    if (copied !== "done") return;
    const id = setTimeout(() => setCopied("idle"), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("done");
    } catch {
      /* A blocked clipboard is not a dead end: the whole link is selected
         instead, ready to copy by hand. */
      fieldRef.current?.focus();
      fieldRef.current?.select();
      setCopied("blocked");
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: meeting.title,
        text: t("meetings.shareText", "Join {title}", { title: meeting.title }),
        url: link,
      });
    } catch {
      /* Closing the share sheet is a choice, not an error. */
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {!meeting.guestKey&&can.inviteGuests?<Button size="sm" onClick={()=>resetGuestLink(meeting.id)}>{t("v3.generateGuestLink","Generate guest link")}</Button>:null}
      <div className="flex flex-wrap items-center gap-2">
        {/* A field, not a label: what is shown is exactly what is copied, and
            a click selects all of it for copying by hand. */}
        <input
          ref={fieldRef}
          readOnly
          value={link}
          aria-label={t("meetings.meetingLink", "Meeting link")}
          onFocus={(e) => e.currentTarget.select()}
          className={"min-w-0 flex-1 basis-[220px] px-2.5 py-2 text-caption "+("ch-background-314b28"+' '+"ch-border-52e799"+' '+"ch-border-radius-332348"+' '+"ch-color-7f7330"+' '+"ch-font-family-84a226"+' '+"ch-text-overflow-2bf148")}
          
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button ref={copyRef} size="sm" variant="primary" onClick={() => void copy()} disabled={!link}>
            {copied === "done" ? (
              <Check size={13} weight="bold" aria-hidden="true" />
            ) : (
              <Copy size={13} aria-hidden="true" />
            )}
            {copied === "done" ? t("meetings.copied", "Copied") : t("meetings.copyLink", "Copy link")}
          </Button>
          {canShare && (
            <Button size="sm" onClick={() => void share()} disabled={!link}>
              <ShareNetwork size={13} aria-hidden="true" />
              {t("meetings.share", "Share")}
            </Button>
          )}
          {/* A link that went too far can be replaced: the old one stops working at once (CHT-005). */}
          {can.inviteGuests && (
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="ghost">
                  <ArrowsClockwise size={12} aria-hidden="true" />
                  {t("meetings.resetLink", "Reset link")}
                </Button>
              }
              title={t("meetings.resetTitle", "Reset the guest link?")}
              impact={t("meetings.resetImpact", "The current link stops working for anyone who has it. Current link visits end. Share the new link with whoever should still join.")}
              confirmLabel={t("meetings.resetConfirm", "Reset link")}
              tone="primary"
              onConfirm={() => resetGuestLink(meeting.id)}
            />
          )}
          {preview && (
            <Button size="sm" variant="ghost" href={`/guest/${meeting.guestKey ?? ""}`}>
              <LinkIcon size={12} aria-hidden="true" />
              {t("meetings.preview", "Preview")}
            </Button>
          )}
        </div>
      </div>
      {/* Present from the start, so the change is announced when it comes. */}
      <span role="status" className="sr-only">
        {copied === "done" ? t("meetings.linkCopied", "Link copied") : copied === "blocked" ? blockedHint : ""}
      </span>
      {copied === "blocked" && (
        <p aria-hidden="true" className={"text-caption "+("ch-color-4a0211")} >
          {blockedHint}
        </p>
      )}
    </div>
  );
}

/**
 * The invitation inside a call. It opens by itself when you are alone in a
 * meeting you just started, because inviting someone is the only thing to do
 * in it, and from the dock at any other time.
 */
export function InviteCard({
  id,
  meeting,
  ready,
  focusCopy,
  onClose,
}: {
  id: string;
  meeting: Meeting;
  ready: boolean;
  /** Opened on purpose, so focus goes straight to the thing to do. */
  focusCopy: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const policy = useLinkPolicy();

  return (
    <section
      id={id}
      aria-labelledby="invite-card-title"
      /* Escape closes it from inside only: a key meant for the call's chat or
         a dialog above it is not this card's to take. */
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      className={"hq-rise absolute bottom-3 start-3 z-20 flex w-[min(400px,calc(100%-24px))] flex-col gap-3 p-4 "+("ch-background-751d03"+' '+"ch-border-5065d4"+' '+"ch-border-radius-8d459a"+' '+"ch-box-shadow-3d74b9")}
      
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="invite-card-title" className={"text-body-sm font-semibold "+("ch-color-7f7330")} >
            {ready ? t("call.readyTitle", "Your meeting is ready") : t("call.inviteTitle", "Invite people")}
          </h2>
          <p className={"mt-1 text-body-sm leading-relaxed "+("ch-color-4a0211"+' '+"ch-max-width-91a84c")} >
            {ready
              ? t("call.readyBody", "Send this link to whoever should be in it.")
              : t("call.inviteBody", "Send this link to anyone you want in the call.")}{" "}
            {policy}
          </p>
        </div>
        <Button variant="ghost" size="sm" iconOnly label={t("common.close", "Close")} onClick={onClose}>
          <X size={13} weight="bold" aria-hidden="true" />
        </Button>
      </div>
      <MeetingLinkRow meeting={meeting} focusCopy={focusCopy} />
    </section>
  );
}

/**
 * A meeting in a transcript: the message a conversation gets when a meeting
 * is started from it. Live, it is the way in; over, it is the way to what the
 * call left behind. The card itself stays neutral in both: the brand is not a
 * status, so "live" is said by the line and by Join, the one accent here.
 */
export function MeetingMessageCard({ meetingId }: { meetingId: string }) {
  const meeting = useMeeting(meetingId);
  const users = useUsers();
  const t = useT();
  const live = Boolean(meeting && !meeting.endedAt);
  const people = (meeting?.participantIds ?? [])
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  let status = t("meetings.goneBody", "It may have been cancelled.");
  if (meeting?.endedAt) {
    const minutes = Math.max(1, Math.round((Date.parse(meeting.endedAt) - Date.parse(meeting.startsAt)) / 60_000));
    status = t("meetings.endedAfter", "Ended {time}, after {n} min", { time: formatTime(meeting.endedAt), n: minutes });
  } else if (meeting) {
    status = t("meetings.startedAt", "Started {time}", { time: formatTime(meeting.startsAt) });
  }

  return (
    <div
      className={"mt-1.5 flex max-w-[480px] items-center gap-3 px-3 py-2.5 "+("ch-border-5065d4"+' '+"ch-border-radius-332348"+' '+"ch-background-751d03")}
      
    >
      <span
        aria-hidden="true"
        className={"flex shrink-0 items-center justify-center "+("ch-width-82b9d8"+' '+"ch-height-268b76"+' '+"ch-border-radius-332348"+' '+"ch-background-314b28"+' '+"ch-color-4a0211")}
        
      >
        <VideoCamera size={16} weight={live ? "fill" : "regular"} />
      </span>
      <span className="min-w-0 flex-1">
        {meeting ? (
          <Link
            href={`/hq/meetings/${meeting.id}`}
            className={"block truncate text-body-sm font-medium "+("ch-color-7f7330"+' '+"ch-text-decoration-80d654")}
            
          >
            <bdi>{meeting.title}</bdi>
          </Link>
        ) : (
          <span className={"block truncate text-body-sm font-medium "+("ch-color-7f7330")} >
            {t("meetings.gone", "This meeting is not here")}
          </span>
        )}
        <span className={"tabular block truncate text-caption "+("ch-color-4a0211")} >
          {status}
        </span>
      </span>
      {people.length > 0 && (
        <span className="hidden shrink-0 sm:inline-flex">
          <AvatarStack people={people} size={20} max={3} />
        </span>
      )}
      {meeting && live && (
        <Button variant="primary" size="sm" href={`/hq/meetings/${meeting.id}/call`}>
          <VideoCamera size={13} weight="fill" aria-hidden="true" />
          {t("meetings.join", "Join")}
        </Button>
      )}
      {meeting && !live && (
        <Button size="sm" href={`/hq/meetings/${meeting.id}`}>
          {t("meetings.open", "Open")}
        </Button>
      )}
    </div>
  );
}
