"use client";
import { Briefcase as BriefcaseBusiness, Clock as Clock3, MapPin, Plus } from "@phosphor-icons/react";


import MainHeader from "@/components/layout/MainHeader";
import AddJobSheet from "@/components/pages/hiring/AddJobSheet";
import { JobOpeningCard } from "@/components/shared/JobOpeningCard";
import { TabMenu } from "@/components/shared/TabMenu";
import { Button } from "@/components/ui/button";
import {
  useGetJobsQuery,
  useUpdateJobMutation,
} from "@/redux/features/job/jobApi";
import { JobStatus } from "@/types/job";
import { formatDate } from "@/utils/formateDate";
import { useState } from "react";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { useTranslations } from "next-intl";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
const toDateOnly = (value: string) => value.split("T")[0];

export default function HiringJobsPage() {
  const t = useTranslations("jobs");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [updateJob] = useUpdateJobMutation();
  const tabs = [
    { key: "all", label: t("hiringJobs.tabs.all") },
    { key: "opened", label: t("jobDetails.status.open") },
    { key: "on_hold", label: t("jobDetails.status.hold") },
    { key: "closed", label: t("jobDetails.status.closed") },
    { key: "cancelled", label: t("hiringJobs.tabs.publishSoon") },
  ];
  const statusOptions = [
    { value: "opened", label: t("jobDetails.status.open"), tone: "success" },
    { value: "on_hold", label: t("jobDetails.status.hold"), tone: "warning" },
    { value: "closed", label: t("jobDetails.status.closed"), tone: "neutral" },
    { value: "cancelled", label: t("jobDetails.status.cancelled"), tone: "info" },
  ] as const;
  const { data, isLoading, isError, isFetching } = useGetJobsQuery({
    page,
    limit,
    ...(status && status !== "all" ? { status } : {}),
  });

  const jobs = data?.data.items ?? [];
  const isJobsLoading = isLoading || isFetching;
  const showEmptyState = !isJobsLoading && !isError && jobs.length === 0;

  const optionLabel = (group: "jobType" | "jobMode" | "experienceLevel", value?: string) => {
    if (!value) return "";
    const key = `addJobSheet.options.${group}.${value}`;
    return t.has(key) ? t(key) : value;
  };

  const handleStatusChange = async (jobId: number, nextStatus: string) => {
    const targetJob = jobs.find((job) => job.id === jobId);
    if (!targetJob) return;

    await updateJob({
      id: jobId,
      data: {
        status: nextStatus as JobStatus,
      },
    }).unwrap();
  };

  return (
    <main className="bg-background">
      <MainHeader title={t("hiringJobs.title")}>
        <AddJobSheet
          trigger={
            <Button type="button" size="lg">
              <Plus className="size-4" />
              {t("common.createJob")}
            </Button>
          }
        />
      </MainHeader>

      <section className="main-padding pb-0">
        <TabMenu
          items={tabs}
          onChange={(value) => setStatus(value as JobStatus | "all")}
          defaultActive="all"
          className="border-b border-line pb-4"
        />
      </section>

      <section className="main-padding pt-4">
        {/* <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <Input
              placeholder="Search..."
              className="h-9 border-line bg-raised pe-3 ps-9 text-sm text-fg-muted placeholder:text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger
                size="sm"
                className="h-9 rounded-lg border-line bg-raised px-3 text-sm font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
              >
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent align="end" className="w-48">
                <SelectItem value="all">All departments</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger
                size="sm"
                className="h-9 rounded-lg border-line bg-raised px-3 text-sm font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
              >
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent align="end" className="w-44">
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="publish">Publish Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div> */}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isJobsLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`job-skeleton-${index}`}
                className="flex h-full w-full min-w-0 animate-pulse flex-col gap-3 rounded-[8px] border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-7 w-24 rounded-md bg-gray" />
                  <div className="size-6 rounded-full bg-gray" />
                </div>

                <div className="h-6 w-1/2 rounded-md bg-gray" />

                <div className="grid grid-cols-3 gap-2">
                  <div className="h-4 rounded-md bg-gray" />
                  <div className="h-4 rounded-md bg-gray" />
                  <div className="h-4 rounded-md bg-gray" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-[10px] bg-gray" />
                  <div className="h-16 rounded-[10px] bg-gray" />
                </div>

                <div className="h-4 w-2/3 rounded-md bg-gray" />
                <div className="h-px w-full bg-border" />
                <div className="h-5 w-1/3 rounded-md bg-gray" />
              </div>
            ))}
          {isError && (
            <p className="text-secondary">
              {t("hiringJobs.failedLoadJobs")}
            </p>
          )}
          {!isJobsLoading &&
            !isError &&
            jobs.map((job) => (
              <JobOpeningCard
                key={job.id}
                status={job.status}
                statusOptions={[...statusOptions]}
                title={job.title}
                level={optionLabel("experienceLevel", job.experienceLevel)}
                onStatusChange={(value) => handleStatusChange(job.id, value)}
                metadata={[
                  {
                    icon: <Clock3 className="text-fg-muted" />,
                    label: optionLabel("jobType", job.jobType),
                  },
                  {
                    icon: <MapPin className="text-fg-muted" />,
                    label: optionLabel("jobMode", job.jobMode),
                  },
                  {
                    icon: <MapPin className="text-fg-muted" />,
                    label: job.location,
                    userContent: true,
                  },
                ]}
                stats={[
                  { label: t("hiringJobs.stats.totalApplied"), value: job.totalApplied },
                  { label: t("hiringJobs.stats.totalInterview"), value: job.totalInterviews },
                ]}
                dateRangeLabel={t("hiringJobs.dateRange.fromTo", {
                  start: formatDate(job.startDate),
                  end: job.endDate ? formatDate(job.endDate) : "---",
                })}
                remainingLabel={` `}
                department={job.department.name}
                detailsHref={`/hiring/overall/${job.id}`}
              />
            ))}
        </div>

        {showEmptyState && (
          <div className="mt-6 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-gray/40 px-6 py-10 text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-full bg-background">
              <BriefcaseBusiness className="size-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("hiringJobs.empty.title")}
            </h3>
            <p className="mt-2 max-w-md text-sm text-secondary">
              {t("hiringJobs.empty.description")}
            </p>
          </div>
        )}

        {data?.data.meta && data?.data.meta.totalPages > 1 && (
          <CustomPagination
            currentPage={data?.data.meta.page}
            totalPages={data?.data.meta.totalPages}
            limit={data?.data.meta.limit}
            baseUrl={"/hiring/jobs"}
            totalItems={data?.data.meta.total}
            onPageChange={(page) => setPage(page)}
            onLimitChange={(limit) => {
              setLimit(limit);
              setPage(1);
            }}
          />
        )}
      </section>
    </main>
  );
}
