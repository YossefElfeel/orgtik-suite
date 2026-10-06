"use client";

import * as React from "react";
import { type EmployeeFormValues } from "@/types/employee";

interface EmployeeWizardContextValue {
  data: Partial<EmployeeFormValues>;
  currentStep: number;
  totalSteps: number;
  isEdit: boolean;
  isLastStep: boolean;
  completedSteps: string[];
  onNext: (stepData: Partial<EmployeeFormValues>, appendParams?: Record<string, string>) => void;
  onBack: () => void;
  setStep: (step: number) => void;
  setCompletedSteps: (steps: string[]) => void;
}

const EmployeeWizardContext = React.createContext<EmployeeWizardContextValue | null>(null);

export function useEmployeeWizard() {
  const context = React.useContext(EmployeeWizardContext);
  if (!context) {
    throw new Error("useEmployeeWizard must be used within an EmployeeWizardProvider");
  }
  return context;
}

interface EmployeeWizardProviderProps {
  children: React.ReactNode;
  initialData?: Partial<EmployeeFormValues>;
  initialStep?: number;
  isEdit?: boolean;
  initialCompletedSteps?: string[];
  totalSteps: number;
  onComplete: (data: EmployeeFormValues) => void;
  onCancel: () => void;
}

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { WIZARD_STEP_KEYS, EMPLOYEE_WIZARD_STEP_QUERY_KEY } from "./wizard-keys";

export function EmployeeWizardProvider({
  children,
  initialData = {},
  initialStep = 0,
  initialCompletedSteps = [],
  isEdit = false,
  totalSteps,
  onComplete,
  onCancel,
}: EmployeeWizardProviderProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [data, setData] = React.useState<Partial<EmployeeFormValues>>(initialData);
  const [completedSteps, setCompletedSteps] = React.useState<string[]>(initialCompletedSteps);
  
  React.useEffect(() => {
    if (initialCompletedSteps.length > 0) {
      setCompletedSteps(initialCompletedSteps);
    }
  }, [initialCompletedSteps]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const onNext = React.useCallback(
    (stepData: Partial<EmployeeFormValues>, appendParams?: Record<string, string>) => {
      const stepAtCall = currentStep;
      console.log("Wizard onNext called at step:", stepAtCall);

      setData((prev) => ({ ...prev, ...stepData }));

      if (stepAtCall === totalSteps - 1) {
        onComplete({ ...data, ...stepData } as EmployeeFormValues);
      } else {
        setCurrentStep((s) => {
          if (s !== stepAtCall) {
            console.warn("Wizard: attempted multiple transitions from step", stepAtCall, "current is", s);
            return s;
          }
          const next = s + 1;
          // set the url step param  
          const params = new URLSearchParams(searchParams.toString());
          if (appendParams) {
            Object.entries(appendParams).forEach(([key, value]) => {
              params.set(key, value);
            });
          }
          params.set("step", WIZARD_STEP_KEYS[next]);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          console.log("Wizard transitioning from", s, "to", next);
          return next;
        });
      }
    },
    [currentStep, totalSteps, onComplete, data]
  );

  const onBack = React.useCallback(() => {
    if (currentStep === 0) {
      onCancel();
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", WIZARD_STEP_KEYS[currentStep - 1]);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep, onCancel]);

  const value = React.useMemo(
    () => ({
      data,
      currentStep,
      totalSteps,
      isEdit,
      isLastStep: currentStep === totalSteps - 1,
      completedSteps,
      onNext,
      onBack,
      setStep: setCurrentStep,
      setCompletedSteps,
    }),
    [data, currentStep, totalSteps, isEdit, completedSteps, onNext, onBack]
  );

  return (
    <EmployeeWizardContext.Provider value={value}>
      {children}
    </EmployeeWizardContext.Provider>
  );
}
