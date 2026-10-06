"use client";
import { Briefcase, CalendarDots as CalendarDays, Check, Clock, Clock as Clock3, X } from "@phosphor-icons/react";

import React, { useEffect, useState } from "react";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import CustomAvatar from "@/components/shared/CustomAvatar";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  useLazyGetTimeOffByIdQuery,
  useMakeTimeOffDecisionMutation,
} from "@/redux/features/timeOff/timeOffApi";
import { AttachmentList } from "@/components/shared/AttachmentList";
import { useGetRole } from "@/hooks/useGetRole";
import { useFormatter, useTranslations } from "next-intl";
import { makeDecisionSchema, type DecisionFormValues } from "@/schemas/time-off/decision.schemas";
import { rangeText } from "@/lib/date-range";

interface TimeOffActionDialogProps {
  trigger?: React.ReactNode;
  id: number;
  status: "pending" | "approved" | "rejected";
  onSave?: (data: DecisionFormValues) => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TimeOffActionDialog({
  trigger,
  status,
  onSave,
  id,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: TimeOffActionDialogProps) {
  const t = useTranslations("timeOffDialog");
  const tTypes = useTranslations("leaveTypes");
  const format = useFormatter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);


  // super_admin decides at HR's level (the API treats them as HR): they could never act before.
  const { isHR, isManager, isEmployee, isAdmin } = useGetRole();
  const actsAsHR = isHR || isAdmin;

  const [triggerFetch, { data: response }] = useLazyGetTimeOffByIdQuery();
  const timeOffDetails = response?.data;

  const [makeDecision, { isLoading: isDeciding }] = useMakeTimeOffDecisionMutation();

  const isControlled =
    externalOpen !== undefined && externalOnOpenChange !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const onOpenChange = isControlled ? externalOnOpenChange : setInternalOpen;

  const form = useForm<DecisionFormValues>({
    resolver: zodResolver(makeDecisionSchema({ choose: t("decision.choose"), tooLong: t("decision.tooLong") })),
    defaultValues: { decision: undefined, note: "" },
  });
  const chosen = form.watch("decision");

  useEffect(() => {
    if (open && id) triggerFetch(id);
  }, [open, id, triggerFetch]);

  useEffect(() => {
    if (open) {
      form.reset({ decision: undefined, note: "" });
      setIsEditing(false);
    }
  }, [status, open, form]);

  const options = [
    {
      value: "approved",
      label: t("actions.approve"),
      icon: Check,
      activeClass: "border-success bg-success-solid/5 text-success",
    },
    {
      value: "rejected",
      label: t("actions.reject"),
      icon: X,
      activeClass: "border-danger bg-danger-solid/5 text-danger",
    },
  ] as const;


  const dataDecision = [
    {
      title: t("sections.managerDecision"),
      status: timeOffDetails?.managerActionStatus || "pending",
      note: timeOffDetails?.managerDecisionNote,
      roleRequired: "manager",
      canAction: isManager && !actsAsHR,
    },
    {
      title: t("sections.hrDecision"),
      status: timeOffDetails?.hrActionStatus || "pending",
      note: timeOffDetails?.hrDecisionNote,
      roleRequired: "hr",
      canAction: actsAsHR,
    },
  ];

  const handleDecisionSubmit = async (values: DecisionFormValues) => {
    try {
      await makeDecision({ id, body: { status: values.decision, decisionNote: values.note } }).unwrap();
      onSave?.(values);
      setIsEditing(false);
      onOpenChange(false);
    } catch {
      // The base query says why, in the reader's language (lib/api-feedback); the dialog stays open.
    }
  };

  return (
    <ReusableDialog
      title={t("title")}
      description={`#${timeOffDetails?.requestCode || ""} · ${t("submitted")}`}
      trigger={trigger}
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>

          {!isEmployee && !isEditing && status !== "pending" && (
            <Button
              className="flex-1"
              size="lg"
              onClick={() => setIsEditing(true)}
            >
              {t("actions.changeDecision")}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Employee Info Section */}
        <div className="border rounded-[16px] p-5 bg-raised space-y-3">
          {/* Employee Info Card */}

          <div className="flex items-center justify-between bg-gray p-2 rounded-[12px]">
            <div className="flex items-center gap-3">
              <CustomAvatar
                src={
                  timeOffDetails?.employee?.avatar ||
                  "https://randomuser.me/api/portraits/"
                }
                className="h-11 w-11"
              />
              <div>
                <h4 className="text-[16px] font-medium text-gray-black">
                  {timeOffDetails?.employee?.fullName}
                </h4>
                <p className="text-[12px] text-secondary ">
                  {timeOffDetails?.requestCode} •{" "}
                  {timeOffDetails?.employeeDepartment}
                </p>
              </div>
            </div>
            <StatusBadge
              status={timeOffDetails?.status || "unknown"}
              size="lg"
            />
          </div>
          <div className="grid grid-cols-1 gap-y-4 text-[14px]">
            <DetailRow
              icon={Briefcase}
              label={t("fields.leaveType")}
              value={timeOffDetails?.timeOffType ? (tTypes.has(timeOffDetails.timeOffType) ? tTypes(timeOffDetails.timeOffType) : timeOffDetails.timeOffType) : undefined}
              valueClass="text-primary font-medium"
            />
            <DetailRow
              icon={CalendarDays}
              label={t("fields.dates")}
              value={
                timeOffDetails
                  ? timeOffDetails.startDate === timeOffDetails.endDate
                    ? format.dateTime(new Date(`${timeOffDetails.startDate}T00:00:00`), { dateStyle: "medium" })
                    : rangeText(format.dateTimeRange(new Date(`${timeOffDetails.startDate}T00:00:00`), new Date(`${timeOffDetails.endDate}T00:00:00`), { dateStyle: "medium" }))
                  : undefined
              }
            />
            <DetailRow
              icon={Clock3}
              label={t("fields.duration")}
              value={timeOffDetails?.durationType ? t(`durations.${timeOffDetails.durationType}`) : undefined}
              valueClass="text-primary font-medium"
            />
          </div>
          {/* Attachments Section */}
          <div className="space-y-2">
            <p className="text-[16px] font-medium text-gray-black">
              {t("fields.attachments")}
            </p>
            <div className="flex items-center gap-2 text-secondary text-[14px]">
              {timeOffDetails?.attachments ? (
                <AttachmentList attachments={timeOffDetails?.attachments} />
              ) : (
                t("fields.noFileAdded")
              )}
            </div>
          </div>
          <div >
            <p>{t("fields.noteReason")}</p>
            <p className="p-4 bg-sunken border rounded-xl text-gray-black text-[15px] ">{timeOffDetails?.employeeNote ? timeOffDetails?.employeeNote : t("decision.noNotesProvided")}</p>
          </div>
        </div>

        {/* Decisions Sections */}
        {dataDecision.map((decision, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-black mt-6">
              {decision.title}
            </h3>

            <div className="border rounded-[16px] p-5 bg-raised">

              {(decision.status === "pending" || isEditing) &&
                decision.canAction ? (
                <Form {...form}>
                  <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(handleDecisionSubmit)}
                  >
                    <div role="group" aria-label={decision.title} className="grid grid-cols-2 gap-4">
                      {options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={chosen === opt.value}
                          onClick={() => form.setValue("decision", opt.value, { shouldValidate: true })}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-[16px] border-[1.5px] transition-all",
                            chosen === opt.value
                              ? opt.activeClass
                              : "border-line text-fg-subtle",
                          )}
                        >
                          <opt.icon className="w-5 h-5" weight="bold" aria-hidden="true" />
                          <span className="font-medium text-lg">
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <TextFormEle
                      form={form}
                      name="note"
                      label={t("fields.noteReason")}
                      type="textarea"
                      placeholder={t("fields.notePlaceholder")}
                    />
                    <Button type="submit" className="w-full" disabled={!chosen || isDeciding} aria-busy={isDeciding}>
                      {t("actions.submitDecision")}
                    </Button>
                    {!chosen ? <p className="text-center text-sm text-secondary">{t("decision.choose")}</p> : null}
                  </form>
                </Form>
              ) : (
                <div className="flex flex-col gap-[16px]">
                  <div
                    className={cn(
                      "flex items-center justify-center gap-3 py-[16px] px-2 rounded-[12px] border-[1px]",
                      decision.status === "approved"
                        ? "border-success bg-success-solid/5 text-success"
                        : decision.status === "rejected"
                          ? "border-danger/30 bg-danger-subtle text-danger"
                          : "border-warning/30 bg-warning-solid/5 text-warning",
                    )}
                  >
                    {decision.status === "approved" ? (
                      <Check />
                    ) : decision.status === "rejected" ? (
                      <X />
                    ) : (
                      <Clock />
                    )}
                    <span className="font-medium text-lg uppercase">
                      {t("decision.label", {
                        status: t(`decision.status.${decision.status}`),
                      })}
                    </span>
                  </div>
                  <div>
                    <label className="text-gray-black text-[16px] font-medium mb-1">
                      {t("fields.note")}
                    </label>
                    <div className="p-4 bg-sunken border rounded-xl text-gray-black text-[15px] ">
                      {decision.status === "pending"
                        ? t("decision.waitingForAction")
                        : decision.note || t("decision.noNotesProvided")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ReusableDialog>
  );
}

const DetailRow = ({ icon: Icon, label, value, valueClass }: any) => (
  <div className="flex items-start gap-4">
    <div className="flex items-center gap-2 text-secondary text-sm w-[120px] shrink-0">
      <Icon className="w-[20px] h-[20px]" />
      <span>{label}</span>
    </div>
    <div className={cn("text-gray-black font-medium text-[16px]", valueClass)}>
      {value || "-"}
    </div>
  </div>
);
