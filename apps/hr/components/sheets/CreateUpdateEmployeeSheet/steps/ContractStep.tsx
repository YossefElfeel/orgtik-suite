"use client";
import { CaretDown as ChevronDown, CaretUp as ChevronUp, DotsSixVertical as GripVertical, DownloadSimple as Download, Envelope as Mail, MagicWand as Wand2, Plus, Trash as Trash2 } from "@phosphor-icons/react";

import { IconButton } from "@/components/shared/IconButton";
import React, { useEffect, useMemo } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { motion, Reorder, useDragControls } from "framer-motion";
import { useSearchParams } from "next/navigation";

import { Button } from "@orgtik/ui";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import RichTextFormEle from "@/components/ui/form/rich-text-form-element";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import { useEmployeeWizard } from "../EmployeeWizardContext";
import { useUpdateOnboardingStepMutation, useGetOnboardingStepQuery } from "@/redux/features/employee/employeeApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { WIZARD_STEP_TO_API_KEY, transformApiDataToFormValues } from "../utils";
import { onFormErrorDisplay } from "@/lib/form-error-toast";

import type { IOnboardingStepDTO, ContractSection } from "@/types/employee";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { makeContractSchema, type ContractFormValues } from "../schemas";
import { toast } from "sonner";

const RequiredLabel = ({ label }: { label: string }) => (
  <span>
    {label} <span className="text-destructive">*</span>
  </span>
);

type FormType = ContractFormValues;

function SortableClauseCard({
  section,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  form,
}: {
  section: ContractSection;
  index: number;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  form: any;
}) {
  const t = useTranslations("createUpdateEmployee");
  const tActions = useTranslations("actions");
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={section}
      id={section.id}
      dragListener={false}
      dragControls={dragControls}
      className="group rounded-lg border border-border bg-card overflow-hidden shadow-sm"
    >
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical size={20} />
          </div>
          <input
            {...form.register(`contractBody.${index}.title`)}
            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-foreground w-full placeholder:text-muted-foreground"
            placeholder={t("placeholders.sectionTitle")}
          />
        </div>

        <div className="flex items-center gap-1">
          {onMoveUp && (
            <IconButton
              label={tActions("moveUp")}
              type="button"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={onMoveUp}
            >
              <ChevronUp size={18} />
            </IconButton>
          )}
          {onMoveDown && (
            <IconButton
              label={tActions("moveDown")}
              type="button"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={onMoveDown}
            >
              <ChevronDown size={18} />
            </IconButton>
          )}
          <IconButton
            label={tActions("removeSection")}
            type="button"
            variant="ghost"
            className="size-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 size={18} />
          </IconButton>
        </div>
      </header>

      <div>
        <RichTextFormEle
          form={form}
          name={`contractBody.${index}.content`}
          placeholder={t("placeholders.sectionContent")}
          editorClassName="!border-0 p-4 space-y-0"
        />
      </div>
    </Reorder.Item>
  );
}

export function ContractStep() {
  const { data, onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const [updateOnboarding] = useUpdateOnboardingStepMutation();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id");
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const schema = useMemo(() => makeContractSchema(t), [t]);

  const form = useForm<FormType>({
    resolver: zodResolver(schema as any),
    defaultValues: data as any,
    mode: "onBlur",
  });

  const { data: stepApiResponse } = useGetOnboardingStepQuery(
    { id: employeeId!, step: WIZARD_STEP_TO_API_KEY.contract },
    { skip: !employeeId }
  );

  useEffect(() => {
    if (stepApiResponse?.success && stepApiResponse.data?.data) {
      const transformed = transformApiDataToFormValues("contract", stepApiResponse.data.data);
      form.reset(transformed as any);
    }
  }, [stepApiResponse, form]);

  const contractTypeOptions = [
    { value: "permanent", label: t("options.contractType.permanent") },
    { value: "fixed_term", label: t("options.contractType.fixed") },
  ];

  const trainingPeriodOptions = [
    { value: "3_months", label: t("options.trainingPeriod.3months") },
    { value: "6_months", label: t("options.trainingPeriod.6months") },
  ];

  const noticePeriodOptions = [
    { value: "15_days", label: t("options.noticePeriod.15days") },
    { value: "30_days", label: t("options.noticePeriod.30days") },
    { value: "60_days", label: t("options.noticePeriod.60days") },
    { value: "90_days", label: t("options.noticePeriod.90days") },
  ];

  const handleAddClause = () => {
    const currentSections = form.getValues("contractBody") || [];
    const newSection: ContractSection = {
      id: `clause-${Date.now()}`,
      title: t("contract.newClause"),
      content: " ",
    };
    form.setValue("contractBody", [...currentSections, newSection], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const removeClause = (id: string) => {
    const currentSections = form.getValues("contractBody") || [];
    if (currentSections.length <= 1) return; // Keep at least one
    form.setValue(
      "contractBody",
      currentSections.filter((s: ContractSection) => s.id !== id),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const reorderSections = (newOrder: ContractSection[]) => {
    form.setValue("contractBody", newOrder, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const sections = [...(form.getValues("contractBody") || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIndex];
    sections[targetIndex] = temp;

    form.setValue("contractBody", sections, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const formatPayload = (values: FormType, sendForSignature = false) => {
    return {
      step: "contract" as const,
      data: {
        contractType: values.contractType,
        startDate: values.contractStartDate ? values.contractStartDate.toISOString().split("T")[0] : null,
        endDate: values.contractEndDate ? values.contractEndDate.toISOString().split("T")[0] : null,
        trainingPeriod: values.trainingPeriod,
        noticePeriod: values.noticePeriod,
        sendForSignature,
        companyLogoFileId: null, // Placeholder
        contractSections: (values.contractBody || []).map((section, index) => ({
          title: section.title,
          content: section.content || "",
          order: index + 1,
        })),
      },
    };
  };

  const onSubmit = async (values: FormType) => {
    if (!employeeId)
      return toast.error(t("errors.noEmployeeId"));
    const payload = formatPayload(values, false);
    console.log("VALUES", values);
    console.log("PAYLOAD", payload);
    await reqWithToaster(t("toasts.updatingContract"), async () => {
      const res = await updateOnboarding({ id: employeeId, body: payload }).unwrap();
      if (res.data?.completedSteps) {
        setCompletedSteps(res.data.completedSteps);
      }
      onNext(values as any);
    });
  };

  const handleSendForSignature = async () => {
    const values = form.getValues();
    // Validate first
    const isValid = await form.trigger();
    if (!isValid) return;

    if (!employeeId) return;

    const payload = formatPayload(values, true);

    await reqWithToaster(t("toasts.sendingContract"), async () => {
      const res = await updateOnboarding({ id: employeeId, body: payload }).unwrap();
      if (res.data?.completedSteps) {
        setCompletedSteps(res.data.completedSteps);
      }
      onNext(values as any);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormErrorDisplay)} className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {t("steps.contract.heading")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("steps.contract.description")}
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <SelectFormEle
            form={form}
            name="contractType"
            label={<RequiredLabel label={t("fields.contractType")} />}
            options={contractTypeOptions}
            placeholder={t("placeholders.contractType")}
          />

          <DateTimeFormElement
            form={form}
            name="contractStartDate"
            label={<RequiredLabel label={t("fields.contractStartDate")} />}
            showTime={false}
          />

          <div className="space-y-1">
            <DateTimeFormElement
              form={form}
              name="contractEndDate"
              label={t("fields.contractEndDate")}
              showTime={false}
            />
            <p className="text-xs text-muted-foreground">
              {t("contract.endDateHint")}
            </p>
          </div>

          <SelectFormEle
            form={form}
            name="trainingPeriod"
            label={t("fields.trainingPeriod")}
            options={trainingPeriodOptions}
            placeholder={t("placeholders.trainingPeriod")}
          />

          <SelectFormEle
            form={form}
            name="noticePeriod"
            label={<RequiredLabel label={t("fields.noticePeriod")} />}
            options={noticePeriodOptions}
            placeholder={t("placeholders.noticePeriod")}
          />

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[16px] font-medium text-foreground">
                {t("fields.contractBody")}
              </h3>
            </div>

            <Reorder.Group
              axis="y"
              values={form.watch("contractBody") || []}
              onReorder={reorderSections}
              className="space-y-4"
            >
              {(form.watch("contractBody") || []).map((section: ContractSection, idx: number) => (
                <SortableClauseCard
                  key={section.id}
                  section={section}
                  index={idx}
                  form={form}
                  onRemove={() => removeClause(section.id)}
                  onMoveUp={idx > 0 ? () => moveSection(idx, "up") : undefined}
                  onMoveDown={
                    idx < (form.watch("contractBody") || []).length - 1
                      ? () => moveSection(idx, "down")
                      : undefined
                  }
                />
              ))}
            </Reorder.Group>
          </div>

          {/* Action Buttons */}
          <Button
            type="button"
            variant="secondary"
            className="h-11 gap-2 rounded-xl border-border px-6 text-sm font-medium"
            onClick={handleAddClause}
          >
            <Plus className="size-4 text-muted-foreground" />
            {t("contract.addPoint")}
          </Button>
          {/* HIDDEN ITEMS */}
          <div className="hidden --flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleSendForSignature}
              className="h-11 gap-2 rounded-xl px-6 text-sm font-medium"
            >
              <Mail className="size-4" />
              {t("contract.sendForSignature")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11 gap-2 rounded-xl border-border px-6 text-sm font-medium"
            >
              {t("contract.downloadPdf")}
              <Download className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {/* Navigation Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            className="min-w-32"
            type="button"
            size="lg"
            variant="secondary"
            onClick={onBack}
          >
            {t("nav.back")}
          </Button>
          <Button type="submit" className="min-w-32" size="lg">
            {isLastStep
              ? isEdit
                ? t("nav.save")
                : t("nav.submit")
              : t("nav.next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
