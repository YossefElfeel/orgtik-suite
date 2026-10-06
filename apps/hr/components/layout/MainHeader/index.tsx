"use client";
import { ArrowLeft } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import React from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import EmployeeDetail, { MainHeaderEmployeeDetail } from "./EmployeeDetail";
import CandidateDetail, { MainHeaderCandidateDetail } from "./CandidateDetail";

type DefaultProps = {
  variant?: "default";
  /** Plain or translated text; wrap user content (a name) in <bdi> at the call site. */
  title: React.ReactNode;
  titleChildren?: React.ReactNode;
  children?: React.ReactNode;
  backBtn?: boolean;
  backBtnurl?: string;
};

type EmployeeDetailProps = {
  variant: "employeeDetail";
  /** Plain or translated text; wrap user content (a name) in <bdi> at the call site. */
  title: React.ReactNode;
  titleChildren?: React.ReactNode;
  backBtnurl: string;
  backAriaLabel: string;
  employeeDetail: MainHeaderEmployeeDetail;
  children?: React.ReactNode;
};
type CandidateDetailProps = {
  variant: "candidateDetail";
  candidateDetail: MainHeaderCandidateDetail;
  children?: React.ReactNode;
};
export type MainHeaderProps =
  | DefaultProps
  | EmployeeDetailProps
  | CandidateDetailProps;

function MainHeader(props: MainHeaderProps) {
  const router = useRouter();
  const tHeader = useTranslations("candidateDetails.header");

  if (props.variant === "employeeDetail") {
    return (
      <EmployeeDetail
        title={props.title}
        titleChildren={props.titleChildren}
        backBtnurl={props.backBtnurl}
        backAriaLabel={props.backAriaLabel}
        employeeDetail={props.employeeDetail}
        children={props.children}
      />
    );
  }
  if (props.variant === "candidateDetail") {
    return (
      <CandidateDetail
        candidateDetail={props.candidateDetail}
        children={props.children}
      />
    );
  }

  const { title, titleChildren, children, backBtn = false, backBtnurl } = props;

  const onBack = () => {
    if (backBtnurl) {
      router.push(backBtnurl);
      return;
    }
    router.back();
  };

  return (
    <section className="bg-gray main-padding border-b flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2.5">
        {backBtn && (
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={onBack}
            aria-label={tHeader("back")}
          >
            <ArrowLeft className="rtl:-scale-x-100" />
          </Button>
        )}
        <h1 className="text-title-lg font-semibold">{title}</h1>
        {titleChildren}
      </div>
      {children}
    </section>
  );
}

export default MainHeader;
