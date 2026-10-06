"use client";
import { Trash as Trash2 } from "@phosphor-icons/react";

import { useState, type ComponentType, type ReactNode } from "react";

import MainHeader from "@/components/layout/MainHeader";
import { type MenuTabItem, TabMenu } from "@/components/shared/TabMenu";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import {
  useDeleteJobMutation,
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from "@/redux/features/job/jobApi";
import JobDetailsTab from "./JobDetailsTab";
import SalaryBenefitsTab from "./SalaryBenefitsTab";
import DescriptionsRequirementsTab from "./DescriptionsRequirementsTab";
import CandidatesTab from "./CandidatesTab";
import type { IJob } from "@/types/job";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import JobStatusDropdown from "@/components/shared/JobStatusDropdown";
import { useTranslations } from "next-intl";

export type DetailItem = {
  id: string;
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
};

function JobDetailsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, cardIdx) => (
        <section
          key={`job-details-skeleton-card-${cardIdx}`}
          className="rounded-[20px] border border-border bg-background p-6"
        >
          <div className="flex items-center gap-3">
            <div className="size-6 rounded-full bg-gray animate-pulse" />
            <div className="h-6 w-40 rounded-md bg-gray animate-pulse" />
          </div>

          <div className="mt-4 h-px w-full bg-border" />

          <div className="mt-4 grid gap-y-4 gap-x-8 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, itemIdx) => (
              <div
                key={`job-details-skeleton-item-${cardIdx}-${itemIdx}`}
                className="flex items-center gap-2.5"
              >
                <div className="size-5 rounded-full bg-gray animate-pulse" />
                <div className="h-4 w-32 rounded-md bg-gray animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-gray animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function HeaderedCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-border bg-background p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className="size-6 text-foreground" />
          <h3 className="text-lg leading-6 font-medium text-foreground">
            {title}
          </h3>
        </div>
        {/* <EditActionButton /> */}
      </div>

      <div className="mt-4 h-px w-full bg-border" />

      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <div className="grid gap-y-4 gap-x-8 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2.5">
          <item.icon className="size-5 shrink-0 text-secondary" />
          <p className="w-[175px] text-sm leading-[18px] font-normal text-secondary">
            {item.label}
          </p>
          <p className="text-sm leading-[18px] font-medium text-foreground">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function JobOpeningDetailsPage() {
  const t = useTranslations("jobs");
  const router = useRouter();
  const params = useParams();
  const openingIdParam = params.openingId as string;
  const openingId = Number(openingIdParam);
  const hasValidOpeningId = Number.isFinite(openingId);
  const [activeTab, setActiveTab] = useState<string>("job-details");
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
  const [updateJob, { isLoading: isUpdatingStatus }] = useUpdateJobMutation();
  const { data, isLoading, isError } = useGetJobByIdQuery(
    { id: openingId },
    { skip: !hasValidOpeningId },
  );

  const job = data?.data;
  const openingTitle = job?.title ?? openingIdParam;
  const canUpdateStatus = Boolean(job?.id) && !isUpdatingStatus;
  const statusOptions = [
    { value: "opened", label: t("jobDetails.status.open"), tone: "success" },
    { value: "on_hold", label: t("jobDetails.status.hold"), tone: "warning" },
    { value: "closed", label: t("jobDetails.status.closed"), tone: "neutral" },
    { value: "cancelled", label: t("jobDetails.status.cancelled"), tone: "info" },
  ] as const;
  const tabs: MenuTabItem[] = [
    { key: "job-details", label: t("jobDetails.tabs.jobDetails") },
    { key: "salary", label: t("jobDetails.tabs.salary") },
    { key: "descriptions", label: t("jobDetails.tabs.descriptions") },
    { key: "candidates", label: t("candidatesPage.title") },
  ];

  const handleStatusChange = async (status: IJob["status"]) => {
    if (!job?.id) return;
    await updateJob({
      id: job.id,
      data: { status },
    }).unwrap();
  };

  return (
    <main className="bg-background pb-8">
      {isLoading ? (
        <section className="bg-gray main-padding border-b flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-full bg-line-strong animate-pulse" />
            <div className="h-6 w-40 rounded-md bg-line-strong animate-pulse" />
            <div className="h-9 w-28 rounded-md bg-line-strong animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden h-12 w-px bg-border md:block" aria-hidden />
            <div className="h-10 w-44 rounded-xl bg-line-strong animate-pulse" />
          </div>
        </section>
      ) : (
        <MainHeader
          title={openingTitle}
          backBtn
          backBtnurl="/hiring/jobs"
          titleChildren={
            <div className="flex items-center gap-3">
              <div
                className="hidden h-12 w-px bg-border md:block"
                aria-hidden
              />

              <JobStatusDropdown
                status={job?.status ?? "opened"}
                options={[...statusOptions]}
                defaultTone="success"
                disabled={!canUpdateStatus}
                onChange={(value) =>
                  handleStatusChange(value as IJob["status"])
                }
              />
            </div>
          }
        >
          <div className="flex items-center gap-4">
            <div className="hidden h-12 w-px bg-border md:block" aria-hidden />
            {isLoading ? (
              <div className="h-10 w-44 rounded-xl bg-gray animate-pulse" />
            ) : (
              <DeleteDialog
                description={t("jobDetails.deleteConfirmDescription")}
                onConfirm={async () => {
                  if (!hasValidOpeningId) return;
                  await deleteJob({ id: openingId }).unwrap();
                  router.push("/hiring/jobs");
                }}
                loading={isDeleting}
                trigger={
                  <Button
                    type="button"
                    variant="delete"
                    size="lg"
                    className="h-10 rounded-xl px-4 text-sm font-medium"
                    disabled={!hasValidOpeningId || isDeleting}
                  >
                    <Trash2 className="size-4" />
                    {t("jobDetails.deleteJobOffer")}
                  </Button>
                }
              />
            )}
          </div>
        </MainHeader>
      )}

      <section className="main-padding">
        <div className="rounded-[20px] border border-border bg-gray p-4 md:p-6">
          <TabMenu
            items={tabs}
            defaultActive="job-details"
            onChange={setActiveTab}
          />

          <div className="pt-4">
            {isLoading ? <JobDetailsLoadingSkeleton /> : null}
            {isError ? (
              <p className="text-sm text-destructive">
                {t("jobDetails.failedLoadJobDetails")}
              </p>
            ) : null}
            {!isLoading && activeTab === "job-details" ? (
              <JobDetailsTab job={job} />
            ) : null}
            {!isLoading && activeTab === "salary" ? (
              <SalaryBenefitsTab job={job} />
            ) : null}
            {!isLoading && activeTab === "descriptions" ? (
              <DescriptionsRequirementsTab job={job} />
            ) : null}
            {!isLoading && activeTab === "candidates" ? (
              <CandidatesTab />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
