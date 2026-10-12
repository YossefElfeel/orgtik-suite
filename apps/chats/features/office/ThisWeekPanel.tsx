"use client";

/**
 * SOMION HQ - THIS WEEK
 *
 * The lightest possible insights surface, collapsed by default so it never
 * competes with the floor. Three team-level numbers and a link to the page that
 * explains exactly what is collected.
 *
 * Team level only. There is no per-person breakdown here and no way to reach
 * one, because the product's position is that presence is not surveillance.
 */

import { useState } from "react";
import Link from "next/link";
import { CaretDown, Info } from "@phosphor-icons/react";
import { useInsight, useFloor } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { formatHours } from "@/lib/time";
import { MIN_COHORT } from "@/entities";

export function ThisWeekPanel() {
  const insight = useInsight();
  const floor = useFloor();
  const [open, setOpen] = useState(false);
  const t = useT();

  const suppressed = insight.cohortSize < MIN_COHORT;

  const totalMeetingHours = insight.meetingHoursByDay.reduce((a, b) => a + b, 0);
  const busiestRoom = [...insight.roomUsage].sort((a, b) => b.hours - a.hours)[0];
  const busiestRoomName = floor.rooms.find((r) => r.id === busiestRoom?.roomId)?.name ?? "-";
  const peakPresence = Math.max(...insight.presenceHoursByHour.flat());

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={"hq-btn flex items-center gap-1.5 px-2.5 "+("ch-min-height-4f3317"+' '+"ch-font-size-ba0694"+' '+"ch-font-weight-02a2d3"+' '+"ch-color-4a0211"+' '+"ch-border-8ff264"+' '+"ch-border-radius-332348"+' '+"ch-background-751d03")}

      >
        <span>{t("insights.thisWeek", "This week")}</span>
        <CaretDown
          size={12}
          weight="bold"
          aria-hidden="true"
          className={"ch-color-094083"+' '+(open?"ch-transform-6e88a8":"ch-transform-e48099")+' '+"ch-transition-25ab2b"}
        />
      </button>

      {open && (
        <div
          className={"hq-floating hq-rise absolute end-0 z-50 mt-2 w-[236px] px-3 pb-3 pt-3 "+("ch-border-radius-8d459a")}

        >
          {suppressed ? (
            <p className={"text-caption "+("ch-color-4a0211")} >
              {t("insights.tooFew", "Not enough members to show team numbers. At least {n} are needed.", {
                n: MIN_COHORT,
              })}
            </p>
          ) : (
            <dl className="flex flex-col gap-2.5">
              <Stat label={t("insights.meetingHours", "Meeting hours")} value={formatHours(totalMeetingHours)} />
              <Stat label={t("insights.busiestRoom", "Most used room")} value={busiestRoomName} />
              <Stat
                label={t("insights.peak", "Most people at once")}
                value={t("insights.peopleCount", "{n} people", { n: peakPresence })}
              />
            </dl>
          )}

          {/* The transparency link is present on every surface that shows a
              number about people. It is not buried in settings. */}
          <Link
            href="/hq/insights/transparency"
            className={"mt-3 inline-flex items-center gap-1.5 text-caption font-medium "+("ch-color-55f463")}

          >
            <Info size={12} weight="bold" aria-hidden="true" />
            {t("insights.whatWeCollect", "What do we collect?")}
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className={"text-caption "+("ch-color-4a0211")} >
        {label}
      </dt>
      <dd className={"tabular text-body-sm font-semibold "+("ch-color-7f7330")} >
        {value}
      </dd>
    </div>
  );
}
