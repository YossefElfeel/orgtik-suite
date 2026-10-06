// Paid social: the saved campaign ↔ the Settings and Ad sets forms, and their payloads.
import { PAID_SOCIAL_API_TO_OBJECTIVE, PAID_SOCIAL_OBJECTIVE_TO_API, normalizePaidSocialCallToAction, type PaidSocialCallToAction } from "@/constants/campaigns";
import type { BudgetType, CampaignLinkedPost } from "@/lib/campaigns/types";
import type { ICampaignOnboardingAdSetsPayload, ICampaignOnboardingAudience, ICampaignOnboardingPaidSocialSettingsPayload, ICreatedCampaign } from "@/types/campaigns";

export type PaidObjective = keyof typeof PAID_SOCIAL_OBJECTIVE_TO_API;
export type Gender = "ALL" | "MALE" | "FEMALE";

export type Audience = { locations: string[]; ageMin: number; ageMax: number; gender: Gender; interests: string[] };

export type PaidSettingsValues = {
  objective: PaidObjective;
  budgetAmount: number | null;
  budgetType: BudgetType;
  audience: Audience;
  startAt: string | null;
  endAt: string | null;
};

const toGender = (g: unknown): Gender => (g === "MALE" || g === "FEMALE" ? g : "ALL");

export function audienceFrom(a: Partial<ICampaignOnboardingAudience> | undefined, fallback?: Audience): Audience {
  return {
    locations: a?.locations ?? fallback?.locations ?? [],
    ageMin: a?.ageMin ?? fallback?.ageMin ?? 18,
    ageMax: a?.ageMax ?? fallback?.ageMax ?? 65,
    gender: a?.gender ? toGender(a.gender) : (fallback?.gender ?? "ALL"),
    interests: a?.interests ?? fallback?.interests ?? [],
  };
}

export const toApiAudience = (a: Audience): ICampaignOnboardingAudience => ({
  locations: a.locations,
  ageMin: a.ageMin,
  ageMax: a.ageMax,
  gender: a.gender,
  ...(a.interests.length ? { interests: a.interests } : {}),
});

export function paidSettingsFromCampaign(c: ICreatedCampaign | undefined): PaidSettingsValues {
  const cfg = c?.configuration ?? {};
  return {
    objective: (PAID_SOCIAL_API_TO_OBJECTIVE[cfg.objective as keyof typeof PAID_SOCIAL_API_TO_OBJECTIVE] ?? "CONVERSIONS") as PaidObjective,
    budgetAmount: cfg.budgetAmount != null && Number(cfg.budgetAmount) > 0 ? Number(cfg.budgetAmount) : null,
    budgetType: cfg.budgetType === "LIFETIME" ? "LIFETIME" : "DAILY",
    audience: audienceFrom(cfg.audience as Partial<ICampaignOnboardingAudience> | undefined),
    startAt: c?.startAt ?? null,
    endAt: c?.endAt ?? null,
  };
}

export function buildPaidSocialSettingsPayload(v: PaidSettingsValues): ICampaignOnboardingPaidSocialSettingsPayload {
  return {
    step: "SETTINGS",
    ...(v.startAt ? { startAt: v.startAt } : {}),
    ...(v.endAt ? { endAt: v.endAt } : {}),
    configuration: {
      objective: PAID_SOCIAL_OBJECTIVE_TO_API[v.objective],
      budgetAmount: v.budgetAmount ?? 0,
      budgetType: v.budgetType,
      audience: toApiAudience(v.audience),
    },
  };
}

export type PaidAd = { id: string; name: string; post: CampaignLinkedPost | null; callToAction: PaidSocialCallToAction };

export type PaidAdSet = {
  id: string;
  name: string;
  platform: string;
  integrationId: string;
  budget: { enabled: boolean; amount: number | null };
  audience: { enabled: boolean; value: Audience };
  schedule: { enabled: boolean; startAt: string | null; endAt: string | null };
  ads: PaidAd[];
};

export function adSetsFromCampaign(c: ICreatedCampaign | undefined): PaidAdSet[] {
  const defaults = paidSettingsFromCampaign(c);
  return (c?.adSets ?? []).map((s) => {
    const cfg = (s.configuration ?? {}) as { budgetAmount?: number; audience?: Partial<ICampaignOnboardingAudience> };
    return {
      id: s.id || crypto.randomUUID(),
      name: s.name ?? "",
      platform: String(s.platform ?? s.deliveryPlatform ?? "").toUpperCase(),
      integrationId: s.integrationId ?? "",
      budget: { enabled: cfg.budgetAmount != null, amount: cfg.budgetAmount ?? null },
      audience: { enabled: Boolean(cfg.audience), value: audienceFrom(cfg.audience, defaults.audience) },
      schedule: { enabled: Boolean(s.startAt || s.endAt), startAt: s.startAt ?? null, endAt: s.endAt ?? null },
      ads: (s.ads ?? []).map((a) => ({
        id: a.id || crypto.randomUUID(),
        name: a.name ?? "",
        callToAction: normalizePaidSocialCallToAction(a.callToAction),
        post: a.unifiedPostTargetId ? { postId: a.unifiedPostTargetId, title: a.creative?.title || a.name || "", source: "EXISTING" } : null,
      })),
    };
  });
}

export function buildPaidSocialAdSetsPayload(sets: PaidAdSet[]): ICampaignOnboardingAdSetsPayload {
  return {
    step: "AD_SETS_AND_ADS",
    adSets: sets.map((s) => {
      const configuration: { budgetAmount?: number; audience?: ICampaignOnboardingAudience } = {};
      if (s.budget.enabled && s.budget.amount) configuration.budgetAmount = s.budget.amount;
      if (s.audience.enabled) configuration.audience = toApiAudience(s.audience.value);
      return {
        name: s.name.trim(),
        integrationId: s.integrationId,
        ...(s.schedule.enabled && s.schedule.startAt ? { startAt: s.schedule.startAt } : {}),
        ...(s.schedule.enabled && s.schedule.endAt ? { endAt: s.schedule.endAt } : {}),
        ...(Object.keys(configuration).length ? { configuration } : {}),
        ads: s.ads.filter((a) => a.post).map((a) => ({ name: a.name.trim(), unifiedPostTargetId: a.post!.postId, callToAction: a.callToAction })),
      };
    }),
  };
}

/** "SAUDI_ARABIA" style tokens for interests the API stores; typed words become tokens. */
export const toInterestToken = (text: string) => text.trim().toUpperCase().replace(/\s+/g, "_");
