"use client";
import { X as XIcon } from "@phosphor-icons/react";
import { isValidElement } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SuccessDialog } from "@/components/shared/SuccessDialog";
import { Sheet, SheetClose, SheetContent, DialogTitle as SheetTitle, SheetTrigger } from "@orgtik/ui";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getDefaultEmployeeFormValues } from "@/types/employee";
import { WIZARD_STEP_KEYS, wizardStepIndexFromSearch, } from "./wizard-keys";
import { WIZARD_STEP_TO_API_KEY } from "./utils";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { EmployeeInfoStep } from "./steps/EmployeeInfoStep";
import { BankInfoStep } from "./steps/BankInfoStep";
import { AttachmentsStep } from "./steps/AttachmentsStep";
import { SalaryStep } from "./steps/SalaryStep";
import { ContractStep } from "./steps/ContractStep";
import { DaysOffStep } from "./steps/DaysOffStep";
import { PermissionsStep } from "./steps/PermissionsStep";
import { WizardStep } from "@/components/shared/WizardStep";
import { EmployeeWizardProvider, useEmployeeWizard } from "./EmployeeWizardContext";
import { useEffect, useState } from "react";
const WIZARD_STEPS = {
    personal: PersonalInfoStep,
    employee: EmployeeInfoStep,
    bank: BankInfoStep,
    salary: SalaryStep,
    contract: ContractStep,
    daysOff: DaysOffStep,
    permissions: PermissionsStep,
    attachments: AttachmentsStep,
};
function WizardContent() {
    const t = useTranslations("createUpdateEmployee");
    const { currentStep, isEdit, setStep, completedSteps } = useEmployeeWizard();
    const stepKey = WIZARD_STEP_KEYS[currentStep];
    const StepComponent = WIZARD_STEPS[stepKey];
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const moveToStep = (idx: number) => {
        // set the step param in the url with keeping the employee_params and employee_id parameter
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", WIZARD_STEP_KEYS[idx]);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        setStep(idx);
    };
    return (<div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <SheetTitle className="text-xl font-semibold text-foreground">
          {isEdit ? t("editEmployee") : t("addEmployee")}
        </SheetTitle>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 overflow-y-auto border-e border-border bg-muted/30 p-6">
          <nav className="space-y-1">
            {WIZARD_STEP_KEYS.map((key, idx) => {
            const apiKey = WIZARD_STEP_TO_API_KEY[key];
            const isCompleted = completedSteps.includes(apiKey);
            const isActive = idx === currentStep;
            return (<WizardStep key={key} step={idx + 1} label={t(`steps.${key}.nav` as any)} title={t(`steps.${key}.heading` as any)} status={isActive ? "active" : isCompleted ? "done" : "pending"} onClick={() => (isCompleted || idx <= currentStep) && moveToStep(idx)} disabled={!isCompleted}/>);
        })}
          </nav>
        </aside>

        <main className="flex-1 max-h-[calc(100vh-100px)] overflow-y-auto p-8">
          <StepComponent />
        </main>
      </div>
    </div>);
}
import { useGetEmployeeQuery } from "@/redux/features/employee/employeeApi";
import type { CreateUpdateEmployeeSheetProps } from "@/types/employee";
export function CreateUpdateEmployeeSheet({ children, mode }: CreateUpdateEmployeeSheetProps) {
    const t = useTranslations("createUpdateEmployee");
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const isEdit = mode === "edit";
    // Which success message to show: decided when the wizard finishes, before the sheet closes and
    // clears the address (it always said "created", HR-029).
    const [finished, setFinished] = useState<"create" | "edit">("create");
    const employeeId = searchParams.get("employee_id");
    const { data: employeeData } = useGetEmployeeQuery(employeeId!, { skip: !employeeId });
    const params = new URLSearchParams(searchParams.toString());
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Closing drops the wizard's place (mode, employee, step) and keeps the list's view.
            const view = params.get("view");
            router.replace(view === "table" || view === "grid" ? `${pathname}?view=${view}` : pathname, { scroll: false });
        }
    };
    // A refresh mid-wizard reopens the right sheet: the edit sheet for mode=edit, the add sheet otherwise.
    useEffect(() => {
        const stepIdx = wizardStepIndexFromSearch(searchParams.toString());
        const urlIsEdit = params.get("mode") === "edit";
        if (stepIdx !== null && urlIsEdit === isEdit && !isOpen)
            setIsOpen(true);
    }, []);
    const handleComplete = () => {
        setFinished(isEdit ? "edit" : "create");
        handleOpenChange(false);
        setSuccessOpen(true);
    };
    return (<>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        {/* The trigger is the caller's own button: rendering it as the trigger keeps one button, not a button inside a button (HR-015). */}
        {isValidElement(children) ? <SheetTrigger render={children}/> : null}
        <SheetContent side="bottom" className="w-full max-w-[1400px] p-0 border-none">
          <EmployeeWizardProvider totalSteps={WIZARD_STEP_KEYS.length} initialData={getDefaultEmployeeFormValues()} initialStep={wizardStepIndexFromSearch(searchParams.toString()) || 0} initialCompletedSteps={employeeData?.data?.completedSteps || []} isEdit={isEdit} onComplete={handleComplete} onCancel={() => handleOpenChange(false)}>
            <WizardContent />
          </EmployeeWizardProvider>
        </SheetContent>
      </Sheet>

      <SuccessDialog open={successOpen} onOpenChange={setSuccessOpen} title={t("success.title")} message={finished === "edit" ? t("success.messageEdit") : t("success.messageCreate")} primaryLabel={t("success.primary")} onPrimaryAction={() => setSuccessOpen(false)}/>
    </>);
}
