// The wizard's address: /campaigns/new/<type>/<step>?id=<campaign>. The campaign comes from the
// address only (MKT-009), so New campaign never writes into a draft left from an earlier visit.
import type { CampaignObjective } from "@/types/campaignTypes";
import { getCampaignStepIds, resolveCampaignObjective, type CampaignStepId } from "./workflow";

export const CAMPAIGN_TYPE_SLUGS: Record<CampaignObjective, string> = {
  PAID_SOCIAL: "paid-social",
  GOOGLE_SEARCH: "google-search",
  SOCIAL_MEDIA: "social-media",
  MESSAGING: "messaging",
};

const SLUG_TO_OBJECTIVE = Object.fromEntries(Object.entries(CAMPAIGN_TYPE_SLUGS).map(([o, s]) => [s, o])) as Record<string, CampaignObjective>;

export const DEFAULT_CAMPAIGN_TYPE_SLUG = CAMPAIGN_TYPE_SLUGS.GOOGLE_SEARCH;
export const DEFAULT_CAMPAIGN_STEP_SLUG: CampaignStepId = "details";

export function objectiveToSlug(objective: string | undefined | null): string {
  return CAMPAIGN_TYPE_SLUGS[resolveCampaignObjective(objective)];
}

export function slugToObjective(slug: string | undefined): CampaignObjective | null {
  return slug ? (SLUG_TO_OBJECTIVE[slug] ?? null) : null;
}

export function buildCampaignNewPath(typeSlug: string, stepSlug: string, campaignId?: string | null): string {
  const base = `/campaigns/new/${typeSlug}/${stepSlug}`;
  return campaignId ? `${base}?id=${encodeURIComponent(campaignId)}` : base;
}

/** The wizard for a campaign of this type, at a step. */
export function wizardPath(objectiveOrType: string | undefined | null, step: CampaignStepId, campaignId?: string | null): string {
  return buildCampaignNewPath(objectiveToSlug(objectiveOrType), step, campaignId);
}

export function getDefaultCampaignNewPath(): string {
  return buildCampaignNewPath(DEFAULT_CAMPAIGN_TYPE_SLUG, DEFAULT_CAMPAIGN_STEP_SLUG);
}

export function resolveCampaignNewPath(typeSlug: string | undefined, stepSlug: string | undefined) {
  const objective = slugToObjective(typeSlug) ?? resolveCampaignObjective(undefined);
  const steps = getCampaignStepIds(objective);
  const index = Math.max(0, steps.indexOf(stepSlug as CampaignStepId));
  const resolvedTypeSlug = CAMPAIGN_TYPE_SLUGS[objective];
  const resolvedStep = steps[index];
  return {
    objective,
    typeSlug: resolvedTypeSlug,
    stepSlug: resolvedStep,
    stepIndex: index,
    isCanonical: typeSlug === resolvedTypeSlug && stepSlug === resolvedStep,
  };
}
