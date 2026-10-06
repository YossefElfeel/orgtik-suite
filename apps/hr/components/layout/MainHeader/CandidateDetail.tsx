"use client";
import { ArrowLeft, Envelope as Mail } from "@phosphor-icons/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
export type MainHeaderCandidateDetail = {
  name: string;
  jobTitle: string;
  appliedDate: string;
};

type Props = {
  candidateDetail: MainHeaderCandidateDetail;
  children?: React.ReactNode;
};

function CandidateDetail(props: Props) {
  const router = useRouter();
  const t = useTranslations("candidateDetails.header");

  const { candidateDetail, children } = props;
  return (
    <section className="bg-gray main-padding border-b border">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6 justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:max-w-[min(100%,720px)] lg:shrink-0">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/candidates")}
            aria-label={t("back")}
          >
            <ArrowLeft className="rtl:-scale-x-100" />
          </Button>
          <div className="flex items-center gap-10 flex-wrap">
            <div className={cn("min-w-0 px-3 border-e ")}>
              <p className="text-body-lg font-semibold"><bdi>{candidateDetail.name}</bdi></p>{" "}
              <p className="mt-0.5 text-body font-semibold text-fg-subtle ">
                <bdi>{candidateDetail.jobTitle}</bdi>
              </p>
            </div>
            {[
              {
                label: t("appliedDate"),
                value: candidateDetail.appliedDate,
              },
            ].map((item) => (
              <div key={item.label} className={cn("min-w-0")}>
                <p className="text-caption font-normal text-fg-subtle ">
                  {item.label}
                </p>{" "}
                <p className="mt-0.5 text-body font-semibold  ">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

export default CandidateDetail;
