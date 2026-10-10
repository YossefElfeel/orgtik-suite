// The wizard's steps per campaign type, and what the server's draft says about each of them. The
// stepper used to know only the step in the address, so a step reached once could never be opened
// again, and a deep link to Review published nothing (MKT-043, MKT-054). Each step's state now
// comes from the saved campaign: a step with its data saved is complete and can be opened.
import type { CampaignObjective } from "@/types/campaignTypes";
import type {
  CampaignApiType,
  CampaignOnboardingStep,
  ICreatedCampaign,
} from "@/types/campaigns";

export type CampaignStepId =
  | "details"
  | "settings"
  | "ad-groups"
  | "ad-sets"
  | "posts"
  | "audience"
  | "message"
  | "review";

const STEPS: Record<CampaignObjective, CampaignStepId[]> = {
  GOOGLE_SEARCH: ["details", "settings", "ad-groups", "review"],
  PAID_SOCIAL: ["details", "settings", "ad-sets", "review"],
  SOCIAL_MEDIA: ["details", "posts", "review"],
  MESSAGING: ["details", "audience", "message", "review"],
};

export const OBJECTIVE_TO_API_TYPE: Record<CampaignObjective, CampaignApiType> =
  {
    PAID_SOCIAL: "PAID_SOCIAL_ADS",
    GOOGLE_SEARCH: "GOOGLE_SEARCH_ADS",
    SOCIAL_MEDIA: "SOCIAL_MEDIA",
    MESSAGING: "MESSAGING",
  };

export const API_TYPE_TO_OBJECTIVE: Record<CampaignApiType, CampaignObjective> =
  {
    PAID_SOCIAL_ADS: "PAID_SOCIAL",
    GOOGLE_SEARCH_ADS: "GOOGLE_SEARCH",
    SOCIAL_MEDIA: "SOCIAL_MEDIA",
    MESSAGING: "MESSAGING",
  };

/** The onboarding step a wizard step saves to (Details saves through PATCH /campaigns/:id). */
export const ONBOARDING_STEP: Partial<
  Record<CampaignStepId, CampaignOnboardingStep>
> = {
  settings: "SETTINGS",
  "ad-groups": "AD_GROUPS",
  "ad-sets": "AD_SETS_AND_ADS",
  posts: "POSTS",
  message: "MESSAGE",
  review: "REVIEW",
};

export function resolveCampaignObjective(
  objective: string | undefined | null,
): CampaignObjective {
  if (
    objective === "PAID_SOCIAL" ||
    objective === "GOOGLE_SEARCH" ||
    objective === "SOCIAL_MEDIA" ||
    objective === "MESSAGING"
  )
    return objective;
  if (objective && objective in API_TYPE_TO_OBJECTIVE)
    return API_TYPE_TO_OBJECTIVE[objective as CampaignApiType];
  return "GOOGLE_SEARCH";
}

export function getCampaignStepIds(
  objective: string | undefined | null,
): CampaignStepId[] {
  return STEPS[resolveCampaignObjective(objective)];
}

/** Whether a step's data is saved on the campaign. Review is complete once published. */
export function isStepComplete(
  step: CampaignStepId,
  campaign: ICreatedCampaign | undefined | null,
): boolean {
  if (!campaign) return false;
  const cfg = campaign.configuration ?? {};
  const sets = campaign.adSets ?? [];
  switch (step) {
    case "details":
      return Boolean(campaign.id && campaign.name);
    case "settings":
      if (campaign.type === "GOOGLE_SEARCH_ADS")
        return Boolean(
          cfg.integrationId &&
          Number(cfg.budgetAmount) > 0 &&
          (cfg.locations?.length ?? 0) > 0,
        );
      return Number(cfg.budgetAmount) > 0;
    case "ad-groups":
      return campaign.type === "GOOGLE_SEARCH_ADS" && sets.length > 0;
    case "ad-sets":
      return (
        campaign.type === "PAID_SOCIAL_ADS" &&
        sets.length > 0 &&
        sets.every((s) => (s.ads?.length ?? 0) > 0)
      );
    case "posts":
      return campaign.type === "SOCIAL_MEDIA" && sets.length > 0;
    case "audience": {
      const c = (sets[0]?.configuration ?? {}) as {
        audienceId?: string;
        importId?: string;
        crmRecipientRefs?: { contactId: string }[];
      };
      return (
        campaign.type === "MESSAGING" &&
        Boolean(c.crmRecipientRefs?.length || c.audienceId || c.importId)
      );
    }
    case "message": {
      const c = (sets[0]?.configuration ?? {}) as {
        templateId?: string;
        senderConfigId?: string;
      };
      return (
        campaign.type === "MESSAGING" &&
        Boolean(c.templateId && c.senderConfigId)
      );
    }
    case "review":
      return Boolean(campaign.publishedAt) || Boolean(campaign.isComplete);
  }
}

/** The steps before Review whose data is missing: what a deep link to Review must list. */
export function missingSteps(
  objective: string,
  campaign: ICreatedCampaign | undefined | null,
): CampaignStepId[] {
  return getCampaignStepIds(objective).filter(
    (s) => s !== "review" && !isStepComplete(s, campaign),
  );
}

/** The first step still to do: where "Continue setup" opens the wizard. */
export function nextSetupStep(campaign: ICreatedCampaign): CampaignStepId {
  const steps = getCampaignStepIds(campaign.type);
  return (
    steps.find((s) => s !== "review" && !isStepComplete(s, campaign)) ??
    "review"
  );
}
