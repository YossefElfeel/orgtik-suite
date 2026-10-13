"use client";

/**
 * SOMION HQ - POST-MEETING
 *
 * What the meeting left behind, shown on the meeting's own page once the call
 * has ended. The premise of the whole product is that a conversation belongs to
 * the thing it is about, and a meeting is the sharpest case: the half hour is
 * over, and what has to survive it is who was there, what was recorded, what
 * was said, and what somebody now has to do.
 *
 * Deliberately not a "meeting minutes" feature. There is no summarisation and
 * no transcript, because inventing either would be claiming something the
 * product cannot do.
 */

import {RecordingReference} from "./RecordingReference";
import { useState } from "react";
import {
  ArrowRight,
  CheckSquare,
  ChatCircle,
  FileVideo,
  Users as UsersIcon,
} from "@phosphor-icons/react";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button, Chip, Panel } from "@/components/ui/Primitives";
import { useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatDuration, formatShortDay, formatTime } from "@/lib/time";
import type { Meeting } from "@/entities";

export function MeetingSummary({ meeting }: { meeting: Meeting }) {
  const users = useUsers();
  const ensureMeetingChannel = useWorkspace((s) => s.ensureMeetingChannel);
  const t = useT();
  const [openedChannel, setOpenedChannel] = useState<string | null>(meeting.channelId ?? null);

  if (!meeting.endedAt) return null;

  const attended = (meeting.attendedIds ?? meeting.participantIds)
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const invitedCount = meeting.participantIds.length;
  const missing = invitedCount - attended.length;

  const ranSeconds = Math.max(
    0,
    Math.round((new Date(meeting.endedAt).getTime() - new Date(meeting.startsAt).getTime()) / 1000),
  );

  /* A guest who left before the end still came. */
  const guests = meeting.guests.filter((g) => g.state === "admitted" || g.state === "left");

  return (
    <Panel className="mb-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={"hq-title "+("ch-color-var---color-ink")} >
          {t("meetings.afterTitle", "After the meeting")}
        </h2>
        <span className={"tabular text-caption "+("ch-color-var---color-ink-subtle")} >
          {t("meetings.endedAt", "Ended {time}, {day}", {
            time: formatTime(meeting.endedAt),
            day: formatShortDay(meeting.endedAt),
          })}
        </span>
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<UsersIcon size={14} aria-hidden="true" />}
          label={t("meetings.whoCame", "Who came")}
        >
          <span className="flex flex-wrap items-center gap-2">
            <AvatarStack people={attended} size={20} max={5} />
            <span className={"tabular text-body-sm "+("ch-color-var---color-ink")} >
              {t("meetings.ofInvited", "{n} of {total}", { n: attended.length, total: invitedCount })}
            </span>
          </span>
          {/* Who did not come is said plainly rather than left to arithmetic,
              but nobody is named: an absence is not a performance record. */}
          {missing > 0 && (
            <span className={"mt-1 block text-caption "+("ch-color-var---color-ink-subtle")} >
              {t("meetings.didNotJoin", "{n} invited did not join", { n: missing })}
            </span>
          )}
          {guests.length > 0 && (
            <span className={"mt-1 block text-caption "+("ch-color-var---color-ink-subtle")} >
              {t("meetings.plusGuests", "plus {n} guest", { n: guests.length })}
            </span>
          )}
        </Stat>

        <Stat
          icon={<ChatCircle size={14} aria-hidden="true" />}
          label={t("meetings.ranFor", "Ran for")}
        >
          <span className={"tabular text-body-sm "+("ch-color-var---color-ink")} >
            {formatDuration(ranSeconds)}
          </span>
        </Stat>

        <Stat
          icon={<FileVideo size={14} aria-hidden="true" />}
          label={t("meetings.recording", "Recording")}
        >
          <RecordingState meeting={meeting} />
        </Stat>
      </dl>

      <div className={"mt-5 flex flex-wrap gap-2 "+("ch-border-top-1px-solid-var---color-hairline"+' '+"ch-padding-top-16px")} >
        {/* The two things that actually carry a meeting forward. Both go to
            somewhere that already exists rather than opening a notes field
            nobody returns to. */}
        <Button
          variant="primary"
          size="sm"
          {...(openedChannel
            ? { href: `/hq/chat/${openedChannel}` }
            : { onClick: () => setOpenedChannel(ensureMeetingChannel(meeting.id)) })}
        >
          <ChatCircle size={13} aria-hidden="true" />
          {openedChannel
            ? t("meetings.openConversation", "Open the conversation")
            : t("meetings.startConversation", "Start a conversation about it")}
          <ArrowRight size={12} weight="bold" aria-hidden="true" />
        </Button>

        <Button size="sm" href="/tasks/t-4471">
          <CheckSquare size={13} aria-hidden="true" />
          {t("meetings.turnIntoTask", "Turn a decision into a task")}
        </Button>
      </div>
    </Panel>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt
        className={"flex items-center gap-1.5 text-caption font-medium "+("ch-color-var---color-ink-subtle")}

      >
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}

/** Each recording state says what it means for the person reading it. */
function RecordingState({ meeting }: { meeting: Meeting }) {
  const t = useT();
  const state = meeting.recordingState ?? "none";

  if(state==="ready"||state==="processing")return <RecordingReference meeting={meeting}/>;
  if (state === "declined") {
    return (
      <span className={"text-body-sm "+("ch-color-var---color-ink-muted")} >
        {t("meetings.recordingDeclined", "Not recorded. Someone declined.")}
      </span>
    );
  }

  return (
    <span className={"text-body-sm "+("ch-color-var---color-ink-muted")} >
      {t("meetings.notRecorded", "Not recorded.")}
    </span>
  );
}
