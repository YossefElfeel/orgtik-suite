"use client";

/**
 * SOMION HQ - CALL SCREEN
 *
 * A member's way into a call. The pre-join comes first for everyone, not
 * only guests: the device check is the point of it, and joining a client
 * call with a dead microphone is the failure it prevents.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CallStage } from "./CallStage";
import { PreJoin } from "./PreJoin";
import { useMeeting } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { Button, EmptyState } from "@/components/ui/Primitives";
import { useT } from "@/lib/i18n";
import { formatRange, formatTime } from "@/lib/time";
import { useTitle } from "@/lib/useTitle";

export function CallScreen({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const meeting = useMeeting(meetingId);
  useTitle(meeting?.title);
  const t = useT();
  const [joined, setJoined] = useState<{ mic: boolean; camera: boolean } | null>(null);
  const ended = useWorkspace((s) => s.pastMeetings.some((m) => m.id === meetingId));

  /* Nothing to check devices for: say so first, not after "Join now" (CHT-010, CHT-035). */
  if (!meeting) {
    return (
      <EmptyState
        title={ended ? t("meetings.endedTitle", "This meeting has ended") : t("meetings.gone", "This meeting is not here")}
        body={
          ended
            ? t("meetings.endedBody", "Its notes and anything shared in it stay with the meeting.")
            : t("meetings.missingBody", "The link may be old, or the meeting may have been cancelled.")
        }
        action={
          <Button size="sm" href={ended ? `/hq/meetings/${meetingId}` : "/hq/meetings"}>
            {ended ? t("meetings.openMeeting", "Open the meeting") : t("meetings.back", "Back to meetings")}
          </Button>
        }
      />
    );
  }

  if (!joined) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PreJoin
          title={meeting?.title ?? t("call.title", "Meeting")}
          {...(meeting
            ? {
                subtitle: meeting.instant
                  ? t("call.startedAt", "Started {time}", { time: formatTime(meeting.startsAt) })
                  : formatRange(meeting.startsAt, meeting.endsAt),
              }
            : {})}
          recordingNotice={Boolean(meeting?.recordingState && meeting.recordingState !== "none")}
          onJoin={(_name, devices) => setJoined(devices ?? { mic: true, camera: false })}
          joinLabel={t("call.joinNow", "Join now")}
        />
      </div>
    );
  }

  return (
    <CallStage
      meetingId={meetingId}
      startMuted={!joined.mic}
      startCamera={joined.camera}
      onLeave={() => router.push(`/hq/meetings/${meetingId}`)}
    />
  );
}
