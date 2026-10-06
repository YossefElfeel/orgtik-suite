import type { UseFormReturn } from "react-hook-form";
import type { ReactNode } from "react";

export type AddJobSheetProps = {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type AddJobFormValues = {
  jobTitle: string;
  jobType: string;
  jobMode: string;
  departmentId: string;
  location: string;
  experienceLevel: string;
  requiredExperience: string;
  untilClosed: boolean;
  startDate: string | Date;
  endDate: string | Date;
  currencyType: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  accommodationType: string;
  bonusAvailability: string;
  healthInsurance: string;
  paidTimeOff: string;
  companyDescription: string;
  jobRequirements: string;
  jobSkills: string[];
};

export type AddJobStep = {
  step: string;
  title: string;
  description?: string;
};

export type AddJobStepContentProps = {
  form: UseFormReturn<AddJobFormValues>;
};

export type AddJobDepartmentOption = {
  value: string;
  label: string;
};
