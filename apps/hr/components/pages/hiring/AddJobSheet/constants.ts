import type { AddJobFormValues } from "./types";

export const JOB_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const;

export const JOB_MODES = ["on_site", "remote", "hybrid"] as const;

export const EXPERIENCE_LEVELS = [
  "intern_level",
  "entry_level",
  "mid_level",
  "senior_level",
] as const;

export const REQUIRED_EXPERIENCE_OPTIONS = [
  "+1 year",
  "+2 years",
  "+3 years",
  "+5 years",
] as const;

/** Years behind each stored required-experience value (the value itself goes to the API unchanged). */
export const REQUIRED_EXPERIENCE_YEARS: Record<string, number> = {
  "+1 year": 1,
  "+2 years": 2,
  "+3 years": 3,
  "+5 years": 5,
};

export const CURRENCY_OPTIONS = ["CHF", "USD", "EUR", "GBP"] as const;
export const JOB_SKILLS = [
  "Creative",
  "Design",
  "Teamwork",
  "Communication",
  "Problem solving",
  "Leadership",
] as const;

/** Catalog key (jobs.addJobSheet.options.skills.*) for each stored skill value. */
export const JOB_SKILL_LABEL_KEYS: Record<(typeof JOB_SKILLS)[number], string> = {
  Creative: "creative",
  Design: "design",
  Teamwork: "teamwork",
  Communication: "communication",
  "Problem solving": "problemSolving",
  Leadership: "leadership",
};

export const DEFAULT_ADD_JOB_FORM_VALUES: AddJobFormValues = {
  jobTitle: "",
  jobType: "full_time",
  jobMode: "on_site",
  departmentId: "",
  location: "",
  experienceLevel: "intern_level",
  requiredExperience: "+3 years",
  untilClosed: false,
  startDate: "",
  endDate: "",
  currencyType: "USD",
  salaryRangeMin: 0,
  salaryRangeMax: 0,
  accommodationType: "own",
  bonusAvailability: "yes",
  healthInsurance: "yes",
  paidTimeOff: "yes",
  companyDescription: "",
  jobRequirements: "",
  jobSkills: [],
};
