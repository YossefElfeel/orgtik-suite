// The values the campaign API takes. Their words are in the catalog (CampaignEnums.*, through
// lib/campaigns/labels): raw enums such as FOOD_BEVERAGE were shown as they came (MKT-058).

export const CAMPAIGN_OBJECTIVE_VALUES = ["GOOGLE_SEARCH", "PAID_SOCIAL", "SOCIAL_MEDIA", "MESSAGING"] as const;

export const CAMPAIGN_CATEGORY_SUGGESTIONS = ["ECOMMERCE", "REAL_ESTATE", "AUTOMOTIVE", "SERVICES", "FOOD_BEVERAGE", "HEALTH"] as const;

// Google Search Ads
export const GOOGLE_AD_OBJECTIVE_VALUES = ["WEBSITE_TRAFFIC", "CONVERSIONS", "LEADS"] as const;
export const GOOGLE_BIDDING_STRATEGY_VALUES = ["MAXIMIZE_CONVERSIONS", "MAXIMIZE_CLICKS", "TARGET_CPA", "MANUAL_CPC"] as const;
export const GOOGLE_NETWORK_VALUES = ["GOOGLE_SEARCH", "SEARCH_PARTNERS", "DISPLAY_NETWORK"] as const;
export const BUDGET_TYPE_VALUES = ["DAILY", "LIFETIME"] as const;
export const KEYWORD_MATCH_TYPE_VALUES = ["PHRASE", "BROAD", "EXACT"] as const;

// Paid social
export const PAID_SOCIAL_OBJECTIVE_VALUES = ["CONVERSIONS", "TRAFFIC", "AWARENESS", "ENGAGEMENT", "LEADS", "APP_INSTALLS"] as const;
export const PAID_SOCIAL_GENDER_VALUES = ["ALL", "MALE", "FEMALE"] as const;
export const PAID_SOCIAL_INTEREST_SUGGESTIONS = ["ONLINE_SHOPPING", "FOOD_AND_DRINK", "COOKING", "FITNESS", "AUTOMOTIVE", "TRAVEL"] as const;
export const PAID_SOCIAL_PLATFORM_IDS = ["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TIKTOK"] as const;

/** Values accepted by an ad's `callToAction`. */
export const PAID_SOCIAL_CALL_TO_ACTION_VALUES = ["LEARN_MORE", "SHOP_NOW", "SIGN_UP", "CONTACT_US", "BOOK_NOW", "GET_QUOTE"] as const;
export type PaidSocialCallToAction = (typeof PAID_SOCIAL_CALL_TO_ACTION_VALUES)[number];

export function normalizePaidSocialCallToAction(value: string | undefined | null): PaidSocialCallToAction {
  return value && (PAID_SOCIAL_CALL_TO_ACTION_VALUES as readonly string[]).includes(value) ? (value as PaidSocialCallToAction) : "LEARN_MORE";
}

/** Paid social objective in the form → the API's configuration.objective. */
export const PAID_SOCIAL_OBJECTIVE_TO_API = {
  CONVERSIONS: "OUTCOME_SALES",
  TRAFFIC: "OUTCOME_TRAFFIC",
  AWARENESS: "OUTCOME_AWARENESS",
  ENGAGEMENT: "OUTCOME_ENGAGEMENT",
  LEADS: "OUTCOME_LEADS",
  APP_INSTALLS: "OUTCOME_APP_PROMOTION",
} as const;

export const PAID_SOCIAL_API_TO_OBJECTIVE = {
  OUTCOME_SALES: "CONVERSIONS",
  OUTCOME_TRAFFIC: "TRAFFIC",
  OUTCOME_AWARENESS: "AWARENESS",
  OUTCOME_ENGAGEMENT: "ENGAGEMENT",
  OUTCOME_LEADS: "LEADS",
  OUTCOME_APP_PROMOTION: "APP_INSTALLS",
} as const;

// Messaging
export const MESSAGING_CHANNEL_VALUES = ["EMAIL", "SMS", "WHATSAPP"] as const;

// Organic posts: the platforms a social media campaign can hold.
export const SOCIAL_MEDIA_PLATFORM_IDS = ["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TIKTOK", "YOUTUBE"] as const;
