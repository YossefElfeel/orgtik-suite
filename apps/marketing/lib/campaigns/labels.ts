"use client";

// The words for the campaign API's values. Raw enums (FOOD_BEVERAGE, OUTCOME_ENGAGEMENT,
// LEARN_MORE) were printed as they came (MKT-058). A value the catalog doesn't know (a category or
// interest someone typed) is shown as words, not as an upper-case token.
import { useTranslations } from "next-intl";
import { PAID_SOCIAL_API_TO_OBJECTIVE } from "@/constants/campaigns";
import { resolveCampaignObjective } from "./workflow";

type Group =
  | "type"
  | "typeDescription"
  | "category"
  | "googleObjective"
  | "bidding"
  | "network"
  | "budgetType"
  | "paidObjective"
  | "gender"
  | "cta"
  | "matchType"
  | "channel"
  | "interest";

/** "ONLINE_SHOPPING" → "Online shopping": for values typed by people, which have no catalog entry. */
export function humanize(value: string): string {
  const words = value.trim().replace(/[_-]+/g, " ").toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : value;
}

export function useCampaignLabels() {
  const t = useTranslations("CampaignEnums");
  const label = (group: Group, value: string | null | undefined) => {
    const v = String(value ?? "").toUpperCase();
    if (!v) return "";
    const key = `${group}.${v}`;
    return t.has(key) ? t(key) : humanize(String(value));
  };
  return {
    label,
    /** A campaign type, from the wizard's objective or the API's type. */
    type: (value: string | null | undefined) => label("type", resolveCampaignObjective(value)),
    typeDescription: (value: string | null | undefined) => label("typeDescription", resolveCampaignObjective(value)),
    /** Paid social objective, from the form value or the API's OUTCOME_* value. */
    paidObjective: (value: string | null | undefined) => label("paidObjective", PAID_SOCIAL_API_TO_OBJECTIVE[value as keyof typeof PAID_SOCIAL_API_TO_OBJECTIVE] ?? value),
  };
}
