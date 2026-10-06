"use client";
import { Envelope as Mail } from "@phosphor-icons/react";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AboutSection } from "@/components/pages/candidates/details/PersonalInfo/AboutSection";
import { PersonalInfoSection } from "@/components/pages/candidates/details/PersonalInfo";
import { EducationSection } from "@/components/pages/candidates/details/PersonalInfo/EducationSection";
import { JobApplicationSection } from "@/components/pages/candidates/details/PersonalInfo/JobApplicationSection";
import { CandidateSkillsSection } from "@/components/pages/candidates/details/PersonalInfo/CandidateSkillsSection";
import { CandidateSidebar } from "@/components/pages/candidates/details/CandidateSidebar";
import MainHeader from "@/components/layout/MainHeader";
import { TabMenu } from "@/components/shared/TabMenu";
import { ResumeSection } from "@/components/pages/candidates/details/Resume";
import HiringSteps from "@/components/pages/candidates/details/HiringSteps";
import ScheduleInterview from "@/components/pages/candidates/details/ScheduleInterview";
import { useParams } from "next/navigation";
import { useGetApplicationByIdQuery } from "@/redux/features/job/jobApi";
import { formatDate } from "@/utils/formateDate";
import { useTranslations } from "next-intl";

type TabKey = "personalInfo" | "resume" | "hiringSteps";

export default function CandidateDetailsPage() {
  const t = useTranslations("jobs");
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabKey>("personalInfo");
  const { data, isLoading } = useGetApplicationByIdQuery({
    id: id as string,
  });
  const application = data?.data;
  const backendBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
    /\/api\/?$/,
    "",
  );
  const resumePath = application?.resumeFilePath ?? "";
  const normalizedResumePath = resumePath.startsWith("/")
    ? resumePath
    : `/${resumePath}`;
  const resumeUrl = /^https?:\/\//i.test(resumePath)
    ? resumePath
    : resumePath
      ? `${backendBaseUrl}${normalizedResumePath}`
      : "";
  if (isLoading) return <div>{t("common.loading")}</div>;

  return (
    <>
      {/* Header */}
      <MainHeader
        variant="candidateDetail"
        candidateDetail={{
          name: application?.fullName || "",
          jobTitle: application?.job?.title || "",
          appliedDate: formatDate(application?.appliedAt ?? ""),
        }}
      >
        <div className="flex items-center gap-2.5">
          {application && (
            <ScheduleInterview
              applicationId={application.id}
              candidateName={application.fullName}
            />
          )}

          <a href={`mailto:${application?.email}`} className={buttonVariants({ size: "lg" })}>
            <Mail className="size-4" aria-hidden="true" />
            {t("candidateDetails.sendEmail")}
          </a>
        </div>
      </MainHeader>

      {/* Body */}
      <section className="main-padding flex-1 pb-10">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start">
          {/* Main content */}
          <div className="min-w-0 flex-1 rounded-2xl border   p-6 bg-gray">
            {/* Tabs */}
            <TabMenu
              onChange={(key: string) => setActiveTab(key as TabKey)}
              items={[
                {
                  key: "personalInfo",
                  label: t("candidateDetails.tabs.personalInfo"),
                },
                {
                  key: "resume",
                  label: t("candidateDetails.tabs.resume"),
                },
                {
                  key: "hiringSteps",
                  label: t("candidateDetails.tabs.hiringSteps"),
                },
              ]}
            />
            {/* Tab content */}
            <div className="space-y-6 mt-10">
              {activeTab === "personalInfo" && (
                <>
                  <AboutSection
                    about={application?.job?.aboutCompanyDescription}
                  />
                  <PersonalInfoSection application={application} />
                  <EducationSection application={application} />
                  <JobApplicationSection application={application} />
                  <CandidateSkillsSection application={application} />
                </>
              )}

              {activeTab === "resume" && (
                <ResumeSection
                  resumeUrl={resumeUrl}
                  candidateName={application?.fullName}
                />
              )}

              {activeTab === "hiringSteps" && (
                <HiringSteps
                  applicationId={application?.id}
                  stages={application?.stages ?? []}
                  appointment={application?.appointment ?? null}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full p-5 bg-gray rounded-2xl border shrink-0 lg:w-[320px] xl:w-[340px]">
            {application && <CandidateSidebar application={application} />}
          </div>
        </div>
      </section>
    </>
  );
}
