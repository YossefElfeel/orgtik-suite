export const WIZARD_STEP_KEYS = [
  "personal",
  "employee",
  "bank",
  "salary",
  "contract",
  "daysOff",
  "permissions",
  "attachments",
] as const;

export type WizardStepKey = (typeof WIZARD_STEP_KEYS)[number];

/** Query param while this sheet is open, e.g. `?step=bank`. */
export const EMPLOYEE_WIZARD_STEP_QUERY_KEY = "step";

export function wizardStepIndexFromSearch(search: string): number | null {
  const qs = search.startsWith("?") ? search.slice(1) : search;
  const raw = new URLSearchParams(qs).get(EMPLOYEE_WIZARD_STEP_QUERY_KEY);
  if (!raw) return null;
  const idx = WIZARD_STEP_KEYS.indexOf(raw as WizardStepKey);
  return idx >= 0 ? idx : null;
}
