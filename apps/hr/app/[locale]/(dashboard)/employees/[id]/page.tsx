"use client";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";

import MainHeader from "@/components/layout/MainHeader";
import { PersonalInfoSection } from "@/components/pages/employee/details/PersonalInfoSection";
import { EmployeeInfoSection } from "@/components/pages/employee/details/EmployeeInfoSection";
import { SkillsSection } from "@/components/pages/employee/details/SkillsSection";
import { BankInfoSection } from "@/components/pages/employee/details/BankInfoSection";
import { SalaryInformationSection } from "@/components/pages/employee/details/SalaryInformationSection";
import { PayslipsSection } from "@/components/pages/employee/details/PayslipsSection";
import { TimeOffAttendanceSection } from "@/components/pages/employee/details/TimeOffAttendanceSection";
import { AttachmentSection } from "@/components/pages/employee/details/AttachmentSection";
import { ActivitySection } from "@/components/pages/employee/details/ActivitySection";
import { NotesSection } from "@/components/pages/employee/details/NotesSection";
import {
  useGetActivityLogsQuery,
  useGetEmployeeAttachmentsQuery,
  useGetEmployeeQuery,
} from "@/redux/features/employee/employeeApi";
import type {
  AttachmentItem,
  ActivityItem,
} from "@/components/pages/employee/details/types";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";
import { useActivityLogLabels } from "@/hooks/useActivityLogLabels";
import { formatDate, formatDateTime } from "@/utils/formateDate";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function EmployeeDetailsPage() {
  const params = useParams<{ locale: string; id: string }>();
  const { data: employeeRes, isLoading } = useGetEmployeeQuery(params.id);
  const employee = employeeRes?.data;

  const { data: activityLogsRes, isLoading: isActivitiesLoading } =
    useGetActivityLogsQuery({ performedBy: params.id });
  const activityLabels = useActivityLogLabels();
  const activities = useMemo(() => {
    return (
      activityLogsRes?.data?.items?.map((log) => {
        const name = `${log.performedByUser?.firstName ?? ""} ${log.performedByUser?.lastName ?? ""}`.trim();
        // A known action reads as a sentence in the reader's language; an unknown one as sent.
        const sentence = activityLabels.sentence(log.action, log.entityType, name);
        return {
          id: String(log.id),
          body: sentence ? (
            <span className="font-normal text-secondary">{sentence}</span>
          ) : (
            <>
              <span className="font-semibold">
                <bdi>{name}</bdi>
              </span>
              <span className="font-normal text-secondary"> {log.action} </span>
              <span className="font-semibold">{activityLabels.entity(log.entityType)}</span>
            </>
          ),
          timestamp: formatDateTime(log.createdAt),
        };
      }) || []
    );
  }, [activityLogsRes, params.locale, activityLabels]);

  const format = useFormatter();
  const { data: attachmentsRes, isLoading: isAttachmentsLoading } =
    useGetEmployeeAttachmentsQuery({ id: params.id });
  const attachments = useMemo(() => {
    return (
      attachmentsRes?.data?.items?.map((att) => ({
        id: String(att.id),
        name: att.fileName,
        size: format.number(att.fileSize / (1024 * 1024), {
          style: "unit",
          unit: "megabyte",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        url: att.url,
      })) || []
    );
  }, [attachmentsRes, format]);

  const tHeader = useTranslations("employeeDetails.header");
  const tEmp = useTranslations("employees");
  const labels = useEmployeeLabels();
  const backUrl = `/${params.locale}/employees`;

  const joinDateLabel = useMemo(() => {
    const d = new Date(employee?.employeeInformation?.joinDate || "");
    if (Number.isNaN(d.getTime())) return "-";
    return formatDate(d);
  }, [params.locale, employee?.employeeInformation?.joinDate]);

  if (!isLoading && !employee) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{tEmp("details.notFound")}</p>
      </div>
    );
  }

  return (
    <>
      <MainHeader
        variant="employeeDetail"
        title={
          employee?.personalInformation?.fullName ? (
            <bdi>{employee.personalInformation.fullName}</bdi>
          ) : (
            tEmp("details.loadingName")
          )
        }
        backBtnurl={backUrl}
        backAriaLabel={tHeader("back")}
        employeeDetail={{
          avatarUrl: employee?.avatarUrl || "", // static
          avatarAlt: employee?.personalInformation?.fullName || "",
          initials: getInitials(employee?.personalInformation?.fullName || ""),
          statusLabel:
            employee?.employeeInformation?.status ? labels.status(employee.employeeInformation.status) : tHeader("statusActive"),
          lastClockedInLabel: tHeader("metrics.lastClockedIn"),
          lastClockedInValue: employee?.lastClockedIn
            ? formatDate(employee.lastClockedIn)
            : "-",
          lastMessagedLabel: tHeader("metrics.lastMessaged"),
          lastMessagedValue: employee?.lastMessaged
            ? formatDate(employee.lastMessaged)
            : "-",
          employeeIdLabel: tHeader("metrics.employeeId"),
          employeeIdValue: employee?.employeeCode || "",
          workEmail: employee?.personalInformation?.email || "",
          sendEmailLabel: tHeader("sendEmail"),
        }}
      />
      <section className="main-padding flex-1 pb-10">
        <div className="border bg-gray rounded-2xl space-y-6 p-6">
          <PersonalInfoSection
            personalInfo={employee?.personalInformation}
            isLoading={isLoading}
          />
          <EmployeeInfoSection
            employeeInfo={employee?.employeeInformation}
            joinDateLabel={joinDateLabel}
            employeeId={employee?.employeeCode || "-"}
            isLoading={isLoading}
          />
          <SkillsSection
            skills={employee?.employeeInformation?.skills || []}
            isLoading={isLoading}
          />
          <BankInfoSection
            paymentDetails={employee?.paymentDetails}
            salaryInformation={employee?.salaryInformation}
            isLoading={isLoading}
          />
          <SalaryInformationSection
            salaryInformation={employee?.salaryInformation}
            isLoading={isLoading}
          />
          <PayslipsSection employeeId={params.id} isLoading={isLoading} />
          <TimeOffAttendanceSection
            employeeId={params.id}
            daysOffInformation={employee?.daysOffInformation}
            isLoading={isLoading}
          />
          <AttachmentSection
            employeeId={params.id}
            attachments={attachments}
            isLoading={isAttachmentsLoading}
          />
          <ActivitySection
            activities={activities}
            isLoading={isActivitiesLoading}
          />
          <NotesSection employeeId={params.id} isLoading={isLoading} />
        </div>
      </section>
    </>
  );
}
