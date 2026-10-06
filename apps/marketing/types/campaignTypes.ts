export const CAMPAIGN_OBJECTIVES = ["PAID_SOCIAL", "GOOGLE_SEARCH", "SOCIAL_MEDIA", "MESSAGING"] as const;

export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number];
