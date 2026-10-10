"use client";

/**
 * SOMION HQ - INSIGHTS
 *
 * The most legally and ethically loaded surface in the product. Three rules are
 * enforced structurally rather than by policy:
 *
 *   1. Every number describes a group, never a person. The people filter is a
 *      cohort picker: below the workspace minimum the page shows nothing and
 *      says why. The one exception is you - everyone may see their own
 *      numbers, and nobody else can open that view of them.
 *   2. Filters scope everything. One row above the charts; every tile, chart
 *      and table below re-reads against the same period and the same people,
 *      so the numbers always agree with each other.
 *   3. The transparency page is one click from every panel, not buried in
 *      settings.
 *
 * Swiss employment law restricts systems whose purpose is monitoring employee
 * behaviour. Building "just the UI" for individual metrics and adding controls
 * later is how a product ends up on the wrong side of that.
 */

import { useMemo, useState } from "react";
import { DownloadSimple, Info, Table as TableIcon } from "@phosphor-icons/react";
import { Heatmap } from "./Heatmap";
import { MeetingSizes, Utilisation } from "./Analytics";
import { Columns, LinesChart, Meter, RankedBars } from "./Charts";
import { PeopleFilter } from "./PeopleFilter";
import { DateRangePicker, type RangeValue } from "@/components/ui/DateRangePicker";
import { Button, Chip, Panel, SectionHead } from "@/components/ui/Primitives";
import { Stat, StatRow } from "@/components/ui/Stat";
import { ANALYTICS_BOUNDS, useAnalytics, useCan, useChannels, useFloor, useMe, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { ROLE_LABEL } from "@/lib/roles";
import { dayLabel, dayLabels, formatHours, formatTag } from "@/lib/time";
import { MIN_COHORT, type Id } from "@/entities";
import { bucketize, formatRangeLabel, presetRange, previousRange, toCsv, toKey, type LengthBand } from "@/lib/analytics";
import { msgText } from "@/lib/messages";
import { PaginatedTable } from "@orgtik/ui/table";

const LENGTH_LABEL: Record<LengthBand, string> = {
  "15": msgText("insights.length.15", "15 min"),
  "30": msgText("insights.length.30", "30 min"),
  "45": msgText("insights.length.45", "45 min"),
  "60": msgText("insights.length.60", "1 hour"),
  "90+": msgText("insights.length.90", "90 min or more"),
};

export function InsightsView() {
  const can = useCan();
  const role = useWorkspace((s) => s.viewingRole);
  const minCohortSetting = useWorkspace((s) => s.settings.minCohort);
  const notify = useWorkspace((s) => s.notify);
  const me = useMe();
  const users = useUsers();
  const floor = useFloor();
  const channels = useChannels();
  const t = useT();

  const today = toKey(new Date());
  const [period, setPeriod] = useState<RangeValue>(() => ({ preset: "30d", range: presetRange("30d", today) }));
  const [cohort, setCohort] = useState<Id[] | null>(null);
  const [compare, setCompare] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const minCohort = Math.max(MIN_COHORT, minCohortSetting);
  const cohortIds = useMemo(() => cohort ?? users.map((u) => u.id), [cohort, users]);
  const onlyMe = cohortIds.length === 1 && cohortIds[0] === me.id;
  const suppressed = !onlyMe && cohortIds.length < minCohort;

  const agg = useAnalytics(period.range, cohortIds);
  const prev = useAnalytics(previousRange(period.range), cohortIds);
  const mine = useAnalytics(period.range, useMemo(() => [me.id], [me.id]));

  const pct = (now: number, before: number): number | undefined => (before > 0 ? ((now - before) / before) * 100 : undefined);
  const delta = (now: number, before: number) =>
    compare ? { deltaPct: pct(now, before), deltaAgainst: t("insights.previousPeriod", "previous period") } : {};

  const { mode, buckets } = useMemo(() => bucketize(agg.daily), [agg]);
  const prevBuckets = useMemo(() => bucketize(prev.daily).buckets, [prev]);
  const labels = buckets.map((b) => b.label);

  const roomName = (id: string) => floor.rooms.find((r) => r.id === id)?.name ?? id;
  const bookable = new Set(floor.rooms.filter((r) => r.kind !== "desk").map((r) => r.id));
  const roomRows = agg.rooms.filter((r) => bookable.has(r.roomId)).map((r) => ({ id: r.roomId, label: roomName(r.roomId), value: r.hours }));
  const roomHoursUsed = roomRows.reduce((a, r) => a + r.value, 0);

  const channelName = (id: string) =>
    id === "dm" ? t("insights.directMessages", "Direct messages") : `#${channels.find((c) => c.id === id)?.name ?? id}`;
  const channelRows = (() => {
    const top = agg.channels.slice(0, 6).map((c) => ({ id: c.channelId, label: channelName(c.channelId), value: c.messages }));
    const rest = agg.channels.slice(6).reduce((a, c) => a + c.messages, 0);
    return rest > 0 ? [...top, { id: "other", label: t("insights.other", "Other"), value: rest }] : top;
  })();

  const avgActive = agg.workdays > 0 ? agg.daily.filter((d) => d.activePeople > 0).reduce((a, d) => a + d.activePeople, 0) / agg.workdays : 0;
  const utilisation = agg.roomCapacityHours > 0 ? roomHoursUsed / agg.roomCapacityHours : 0;

  const weekdayData = dayLabels().map((day, i) => ({ day, hours: agg.byWeekday.meetingHours[i] ?? 0 }));
  const heat = agg.heat.map((row) => row.map((v) => Math.round(v * 10) / 10));

  const exportMine = () => {
    const blob = new Blob([toCsv(mine.daily)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-time-${period.range.from}_${period.range.to}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t("insights.exportedMine", "Your time is exported"), t("insights.exportedMineBody", "{n} days, yours only. Nothing was sent anywhere.", { n: mine.days }));
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(agg.daily)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `somion-hq-insights-${period.range.from}_${period.range.to}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t("insights.exported", "Exported"), t("insights.exportedBody", "{n} days of team totals as CSV.", { n: agg.days }));
  };

  if (!can.viewInsights) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-[560px] px-5 py-10">
          <Panel>
            <h1 className={"hq-title "+("ch-color-7f7330")} >
              {t("insights.notForRole", "Insights is not part of the {role} role", { role: t(`role.${role}`, ROLE_LABEL[role]) })}
            </h1>
            <p className={"mt-2 text-body-sm leading-relaxed "+("ch-color-4a0211")} >
              {t(
                "insights.notForRoleBody",
                "It describes the team as a whole and is for people who are part of it. A guest is in one meeting and nothing else.",
              )}
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  const hoursFmt = (v: number) => formatHours(v);
  const countFmt = (v: number) => String(Math.round(v));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-baseline gap-2.5">
          <h1 className={"hq-title "+("ch-color-7f7330")} >
            {t("insights.title", "Insights")}
          </h1>
          <span className={"tabular text-body-sm "+("ch-color-4a0211")} >
            {formatRangeLabel(period.range)}
          </span>
        </div>
        <TransparencyLink />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-5">
          {/* One row of filters, above everything they scope. */}
          <div className="flex flex-wrap items-center gap-2 pb-4" role="group" aria-label={t("insights.filters", "Filters")}>
            <DateRangePicker value={period} onChange={setPeriod} today={today} min={ANALYTICS_BOUNDS.from} max={today} />
            <PeopleFilter users={users} me={me.id} value={cohort} onChange={setCohort} minCohort={minCohort} />
            <label className={"flex cursor-pointer items-center gap-2 ps-1 text-body-sm "+("ch-color-7f7330")} >
              <input
                type="checkbox"
                role="switch"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className={"ch-width-7375d5"+' '+"ch-height-30de4a"+' '+"ch-accent-color-e56d5b"}
              />
              {t("insights.compare", "Compare with the period before")}
            </label>
            <span className="ms-auto flex items-center gap-2">
              <Button size="sm" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
                <TableIcon size={13} weight="bold" aria-hidden="true" />
                {showTable ? t("insights.hideTable", "Hide table") : t("insights.tableView", "Table view")}
              </Button>
              {can.manageSettings && !suppressed && (
                <Button size="sm" onClick={exportCsv}>
                  <DownloadSimple size={13} weight="bold" aria-hidden="true" />
                  {t("insights.export", "Export CSV")}
                </Button>
              )}
            </span>
          </div>

          {/* Stated before any number is shown, not as a footnote after. */}
          <p
            className={"mb-5 px-3.5 py-2.5 text-body-sm leading-relaxed "+("ch-background-314b28"+' '+"ch-border-radius-8d459a"+' '+"ch-color-4a0211"+' '+"ch-max-width-d4e2c0")}

          >
            {onlyMe
              ? t("insights.preambleMe", "These are your own numbers. Nobody else can open this view of you, and no manager has an equivalent.")
              : t(
                  "insights.preamble",
                  "Everything here describes the people you picked as a group. There is no view of an individual person, for anyone, including admins. Groups smaller than {n} are not shown at all.",
                  { n: minCohort },
                )}
          </p>

          {suppressed ? (
            <Panel>
              <p className={"text-body-sm leading-relaxed "+("ch-color-7f7330")} >
                {t("insights.tooFewPicked", "{n} people is below the minimum of {min}, so nothing is shown.", { n: cohortIds.length, min: minCohort })}
              </p>
              <p className={"mt-1.5 text-body-sm leading-relaxed "+("ch-color-4a0211")} >
                {t(
                  "insights.tooFewWhy",
                  "With a group this small an average is a person. Add people until the group is at least {min}, or choose Only me to see your own numbers.",
                  { min: minCohort },
                )}
              </p>
            </Panel>
          ) : (
            <div className="flex flex-col gap-5">
              <StatRow>
                <Stat
                  label={onlyMe ? t("insights.kpiMyPresent", "Hours you were here") : t("insights.kpiPresent", "Hours anyone was here")}
                  value={formatHours(agg.presentHours)}
                  {...delta(agg.presentHours, prev.presentHours)}
                  meta={t("insights.overDays", "over {n} days", { n: agg.days })}
                  trend={buckets.map((b) => b.presentHours)}
                />
                <Stat
                  label={t("insights.kpiMeetings", "Hours in meetings")}
                  value={formatHours(agg.meetingHours)}
                  {...delta(agg.meetingHours, prev.meetingHours)}
                  meta={t("insights.ofPresent", "{pct}% of time here", { pct: Math.round(agg.meetingShare * 100) })}
                  trend={buckets.map((b) => b.meetingHours)}
                />
                <Stat
                  label={t("insights.kpiFocus", "Hours in focus")}
                  value={formatHours(agg.focusHours)}
                  {...delta(agg.focusHours, prev.focusHours)}
                  meta={t("insights.ofPresent", "{pct}% of time here", { pct: Math.round(agg.focusShare * 100) })}
                  trend={buckets.map((b) => b.focusHours)}
                />
                <Stat
                  label={t("insights.kpiMessages", "Messages")}
                  value={new Intl.NumberFormat(formatTag()).format(agg.messages)}
                  {...delta(agg.messages, prev.messages)}
                  meta={t("insights.nThreads", "{n} threads", { n: agg.threads })}
                  trend={buckets.map((b) => b.messages)}
                />
              </StatRow>

              <StatRow>
                {onlyMe ? (
                  <Stat
                    size="sm"
                    label={t("insights.kpiDaysHere", "Days you were here")}
                    value={String(agg.daily.filter((d) => d.activePeople > 0).length)}
                    meta={t("insights.ofWorkdays", "of {n} working days", { n: agg.workdays })}
                  />
                ) : (
                  <Stat
                    size="sm"
                    label={t("insights.kpiActive", "People here on a working day")}
                    value={avgActive.toFixed(1)}
                    meta={t("insights.ofPeople", "of {n}", { n: agg.people })}
                  />
                )}
                <Stat
                  size="sm"
                  label={t("insights.kpiMeetingCount", "Meetings")}
                  value={String(agg.meetingCount)}
                  {...delta(agg.meetingCount, prev.meetingCount)}
                  meta={t("insights.avgLength", "{h} on average", { h: formatHours(agg.avgMeetingHours) })}
                />
                {onlyMe ? (
                  <Stat
                    size="sm"
                    label={t("insights.kpiObjectShare", "Threads from the work")}
                    value={`${Math.round(agg.objectShare * 100)}%`}
                    meta={t("insights.objectOf", "{a} of {n} threads", { a: agg.objectThreads, n: agg.threads })}
                  />
                ) : (
                  <Stat
                    size="sm"
                    label={t("insights.kpiUtilisation", "Room utilisation")}
                    value={`${Math.round(utilisation * 100)}%`}
                    meta={t("insights.utilisationOf", "{used} used of {available} available", {
                      used: formatHours(roomHoursUsed),
                      available: formatHours(agg.roomCapacityHours),
                    })}
                  />
                )}
                <Stat
                  size="sm"
                  label={t("insights.kpiKnocks", "Knocks answered")}
                  value={`${Math.round(agg.answerRate * 100)}%`}
                  meta={t("insights.knocksOf", "{a} of {n}", { a: agg.knocksAnswered, n: agg.knocksReceived })}
                />
              </StatRow>

              {/* Responsiveness and adoption: how quickly a mention gets an
                  answer, and whether the workspace is actually in use. */}
              <StatRow>
                <Stat
                  size="sm"
                  label={t("insights.kpiMentionReply", "Replies to mentions")}
                  value={agg.mentionReplyMinutes === null ? "–" : t("insights.minutesShort", "{n} min", { n: Math.round(agg.mentionReplyMinutes) })}
                  {...(prev.mentionReplyMinutes !== null && agg.mentionReplyMinutes !== null ? delta(agg.mentionReplyMinutes, prev.mentionReplyMinutes) : {})}
                  meta={t("insights.mentionsOf", "typical time to the first reply, over {n} mentions", { n: agg.mentionsReceived })}
                />
                <Stat
                  size="sm"
                  label={t("insights.kpiActiveMembers", "Active members")}
                  value={`${agg.people > 0 ? Math.round((agg.activePeople / agg.people) * 100) : 0}%`}
                  meta={t("insights.activeOf", "{a} of {n} were here at least once", { a: agg.activePeople, n: agg.people })}
                />
                <Stat
                  size="sm"
                  label={t("insights.kpiActiveChannels", "Conversations in use")}
                  value={String(agg.activeChannels)}
                  meta={t("insights.channelsOf", "of {n} channels saw a message", { n: channels.filter((c) => c.kind !== "dm" && c.kind !== "group" && !c.archived).length })}
                />
                <Stat
                  size="sm"
                  label={t("insights.kpiGuests", "Client visits")}
                  value={String(agg.guestVisits)}
                  {...delta(agg.guestVisits, prev.guestVisits)}
                  meta={t("insights.guestsMeta", "guests who joined a call by link")}
                />
              </StatRow>

              {/* Two measures, two charts, one axis each. Never a dual axis. */}
              <div className="grid gap-5 lg:grid-cols-2">
                <Panel>
                  <SectionHead
                    title={t("insights.presentTrend", "Hours here")}
                    meta={mode === "week" ? t("insights.byWeek", "by week") : t("insights.byDay", "by day")}
                  />
                  <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                    {t("insights.presentTrendBody", "Time signed in and here, summed across the group.")}
                  </p>
                  <LinesChart
                    labels={labels}
                    format={hoursFmt}
                    ariaLabel={t("insights.presentTrendAlt", "Hours here over the period")}
                    series={[
                      { id: "now", label: t("insights.thisPeriod", "This period"), values: buckets.map((b) => b.presentHours), tone: "accent" },
                      ...(compare
                        ? [{ id: "prev", label: t("insights.previousPeriod", "previous period"), values: prevBuckets.map((b) => b.presentHours), tone: "muted" as const }]
                        : []),
                    ]}
                  />
                </Panel>
                <Panel>
                  <SectionHead
                    title={t("insights.meetingTrend", "Hours in meetings")}
                    meta={mode === "week" ? t("insights.byWeek", "by week") : t("insights.byDay", "by day")}
                  />
                  <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                    {t("insights.meetingTrendBody", "Meeting time on the calendar, for meetings this group took part in.")}
                  </p>
                  <LinesChart
                    labels={labels}
                    format={hoursFmt}
                    ariaLabel={t("insights.meetingTrendAlt", "Hours in meetings over the period")}
                    series={[
                      { id: "now", label: t("insights.thisPeriod", "This period"), values: buckets.map((b) => b.meetingHours), tone: "accent" },
                      ...(compare
                        ? [{ id: "prev", label: t("insights.previousPeriod", "previous period"), values: prevBuckets.map((b) => b.meetingHours), tone: "muted" as const }]
                        : []),
                    ]}
                  />
                </Panel>
              </div>

              <Panel>
                <Heatmap
                  grid={heat}
                  cohortSize={agg.people}
                  {...(onlyMe
                    ? {
                        title: t("insights.myRhythm", "When you are around"),
                        body: t("insights.myRhythmBody", "How much of each hour of the week you were here, on average."),
                      }
                    : {})}
                />
                <p className={"mt-2 text-caption "+("ch-color-4a0211")} >
                  {onlyMe
                    ? t("insights.heatNoteMe", "Averaged across the period. Your busiest hour: {day} at {hour}:00.", {
                        day: dayLabel(agg.peak.day),
                        hour: String(agg.peak.hour).padStart(2, "0"),
                      })
                    : t("insights.heatNote", "Average people here for each hour of the week across the period. Busiest: {day} at {hour}:00, {n} people.", {
                        day: dayLabel(agg.peak.day),
                        hour: String(agg.peak.hour).padStart(2, "0"),
                        n: Math.round(agg.peak.headcount * 10) / 10,
                      })}
                </p>
              </Panel>

              <div className="grid gap-5 lg:grid-cols-2">
                <Panel>
                  <SectionHead title={t("insights.byWeekday", "Meetings by weekday")} meta={formatHours(agg.meetingHours)} />
                  <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                    {t("insights.byWeekdayBody", "Where in the week the meeting load lands.")}
                  </p>
                  <Columns
                    data={weekdayData.map((d) => ({ label: d.day, value: d.hours }))}
                    format={hoursFmt}
                    ariaLabel={t("insights.byWeekdayAlt", "Hours in meetings by weekday")}
                  />
                </Panel>
                <MeetingSizes sizes={agg.sizes} />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Panel>
                  <SectionHead title={t("insights.lengths", "How long they ran")} meta={t("insights.nMeetings", "{n} meetings", { n: agg.meetingCount })} />
                  <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                    {t("insights.lengthsBody", "Hours spent, by how long each meeting was booked for.")}
                  </p>
                  <RankedBars
                    rows={agg.lengths.map((l) => ({ id: l.band, label: t(`insights.length.${l.band === "90+" ? "90" : l.band}`, LENGTH_LABEL[l.band]), value: l.hours, meta: String(l.count) }))}
                    format={hoursFmt}
                  />
                </Panel>
                <Utilisation used={roomHoursUsed} available={agg.roomCapacityHours} rooms={roomRows.map((r) => ({ room: r.label, hours: r.value }))} />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Panel>
                  <SectionHead title={t("insights.channels", "Where the conversation happens")} meta={new Intl.NumberFormat(formatTag()).format(agg.messages)} />
                  <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                    {t("insights.channelsBody", "Messages by channel. Direct messages are one bar, never named pairs.")}
                  </p>
                  <RankedBars rows={channelRows} format={countFmt} />
                </Panel>
                <Panel>
                  <SectionHead title={t("insights.fromTheWork", "Started from the work")} />
                  <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                    {t("insights.fromTheWorkBody", "The product's promise is that conversations attach to the work. These two say whether that is happening.")}
                  </p>
                  <div className="flex flex-col gap-4">
                    <Meter
                      label={t("insights.objectShare", "Threads started from a Business OS object")}
                      value={agg.objectShare}
                      target={0.3}
                      caption={t("insights.objectShareCaption", "{a} of {n} threads. The line marks the 30% the product is aiming for.", {
                        a: agg.objectThreads,
                        n: agg.threads,
                      })}
                    />
                    <Meter
                      label={t("insights.answerRate", "Knocks that got an answer")}
                      value={agg.answerRate}
                      caption={t("insights.answerRateCaption", "Accepted, declined or deferred all count; only silence does not.")}
                    />
                  </div>
                </Panel>
              </div>

              <Panel>
                <SectionHead title={t("insights.roomUse", "Room use")} meta={formatHours(roomHoursUsed)} />
                <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                  {t("insights.roomUseBody2", "Hours each room was occupied over the period, meetings and quiet work alike.")}
                </p>
                <RankedBars rows={roomRows} format={hoursFmt} emphasis={roomRows[0]?.id} />
              </Panel>

              {showTable && (
                <Panel>
                  <SectionHead title={t("insights.tableTitle", "Every day in the period")} meta={t("insights.nDays", "{n} days", { n: agg.days })} />
                  <div className={"max-h-[380px] overflow-auto "+("ch-border-radius-332348")} >
                    <PaginatedTable resetKey={`${period.range.from}/${period.range.to}/${cohortIds.join(",")}`}><table className={"w-full text-body-sm "+("ch-border-collapse-454826")} >
                      <thead>
                        <tr className={"ch-position-b00353"+' '+"ch-top-0d4406"+' '+"ch-background-751d03"} >
                          {[
                            t("insights.colDate", "Date"),
                            t("insights.colPeople", "People here"),
                            t("insights.colHours", "Hours here"),
                            t("insights.colMeetings", "Meetings"),
                            t("insights.colMeetingHours", "Meeting hours"),
                            t("insights.colFocus", "Focus hours"),
                            t("insights.colMessages", "Messages"),
                          ].map((h, i) => (
                            <th
                              key={h}
                              scope="col"
                              className={(`py-2 pe-3 font-semibold ${i === 0 ? "text-start" : "text-end"}`)+" "+("ch-color-094083"+' '+"ch-border-bottom-9cb2f4")}

                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="tabular">
                        {agg.daily.map((d) => (
                          <tr key={d.date} className={"ch-border-bottom-9cb2f4"} >
                            <td className={"py-1.5 pe-3 "+("ch-color-7f7330")} >
                              {d.date}
                            </td>
                            <td className={"py-1.5 pe-3 text-end "+("ch-color-4a0211")} >
                              {d.activePeople}
                            </td>
                            <td className={"py-1.5 pe-3 text-end "+("ch-color-4a0211")} >
                              {d.presentHours.toFixed(1)}
                            </td>
                            <td className={"py-1.5 pe-3 text-end "+("ch-color-4a0211")} >
                              {d.meetingCount}
                            </td>
                            <td className={"py-1.5 pe-3 text-end "+("ch-color-4a0211")} >
                              {d.meetingHours.toFixed(1)}
                            </td>
                            <td className={"py-1.5 pe-3 text-end "+("ch-color-4a0211")} >
                              {d.focusHours.toFixed(1)}
                            </td>
                            <td className={"py-1.5 pe-3 text-end "+("ch-color-4a0211")} >
                              {d.messages}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></PaginatedTable>
                  </div>
                </Panel>
              )}

              {!onlyMe && (
                <Panel>
                  <SectionHead title={t("insights.myTime", "My time")} meta={t("insights.onlyYou", "only you can see this")} />
                  <p className={"pb-3 text-caption "+("ch-color-4a0211")} >
                    {t("insights.myTimeBody2", "Your own numbers for the same period. Nobody else can open this view of you, and no manager has an equivalent.")}
                  </p>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Chip>{t("insights.myPresent", "{h} here", { h: formatHours(mine.presentHours) })}</Chip>
                    <Chip>{t("insights.myMeetings", "{h} in meetings", { h: formatHours(mine.meetingPersonHours) })}</Chip>
                    <Chip>{t("insights.myFocus", "{h} in focus", { h: formatHours(mine.focusHours) })}</Chip>
                    {/* The optional feed into the HR module's time records: the
                        person's own, exported by the person. */}
                    <Button size="sm" variant="ghost" className="ms-auto" onClick={exportMine}>
                      <DownloadSimple size={13} weight="bold" aria-hidden="true" />
                      {t("insights.exportMine", "Export my time")}
                    </Button>
                  </div>
                  <LinesChart
                    labels={labels}
                    format={hoursFmt}
                    ariaLabel={t("insights.myTrendAlt", "Your hours here over the period")}
                    height={150}
                    series={[{ id: "me", label: t("insights.you", "You"), values: bucketize(mine.daily).buckets.map((b) => b.presentHours), tone: "accent" }]}
                  />
                </Panel>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TransparencyLink() {
  const t = useT();
  return (
    <Button size="sm" href="/hq/insights/transparency">
      <Info size={13} weight="bold" aria-hidden="true" />
      {t("insights.whatWeCollect", "What do we collect?")}
    </Button>
  );
}
