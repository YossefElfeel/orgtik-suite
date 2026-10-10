import type { MessagingChannel } from "@/types/messaging";

export interface MessagingTemplatePreview {
  name: string;
  subject?: string;
  body: string;
}

export type BudgetType = "DAILY" | "LIFETIME";
export type MatchType = "BROAD" | "PHRASE" | "EXACT";

export interface CampaignKeyword {
  text: string;
  matchType: MatchType;
}

export interface CampaignResponsiveSearchAd {
  id: string;
  name: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  path1?: string;
  path2?: string;
}

export interface CampaignAdGroup {
  id: string;
  name: string;
  keywords: CampaignKeyword[];
  negativeKeywords: CampaignKeyword[];
  defaultBid: number | null;
  responsiveSearchAds: CampaignResponsiveSearchAd[];
}

/** A post linked to a campaign (picked from the library or created for it). */
export interface CampaignLinkedPost {
  /** The publishing post id the API links (unifiedPostTargetId). */
  postId: string;
  title: string;
  source: "EXISTING" | "NEW";
  content?: string;
  status?: "DRAFT" | "READY";
}

export interface MessagingAudienceSelection {
  sourceType: "COMPANY" | "UPLOAD" | "CRM";
  crmRecipientRefs?: { workspaceId: string; contactId: string }[];
  audienceId: string;
  audienceLabel?: string;
  segmentId: string;
  segmentLabel?: string;
  importId: string;
  uploadFileName: string;
  saveAsAudience: boolean;
}

export type { MessagingChannel };
