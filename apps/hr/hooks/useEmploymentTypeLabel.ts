"use client";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

// The API's employee codes (the add-employee wizard sends the same ones) and their catalog keys.
const EMPLOYMENT: Record<string, string> = { full_time: "fullTime", part_time: "partTime", contract: "contract", intern: "intern" };
const GENDER: Record<string, string> = { male: "male", female: "female", other: "other" };
const STATUS: Record<string, string> = { active: "active", inactive: "inactive", probation: "probation", terminated: "terminated" };
const WORK_TYPE: Record<string, string> = { remote: "remote", onsite: "onSite", on_site: "onSite", hybrid: "hybrid" };
// Skills the add-employee wizard offers as options; anything else is free text people typed.
const SKILL: Record<string, string> = { ui: "ui", ux: "ux", frontend: "frontend", backend: "backend", hr_ops: "hrOps" };
const PAYMENT_CYCLE: Record<string, string> = { monthly: "monthly", biweekly: "biweekly", bi_weekly: "biweekly", weekly: "weekly" };

/** Labels for an employee's codes in the reader's language. An unknown code is shown as sent; empty is "-". */
export function useEmployeeLabels() {
  const t = useTranslations("createUpdateEmployee.options");
  const locale = useLocale();
  return useMemo(() => {
    const from = (group: string, map: Record<string, string>) => (code?: string | null) => {
      if (!code) return "-";
      const key = map[code.toLowerCase()];
      return key ? t(`${group}.${key}`) : code;
    };
    let regions: Intl.DisplayNames | null = null;
    try { regions = new Intl.DisplayNames([locale], { type: "region" }); } catch { regions = null; }
    return {
      employmentType: from("employment", EMPLOYMENT),
      gender: from("gender", GENDER),
      status: from("status", STATUS),
      workType: from("workType", WORK_TYPE),
      paymentCycle: from("paymentCycle", PAYMENT_CYCLE),
      /** A wizard skill code gets its label; free text comes back as null (show it as written). */
      skillCode: (code: string) => {
        const key = SKILL[code.toLowerCase()];
        return key ? t(`skills.${key}`) : null;
      },
      /** "EG" → "Egypt" / "مصر"; anything that isn't a region code is shown as sent. */
      nationality: (code?: string | null) => {
        if (!code) return "-";
        if (!/^[A-Za-z]{2}$/.test(code) || !regions) return code;
        return regions.of(code.toUpperCase()) ?? code;
      },
    };
  }, [t, locale]);
}

/** "full_time" → "Full-time" in the reader's language. */
export function useEmploymentTypeLabel() {
  return useEmployeeLabels().employmentType;
}
