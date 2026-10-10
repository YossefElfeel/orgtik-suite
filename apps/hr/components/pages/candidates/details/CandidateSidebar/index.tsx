"use client";
import { Envelope as Mail, Phone } from "@phosphor-icons/react";

import { useTranslations } from "next-intl";
import { IconButton } from "@/components/shared/IconButton";
import Notes from "./Notes";
import { IJobApplication } from "@/types/job";

export function CandidateSidebar({
  application,
}: {
  application: IJobApplication;
}) {
  const tActions = useTranslations("actions");
  const tJobs = useTranslations("jobs");
  const experienceLevel = application.job?.experienceLevel;
  return (
    <div className="flex flex-col gap-4">
      {/* Candidate mini card */}
      <div className="rounded-xl border  bg-raised p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <p className="text-body-lg font-semibold leading-6 ">
              <bdi>{application.fullName}</bdi>
            </p>
            <p className=" text-body  text-fg-subtle"><bdi>{application.job?.title}</bdi></p>
            <p className=" text-body   text-fg-subtle">
              {experienceLevel && tJobs.has(`addJobSheet.options.experienceLevel.${experienceLevel}`)
                ? tJobs(`addJobSheet.options.experienceLevel.${experienceLevel}`)
                : experienceLevel}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-3">
            <IconButton
              label={tActions("call")}
              variant="secondary"
              className="rounded-full"
              href={`tel:${application.phoneNumber}`}
            >
              <Phone className="size-4" />
            </IconButton>
            <IconButton
              label={tActions("email")}
              variant="secondary"
              className="rounded-full"
              href={`mailto:${application.email}`}
            >
              <Mail className="size-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Notes */}
      <Notes applicationId={application.id} />
    </div>
  );
}
