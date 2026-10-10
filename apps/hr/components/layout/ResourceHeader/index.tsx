"use client";
import { ArrowLeft } from "@phosphor-icons/react";

import { Button } from "@orgtik/ui";
import React from "react";
import {PageHeader} from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type {MainHeaderEmployeeDetail} from "./EmployeeDetail";
import type {MainHeaderCandidateDetail} from "./CandidateDetail";

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

  if(props.variant==='employeeDetail') return <PageHeader title={props.title} meta={<>{props.titleChildren}<span className="text-caption">{props.employeeDetail.employeeIdLabel}: <bdi>{props.employeeDetail.employeeIdValue}</bdi> · <bdi>{props.employeeDetail.workEmail}</bdi></span></>} actions={<><Button variant="secondary" size="sm" onClick={()=>router.push(props.backBtnurl)} aria-label={props.backAriaLabel}><ArrowLeft className="rtl:-scale-x-100"/></Button>{props.children}</>}/>;
  if(props.variant==='candidateDetail') return <PageHeader title={props.candidateDetail.name} description={props.candidateDetail.jobTitle} meta={props.candidateDetail.appliedDate} actions={props.children}/>;
  const { title, titleChildren, children, backBtn = false, backBtnurl } = props;

  const onBack = () => {
    if (backBtnurl) {
      router.push(backBtnurl);
      return;
    }
    router.back();
  };

  return <PageHeader title={title} meta={titleChildren} actions={<>{backBtn?<Button size="sm" variant="secondary" onClick={onBack} aria-label={tHeader("back")}><ArrowLeft className="rtl:-scale-x-100"/></Button>:null}{children}</>}/>;
}

export default MainHeader;
