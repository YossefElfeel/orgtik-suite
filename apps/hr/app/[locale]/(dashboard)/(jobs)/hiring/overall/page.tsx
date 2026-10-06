"use client";
import { ClipboardText as ClipboardTextGlyph, UsersThree as UsersThreeGlyph, FileText as FileTextGlyph, UserMinus as UserMinusGlyph, UserCheck as UserCheckGlyph } from "@phosphor-icons/react";
import { PlusCircle as PlusCircleIcon } from "@phosphor-icons/react";

import MainHeader from "@/components/layout/MainHeader";
import AddJobSheet from "@/components/pages/hiring/AddJobSheet";
import InterviewSchedule, {
  type InterviewScheduleEvent,
} from "@/components/pages/hiring/InterviewSchedule";
import { DashboardMetricCard } from "@/components/shared/DashboardMetricCard";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import {
  useGetInterviewCalendarQuery,
  useGetJobOverviewQuery,
} from "@/redux/features/job/jobApi";
import { useFormatter, useTranslations } from "next-intl";

export default function HiringOverallPage() {
  const t = useTranslations("jobs");
  const format = useFormatter();
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const {
    data: jobOverview,
    isLoading,
    isFetching,
  } = useGetJobOverviewQuery({
    period: view,
  });
  const {
    data: interviewCalendar,
    isLoading: isInterviewsLoading,
    isFetching: isInterviewsFetching,
  } = useGetInterviewCalendarQuery({
    period: view,
  });
  const overviewData = jobOverview?.data;
  const interviewEvents: InterviewScheduleEvent[] = useMemo(() => {
    const calendarData = interviewCalendar?.data;
    if (!Array.isArray(calendarData)) return [];

    return calendarData.map((item) => {
      const start = new Date(item.startAt);
      const end = new Date(item.endAt);

      return {
        id: String(item.id),
        title: t("hiringOverall.interview"),
        interviewer: item.interviewWith ? <bdi>{item.interviewWith}</bdi> : t("common.na"),
        start,
        end,
        timeLabel: `${format.dateTime(start, { timeStyle: "short" })} - ${format.dateTime(end, { timeStyle: "short" })}`,
        linkLabel: t("hiringOverall.interviewLink"),
        meetingLabel: item.note ? (
          <span dir="auto">{item.note}</span>
        ) : item.interviewLink ? (
          <bdi>{item.interviewLink}</bdi>
        ) : (
          t("hiringOverall.noDetailsProvided")
        ),
      };
    });
  }, [interviewCalendar?.data, t, format]);
  const isInterviewsPending = isInterviewsLoading || isInterviewsFetching;
  const interviewInitialDate = interviewEvents[0]?.start ?? new Date();

  const metrics = [
    {
      title: t("hiringOverall.metrics.totalOpenJobs"),
      value: overviewData?.openJobs?.count,
      trend: overviewData?.openJobs?.percentageChange,
      icon: <ClipboardTextGlyph weight="fill" />,
      iconBgClassName: "bg-action-primary",
    },
    {
      title: t("hiringOverall.metrics.totalApplicants"),
      value: overviewData?.totalApplications?.count,
      trend: overviewData?.totalApplications?.percentageChange || 0,
      icon: <UsersThreeGlyph weight="fill" />,
      iconBgClassName: "bg-warning-solid",
    },
    {
      title: t("hiringOverall.metrics.totalReviews"),
      value: overviewData?.totalInterviews?.count,
      trend: overviewData?.totalInterviews?.percentageChange,
      icon: <FileTextGlyph weight="fill" />,
      iconBgClassName: "bg-info-solid",
    },
    {
      title: t("hiringOverall.metrics.rejected"),
      value: overviewData?.rejected?.count,
      trend: overviewData?.rejected?.percentageChange,
      icon: <UserMinusGlyph weight="fill" />,
      iconBgClassName: "bg-danger-solid",
    },
    {
      title: t("hiringOverall.metrics.accepted"),
      value: overviewData?.accepted?.count,
      trend: overviewData?.accepted?.percentageChange,
      icon: <UserCheckGlyph weight="fill" />,
      iconBgClassName: "bg-success-solid",
    },
  ];

  return (
    <main className="bg-background">
      <MainHeader
        title={t("hiringOverall.title")}
        children={
          <AddJobSheet
            trigger={
              <Button type="button" size="lg">
                <PlusCircleIcon  className="size-4" weight="fill" aria-hidden="true" />
                {t("common.createJob")}
              </Button>
            }
          />
        }
      />

      <section className="main-padding">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {isLoading || isFetching
            ? Array.from({ length: 5 }).map((_, index) => (
                <article
                  key={`metric-skeleton-${index}`}
                  className="w-full animate-pulse rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 shrink-0 rounded-full bg-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="h-5 w-28 rounded bg-muted" />
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-9 w-20 rounded bg-muted" />
                        <div className="h-4 w-12 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 h-4 w-24 rounded bg-muted" />
                </article>
              ))
            : metrics.map((metric) => (
                <DashboardMetricCard
                  key={metric.title}
                  title={metric.title}
                  value={`${metric.value ?? 0}`}
                  trend={`${metric.trend ?? 0}%`}
                  subtitle={t("hiringOverall.forLast", { view: t(`hiringOverall.views.${view}`) })}
                  icon={
                    <span aria-hidden="true" className="text-[20px] leading-none text-primary-foreground">{metric.icon}</span>
                  }
                  iconBgClassName={metric.iconBgClassName}
                />
              ))}
        </div>
      </section>

      <section className="main-padding pt-0">
        <InterviewSchedule
          events={isInterviewsPending ? [] : interviewEvents}
          initialDate={interviewInitialDate}
          view={view}
          setView={setView}
        />
      </section>
    </main>
  );
}
