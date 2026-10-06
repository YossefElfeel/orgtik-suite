export type CampaignStatus = "DRAFT" | "READY" | "RUNNING" | "PAUSED" | "FAILED"

export type AdPlatform = "FACEBOOK" | "GOOGLE" | "INSTAGRAM" | "X" | "LINKEDIN" | "TIKTOK"

export interface ICampaignAudience {
    ageMin: number;
    ageMax: number;
    genders: string[];
    locations: {
        countries: string[];
        cities: string[];
    };
    interests?: string[];
    includeEngagedUsers: boolean;
}

export interface ICampaignKeyword {
    text: string;
    matchType: "BROAD" | "PHRASE" | "EXACT";
}

export interface ICampaignResponsiveSearchAd {
    id: string;
    name: string;
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
    path1?: string;
    path2?: string;
    status?: string;
}

export interface ICampaignSocialMediaPost {
    id: string;
    title: string;
    source: "EXISTING" | "NEW";
    postId?: string;
    mediaCount?: number;
    contentType?: string;
    caption?: string;
    content?: string;
    status?: "DRAFT" | "READY";
    approvalStatus?: "pending" | "approved" | "rejected";
}

export interface ICampaignSocialMediaAdSet {
    id: string;
    platform: string;
    posts: ICampaignSocialMediaPost[];
}

export interface ICampaignPaidSocialAdCreative {
    source: "EXISTING" | "NEW";
    postId?: string;
    title: string;
    mediaCount?: number;
    contentType?: string;
    caption?: string;
    content?: string;
    status?: "DRAFT" | "READY";
}

export interface ICampaignPaidSocialAd {
    id: string;
    name: string;
    creative: ICampaignPaidSocialAdCreative | null;
    callToAction: string;
}

export interface ICampaignPaidSocialAdSet {
    id: string;
    name?: string;
    platform: string;
    integrationId?: string;
    overrides: {
        budget: {
            enabled: boolean;
            amount?: number;
            currency?: string;
            type?: "DAILY" | "LIFETIME";
        };
        audience: {
            enabled: boolean;
            locations?: string[];
            ageMin?: number;
            ageMax?: number;
            gender?: "ALL" | "MALE" | "FEMALE";
            interests?: string[];
        };
        schedule: {
            enabled: boolean;
            startDate?: string;
            endDate?: string;
            startTime?: string;
            endTime?: string;
        };
    };
    ads: ICampaignPaidSocialAd[];
}

export interface ICampaignAdGroup {
    id: string;
    name: string;
    keywords: ICampaignKeyword[];
    negativeKeywords?: ICampaignKeyword[];
    defaultBid?: number | "";
    responsiveSearchAds: ICampaignResponsiveSearchAd[];
}

export type CampaignApproverStatus = "pending" | "approved" | "rejected";

/** Reviewer assignment returned by campaign approval APIs */
export interface ICampaignReviewer {
    id: string;
    reviewerUserId: number;
    status: string;
    note?: string | null;
    decidedAt?: string | null;
    reviewerUser?: {
        id?: number;
        email?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string | null;
        profile?: { jobTitle?: string };
    };
}

export interface ICampaignApprover {
    id: string | number;
    /** Campaign reviewer assignment UUID (DELETE /campaigns/:id/reviewers/:reviewerId) */
    reviewerRecordId?: string;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
    status: CampaignApproverStatus;
    isMine?: boolean;
}

export interface ICampaignComment {
    id: string;
    campaignId?: string;
    userId?: number;
    text: string;
    createdAt: string;
    updatedAt?: string;
    user?: {
        id?: number;
        firstName?: string;
        lastName?: string;
        email?: string;
        avatar?: string;
        name?: string;
    };
    type?: "comment" | "activity";
}

export interface ICampaign {
    id: string;
    name: string;
    type: AdPlatform[];
    objective: string;
    description: string;
    budget: number;
    status: CampaignStatus;
    scheduledAt?: string;
    audience: ICampaignAudience;
    createdAt: string;
    updatedAt?: string;
    /** Extended detail fields (when returned by GET /ads/campaigns/:id) */
    category?: string | string[];
    budgetCurrency?: string;
    budgetType?: "DAILY" | "LIFETIME";
    adObjective?: string;
    biddingStrategy?: string;
    networks?: string[];
    locationsText?: string;
    languages?: string;
    schedule?: {
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
    };
    workflowState?: string;
    approvalStatus?: string;
    approvalNote?: string | null;
    adGroups?: ICampaignAdGroup[];
    socialMediaAdSets?: ICampaignSocialMediaAdSet[];
    paidSocialAdSets?: ICampaignPaidSocialAdSet[];
    approvers?: ICampaignApprover[];
    reviewers?: ICampaignReviewer[];
    comments?: ICampaignComment[];
    messagingAudience?: {
        sourceType: "COMPANY" | "UPLOAD";
        audienceId: string;
        audienceLabel?: string;
        segmentId: string;
        segmentLabel?: string;
        filters: { source: string; type: string; interest: string };
        qualifiedOnly: boolean;
        uploadFileName: string;
        importId: string;
        saveAsSegment: boolean;
    };
    messagingMessage?: {
        channel: "EMAIL" | "SMS" | "WHATSAPP";
        sender: string;
        senderName?: string;
        templateMode: "EXISTING" | "CREATE_NEW";
        templateId: string;
        templateName?: string;
        templateSubject?: string;
        templateBody: string;
        schedule: {
            startDate: string;
            endDate: string;
            startTime: string;
            endTime: string;
        };
    };
}

export type ICampaignDetails = ICampaign;

/** API campaign type enum for POST /campaigns */
export type CampaignApiType =
    | "SOCIAL_MEDIA"
    | "PAID_SOCIAL_ADS"
    | "GOOGLE_SEARCH_ADS"
    | "MESSAGING";

/** Draft shell payload for POST /campaigns (basic information step) */
export interface ICreateCampaignDTO {
    name: string;
    type: CampaignApiType;
    categoryNames?: string[];
    description?: string;
}

/** Campaign shell returned by POST /campaigns and GET /campaigns/:id */
export interface ICreatedCampaign {
    id: string;
    userId?: number;
    projectId?: string;
    type: CampaignApiType;
    name: string;
    description?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    status?: string;
    isComplete?: boolean;
    workflowState?: string;
    approvalStatus?: string;
    approvalNote?: string | null;
    approvalVersion?: number;
    configuration?: {
        objective?: string;
        budgetAmount?: number;
        budgetType?: string;
        /** The ad account's currency, set by the server on the first Settings save (MKT-011). */
        budgetCurrency?: string;
        /** Google Search Ads – specific fields */
        integrationId?: string;
        biddingStrategy?: string;
        networks?: string[];
        locations?: string[];
        languages?: string[];
        /** Paid Social – specific fields */
        audience?: {
            ageMin?: number;
            ageMax?: number;
            gender?: string;
            locations?: string[];
            interests?: string[];
        };
    };
    categories?: { name: string }[];
    adSets?: {
        id: string;
        name: string;
        platform: string;
        deliveryPlatform?: string;
        integrationId?: string;
        startAt?: string | null;
        endAt?: string | null;
        configuration?: {
            /** Google Search Ads ad-group fields */
            defaultBidMicros?: number;
            keywords?: ICampaignKeyword[];
            negativeKeywords?: ICampaignKeyword[];
            /** Generic fallthrough */
            [key: string]: unknown;
        };
        ads?: {
            id?: string;
            name?: string;
            unifiedPostTargetId?: string;
            callToAction?: string;
            /** Google Search Ads RSA configuration */
            configuration?: {
                finalUrl?: string;
                headlines?: string[];
                descriptions?: string[];
                displayPath?: string[];
                [key: string]: unknown;
            };
            creative?: {
                title?: string;
                source?: string;
                postId?: string;
            };
        }[];
    }[];
    reviewers?: ICampaignReviewer[];
    /** Top-level copy of configuration.budgetCurrency. */
    budgetCurrency?: string | null;
    /** The wizard step the server expects next (the furthest one reached). */
    onboardingStep?: CampaignOnboardingStep;
    publishedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type CampaignOnboardingStep =
    | "DETAILS"
    | "SETTINGS"
    | "POSTS"
    | "AD_SETS_AND_ADS"
    | "AD_GROUPS"
    | "MESSAGE"
    | "REVIEW";

export interface ICampaignOnboardingDetailsData {
    step: "DETAILS" | string;
    name?: string;
    description?: string | null;
    type?: string;
    categoryNames?: string[];
}

export type PaidSocialApiObjective =
    | "OUTCOME_AWARENESS"
    | "OUTCOME_TRAFFIC"
    | "OUTCOME_ENGAGEMENT"
    | "OUTCOME_LEADS"
    | "OUTCOME_APP_PROMOTION"
    | "OUTCOME_SALES";

export interface ICampaignOnboardingAudience {
    locations: string[];
    ageMin: number;
    ageMax: number;
    gender: "ALL" | "MALE" | "FEMALE";
    interests?: string[];
}

export type GoogleSearchApiObjective =
    | "WEBSITE_TRAFFIC"
    | "CONVERSIONS"
    | "LEADS";

export interface ICampaignOnboardingPaidSocialSettingsPayload {
    step: "SETTINGS";
    startAt?: string;
    endAt?: string;
    configuration: {
        objective: PaidSocialApiObjective;
        budgetAmount: number;
        budgetType: "DAILY" | "LIFETIME";
        audience: ICampaignOnboardingAudience;
    };
}

export interface ICampaignOnboardingGoogleSearchSettingsPayload {
    step: "SETTINGS";
    startAt?: string;
    endAt?: string;
    configuration: {
        integrationId: string;
        objective: GoogleSearchApiObjective;
        budgetAmount: number;
        budgetType: "DAILY" | "LIFETIME";
        biddingStrategy: string;
        networks: string[];
        locations: string[];
        languages: string[];
    };
}

export type ICampaignOnboardingSettingsPayload =
    | ICampaignOnboardingPaidSocialSettingsPayload
    | ICampaignOnboardingGoogleSearchSettingsPayload;

export interface ICampaignOnboardingAdSetAd {
    name: string;
    unifiedPostTargetId: string;
    callToAction: string;
}

export interface ICampaignOnboardingAdSet {
    name: string;
    integrationId: string;
    startAt?: string;
    endAt?: string;
    configuration?: {
        budgetAmount?: number;
        audience?: ICampaignOnboardingAudience;
    };
    ads: ICampaignOnboardingAdSetAd[];
}

export interface ICampaignOnboardingAdSetsPayload {
    step: "AD_SETS_AND_ADS";
    adSets: ICampaignOnboardingAdSet[];
}

export interface ICampaignOnboardingPostsAd {
    name: string;
    unifiedPostTargetId: string;
}

export interface ICampaignOnboardingPostsAdSet {
    name: string;
    integrationId: string;
    startAt?: string;
    endAt?: string;
    ads: ICampaignOnboardingPostsAd[];
}

export interface ICampaignOnboardingPostsPayload {
    step: "POSTS";
    startAt?: string;
    endAt?: string;
    adSets: ICampaignOnboardingPostsAdSet[];
}

export interface ICampaignOnboardingGoogleAdGroupAd {
    name: string;
    configuration: {
        finalUrl: string;
        headlines: string[];
        descriptions: string[];
        displayPath?: string[];
    };
}

export interface ICampaignOnboardingGoogleAdGroup {
    name: string;
    configuration: {
        defaultBidMicros?: number;
        keywords?: ICampaignKeyword[];
        negativeKeywords?: ICampaignKeyword[];
    };
    ads: ICampaignOnboardingGoogleAdGroupAd[];
}

export interface ICampaignOnboardingAdGroupsPayload {
    step: "AD_GROUPS";
    adSets: ICampaignOnboardingGoogleAdGroup[];
}

export interface ICampaignOnboardingAdGroupsData {
    step: "AD_GROUPS" | string;
    adSets?: ICampaignOnboardingGoogleAdGroup[];
}

export interface ICampaignOnboardingMessagingAudienceImport {
    id?: string;
    fileName?: string;
    status?: string;
    savedAudienceId?: string | null;
}

export interface ICampaignOnboardingMessagingAdSetConfiguration {
    channel: "EMAIL" | "SMS" | "WHATSAPP";
    audienceId: string;
    segmentId?: string;
    importId?: string;
    senderConfigId: string;
    templateId: string;
    audienceImport?: ICampaignOnboardingMessagingAudienceImport | null;
}

export interface ICampaignOnboardingMessagingAdSet {
    name: string;
    configuration: ICampaignOnboardingMessagingAdSetConfiguration;
}

export interface ICampaignOnboardingMessagePayload {
    step: "MESSAGE";
    startAt?: string;
    adSets: ICampaignOnboardingMessagingAdSet[];
}

export interface ICampaignOnboardingMessageData {
    step: "MESSAGE" | string;
    startAt?: string | null;
    adSets?: ICampaignOnboardingMessagingAdSet[];
}

export interface ICampaignOnboardingReviewPayload {
    step: "REVIEW";
    approval: {
        reviewerIds: number[];
        note?: string;
    };
    saveAsDraft: boolean;
}

export type ICampaignOnboardingPayload =
    | ICampaignOnboardingSettingsPayload
    | ICampaignOnboardingPostsPayload
    | ICampaignOnboardingAdSetsPayload
    | ICampaignOnboardingAdGroupsPayload
    | ICampaignOnboardingMessagePayload
    | ICampaignOnboardingReviewPayload;

export interface ICampaignOnboardingSettingsData {
    step: "SETTINGS" | string;
    startAt?: string | null;
    endAt?: string | null;
    configuration?: {
        integrationId?: string;
        objective?: PaidSocialApiObjective | GoogleSearchApiObjective | string;
        budgetAmount?: number;
        budgetType?: "DAILY" | "LIFETIME" | string;
        biddingStrategy?: string;
        networks?: string[];
        locations?: string[];
        languages?: string[];
        audience?: Partial<ICampaignOnboardingAudience>;
    };
}

export interface ICampaignOnboardingStepState extends ICampaignOnboardingSettingsData {
    [key: string]: unknown;
}

export interface IMetaOption {
    value: string;
    label: string;
}

export interface ICampaignMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/** Lean row returned by GET /campaigns list */
export interface ICampaignListItem {
    id: string;
    type: CampaignApiType;
    name: string;
    description?: string | null;
    startAt: string | null;
    endAt: string | null;
    isComplete: boolean;
    workflowState: string;
    approvalStatus: string;
    status?: string;
    updatedAt?: string;
}

export interface ICampaignListParams {
    page?: number;
    limit?: number;
    search?: string;
    type?: CampaignApiType;
    status?: string;
}

export interface ICampaignListResponse {
    items: ICampaignListItem[];
    meta: ICampaignMeta;
}
