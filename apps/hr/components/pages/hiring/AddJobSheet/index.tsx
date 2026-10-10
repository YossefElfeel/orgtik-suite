"use client";
import { Plus, X } from "@phosphor-icons/react";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@orgtik/ui";
import { Sheet, SheetClose, SheetContent, DialogTitle as SheetTitle, SheetTrigger } from "@orgtik/ui";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { cn } from "@/lib/utils";
import { useCreateJobMutation } from "@/redux/features/job/jobApi";
import { DEFAULT_ADD_JOB_FORM_VALUES } from "./constants";
import StepRail from "./StepRail";
import JobDescriptionsRequirementsStep from "./steps/JobDescriptionsRequirementsStep";
import JobDetailsStep from "./steps/JobDetailsStep";
import SalaryDetailsBenefitsStep from "./steps/SalaryDetailsBenefitsStep";
import type { AddJobFormValues, AddJobSheetProps } from "./types";
import { useTranslations } from "next-intl";
import { triggerProps } from "@/lib/trigger";
const getAddJobFormSchema = (t: ReturnType<typeof useTranslations>) => z
    .object({
    jobTitle: z.string().trim().min(1, t("addJobSheet.validation.jobTitleRequired")),
    jobType: z.string().trim().min(1, t("addJobSheet.validation.jobTypeRequired")),
    jobMode: z.string().trim().min(1, t("addJobSheet.validation.jobModeRequired")),
    departmentId: z.string().trim().min(1, t("addJobSheet.validation.industryRequired")),
    location: z.string().trim().min(1, t("addJobSheet.validation.locationRequired")),
    experienceLevel: z
        .string()
        .trim()
        .min(1, t("addJobSheet.validation.experienceLevelRequired")),
    requiredExperience: z.string(),
    untilClosed: z.boolean(),
    startDate: z.union([z.date(), z.string()]),
    endDate: z.union([z.date(), z.string()]),
    currencyType: z.string().trim().min(1, t("addJobSheet.validation.currencyTypeRequired")),
    salaryRangeMin: z.number().min(1, t("addJobSheet.validation.startSalaryGreaterThanZero")),
    salaryRangeMax: z.number().min(1, t("addJobSheet.validation.endSalaryGreaterThanZero")),
    accommodationType: z
        .string()
        .trim()
        .min(1, t("addJobSheet.validation.accommodationTypeRequired")),
    bonusAvailability: z
        .string()
        .trim()
        .min(1, t("addJobSheet.validation.bonusAvailabilityRequired")),
    healthInsurance: z
        .string()
        .trim()
        .min(1, t("addJobSheet.validation.healthInsuranceRequired")),
    paidTimeOff: z.string().trim().min(1, t("addJobSheet.validation.paidTimeOffRequired")),
    companyDescription: z
        .string()
        .trim()
        .min(1, t("addJobSheet.validation.companyDescriptionRequired")),
    jobRequirements: z
        .string()
        .trim()
        .min(1, t("addJobSheet.validation.jobRequirementsRequired")),
    jobSkills: z
        .array(z.string())
        .min(1, t("addJobSheet.validation.jobSkillRequired")),
})
    .superRefine((values, ctx) => {
    const normalizedStartDate = values.startDate instanceof Date ? values.startDate : new Date(values.startDate);
    const hasValidStartDate = !Number.isNaN(normalizedStartDate.getTime());
    if (!hasValidStartDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["startDate"],
            message: t("addJobSheet.validation.startDateRequired"),
        });
    }
    const hasEndDateValue = values.endDate instanceof Date
        ? !Number.isNaN(values.endDate.getTime())
        : Boolean(values.endDate?.trim());
    if (!values.untilClosed && !hasEndDateValue) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: t("addJobSheet.validation.endDateRequiredUntilClosedDisabled"),
        });
    }
    if (hasEndDateValue) {
        const normalizedEndDate = values.endDate instanceof Date ? values.endDate : new Date(values.endDate ?? "");
        const hasValidEndDate = !Number.isNaN(normalizedEndDate.getTime());
        if (!hasValidEndDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endDate"],
                message: t("addJobSheet.validation.endDateMustBeValid"),
            });
        }
        else if (hasValidStartDate &&
            normalizedEndDate.getTime() < normalizedStartDate.getTime()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endDate"],
                message: t("addJobSheet.validation.endDateMustBeAfterStartDate"),
            });
        }
    }
    if (values.salaryRangeMin > values.salaryRangeMax) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["salaryRangeMin"],
            message: t("addJobSheet.validation.startSalaryLessThanOrEqualEndSalary"),
        });
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["salaryRangeMax"],
            message: t("addJobSheet.validation.endSalaryGreaterThanOrEqualStartSalary"),
        });
    }
});
const STEP_FIELDS: Array<Array<keyof AddJobFormValues>> = [
    [
        "jobTitle",
        "jobType",
        "jobMode",
        "departmentId",
        "location",
        "experienceLevel",
        "startDate",
        "endDate",
        "untilClosed",
    ],
    [
        "currencyType",
        "salaryRangeMin",
        "salaryRangeMax",
        "accommodationType",
        "bonusAvailability",
        "healthInsurance",
        "paidTimeOff",
    ],
    ["companyDescription", "jobRequirements", "jobSkills"],
];
const toISODate = (value: string | Date) => {
    if (value instanceof Date)
        return value.toISOString().split("T")[0];
    return new Date(value).toISOString().split("T")[0];
};
export default function AddJobSheet({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange, }: AddJobSheetProps) {
    const t = useTranslations("jobs");
    const addJobFormSchema = React.useMemo(() => getAddJobFormSchema(t), [t]);
    const reqWithToaster = useReqWithToaster();
    const [createJob, { isLoading: isCreatingJob }] = useCreateJobMutation();
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = controlledOnOpenChange ?? setInternalOpen;
    const [step, setStep] = React.useState(0);
    const addJobSteps = React.useMemo(() => [
        {
            step: t("addJobSheet.steps.step1"),
            title: t("addJobSheet.steps.jobDetails"),
            description: t("addJobSheet.steps.currentStep"),
        },
        {
            step: t("addJobSheet.steps.step2"),
            title: t("addJobSheet.steps.salaryDetailsBenefits"),
        },
        {
            step: t("addJobSheet.steps.step3"),
            title: t("addJobSheet.steps.jobDescriptionsRequirements"),
        },
    ], [t]);
    const form = useForm<AddJobFormValues>({
        resolver: zodResolver(addJobFormSchema),
        defaultValues: DEFAULT_ADD_JOB_FORM_VALUES,
        mode: "onBlur",
    });
    const resetForm = React.useCallback(() => {
        form.reset(DEFAULT_ADD_JOB_FORM_VALUES);
        setStep(0);
    }, [form]);
    const handleOpenChange = React.useCallback((next: boolean) => {
        setOpen(next);
        if (!next) {
            resetForm();
        }
    }, [resetForm, setOpen]);
    const handleNext = React.useCallback(async () => {
        const isCurrentStepValid = await form.trigger(STEP_FIELDS[step]);
        if (!isCurrentStepValid)
            return;
        setStep((currentStep) => currentStep < addJobSteps.length - 1 ? currentStep + 1 : currentStep);
    }, [addJobSteps.length, form, step]);
    const handleSubmit = React.useMemo(() => form.handleSubmit(async (values) => {
        await reqWithToaster(t("addJobSheet.creatingJob"), async () => {
            await createJob({
                title: values.jobTitle.trim(),
                jobType: values.jobType as "full_time" | "part_time" | "contract" | "internship",
                jobMode: values.jobMode as "on_site" | "remote" | "hybrid",
                status: "opened",
                departmentId: Number(values.departmentId),
                location: values.location.trim(),
                experienceLevel: values.experienceLevel as "intern_level" | "entry_level" | "mid_level" | "senior_level",
                requiredExperience: values.requiredExperience?.trim() || "",
                jobPostDate: new Date().toISOString().split("T")[0],
                startDate: toISODate(values.startDate),
                untilClosed: values.untilClosed,
                endDate: values.untilClosed
                    ? undefined
                    : values.endDate
                        ? toISODate(values.endDate)
                        : undefined,
                currencyType: values.currencyType,
                salaryMin: values.salaryRangeMin,
                salaryMax: values.salaryRangeMax,
                bonusAvailability: values.bonusAvailability === "yes",
                healthInsurance: values.healthInsurance === "yes",
                paidTimeOff: values.paidTimeOff === "yes",
                aboutCompanyDescription: values.companyDescription.trim(),
                jobRequirements: values.jobRequirements.trim(),
                jobSkills: values.jobSkills,
            }).unwrap();
            handleOpenChange(false);
        });
    }), [createJob, form, handleOpenChange, reqWithToaster, t]);
    const handleBack = React.useCallback(() => {
        if (step > 0) {
            setStep((currentStep) => currentStep - 1);
            return;
        }
        handleOpenChange(false);
    }, [handleOpenChange, step]);
    const handleStepChange = React.useCallback((nextStep: number) => {
        if (nextStep <= step) {
            setStep(nextStep);
        }
    }, [step]);
    const stepContent = step === 0 ? (<JobDetailsStep form={form}/>) : step === 1 ? (<SalaryDetailsBenefitsStep form={form}/>) : (<JobDescriptionsRequirementsStep form={form}/>);
    const isLastStep = step === addJobSteps.length - 1;
    return (<Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger {...triggerProps(trigger ?? (<Button type="button" size="lg">
              <Plus className="size-4"/>
              {t("addJobSheet.addNewJob")}
            </Button>))}/>

      <SheetContent side="end" hideClose={!false} className={cn("!top-2 !bottom-2 !end-2 h-auto !max-w-3xl gap-0 rounded-2xl border border-border bg-background p-0 text-start shadow-[0px_20px_40px_color-mix(in_oklab,var(--foreground)_12%,transparent)]")}>
        <div className="flex items-center gap-3 border-b border-border px-6 pt-4 pb-3">
          <SheetTitle className="flex-1 text-2xl font-semibold text-foreground">
            {t("addJobSheet.addNewJob")}
          </SheetTitle>
          <SheetClose render={<button type="button" className="grid size-6 place-items-center rounded-md text-secondary transition-colors hover:bg-gray"/>}>
            <X className="size-5"/>
            <span className="sr-only">{t("addJobSheet.close")}</span>
          </SheetClose>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:gap-6">
          <StepRail steps={addJobSteps} currentStep={step} onStepChange={handleStepChange}/>

          <div className="flex-1 py-4">
            <FormProvider {...form}>{stepContent}</FormProvider>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-gray px-5 py-6">
          <Button type="button" size="lg" variant="secondary" className="min-w-[65px] rounded-lg border-border bg-background px-4 text-sm font-medium text-secondary" onClick={handleBack} disabled={isCreatingJob}>
            {t("addJobSheet.back")}
          </Button>
          <Button type="button" size="lg" className="min-w-[57px] rounded-lg px-4 text-sm font-medium" onClick={isLastStep ? handleSubmit : handleNext} disabled={isCreatingJob}>
            {isLastStep ? t("addJobSheet.submit") : t("addJobSheet.next")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>);
}
