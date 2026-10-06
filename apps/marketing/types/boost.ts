
// Boost ads
export enum AdCallToAction {
    LEARN_MORE = "LEARN_MORE",
    SHOP_NOW = "SHOP_NOW",
    SIGN_UP = "SIGN_UP",
    CONTACT_US = "CONTACT_US",
    BOOK_NOW = "BOOK_NOW",
    APPLY_NOW = "APPLY_NOW",
    DOWNLOAD = "DOWNLOAD",
    GET_OFFER = "GET_OFFER",
    GET_QUOTE = "GET_QUOTE",
    SUBSCRIBE = "SUBSCRIBE",
    WATCH_MORE = "WATCH_MORE",
}

export enum AdExecutionStatus {
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    STOPPED = "STOPPED",
    FAILED = "FAILED",
}

export enum AdObjective {
    OUTCOME_AWARENESS = "OUTCOME_AWARENESS",
    OUTCOME_TRAFFIC = "OUTCOME_TRAFFIC",
    OUTCOME_ENGAGEMENT = "OUTCOME_ENGAGEMENT",
    OUTCOME_LEADS = "OUTCOME_LEADS",
    OUTCOME_APP_PROMOTION = "OUTCOME_APP_PROMOTION",
    OUTCOME_SALES = "OUTCOME_SALES",
}

export enum AdCurrency {
    USD = "USD",
    EUR = "EUR",
    GBP = "GBP",
    CAD = "CAD",
    AUD = "AUD",
    CHF = "CHF",
    AED = "AED",
    SAR = "SAR",
    QAR = "QAR",
    KWD = "KWD",
    JPY = "JPY",
    CNY = "CNY",
    HKD = "HKD",
    SGD = "SGD",
    INR = "INR",
    TRY = "TRY",
    BRL = "BRL",
    MXN = "MXN",
    ZAR = "ZAR",
    EGP = "EGP",
}

export enum AdPlacement {
    FACEBOOK = "facebook",
    INSTAGRAM = "instagram",
    MESSENGER = "messenger",
    AUDIENCE_NETWORK = "audience_network",
    FACEBOOK_FEED = "facebook_feed",
    FACEBOOK_STORIES = "facebook_stories",
    FACEBOOK_REELS = "facebook_reels",
    INSTAGRAM_FEED = "instagram_feed",
    INSTAGRAM_STORIES = "instagram_stories",
    INSTAGRAM_REELS = "instagram_reels",
    YOUTUBE = "youtube",
    YOUTUBE_SEARCH = "youtube_search",
    YOUTUBE_HOME = "youtube_home",
    YOUTUBE_WATCH = "youtube_watch",
}

export interface IAdTargeting {
    geo_locations: {
        countries: string[];
    };
    age_min?: number;
    age_max?: number;
}

export interface IAdCreativeOverrides {
    headline?: string;
    primaryText?: string;
    description?: string;
    actionButtonLabel?: AdCallToAction;
    destinationUrl?: string;
    displayUrl?: string;
    thumbnailUrl?: string;
    linkCaption?: string;
}

export interface IBoostPostDTO {
    unifiedPostTargetId: string;
    durationDays: number;
    budgetAmount: number;
    currency: AdCurrency;
    objective: AdObjective;
    callToAction: AdCallToAction;
    targeting: IAdTargeting;
    placements: AdPlacement[];
    creativeOverrides?: IAdCreativeOverrides;
    platformData?: Record<string, unknown>;
    startNow?: boolean;
    scheduleAt?: string;
}

/** POST /ads/boost answers 201 even when the platform refused it: status FAILED and errorMessage say so. */
export interface IBoostExecution {
    id?: string;
    status?: AdExecutionStatus;
    errorMessage?: string | null;
    [key: string]: unknown;
}

export type AdExecutionSortBy =
    | "createdAt"
    | "updatedAt"
    | "scheduledAt"
    | "startedAt"
    | "budgetAmount";

export type AdExecutionSortOrder = "ASC" | "DESC";

export type IGetAdExecutionsParams = {
    page?: number;
    limit?: number;
    projectId?: string;
    platforms?: string[];
    statuses?: AdExecutionStatus[];
    startedOnly?: boolean;
    includePlatformStatus?: boolean;
    sortBy?: AdExecutionSortBy;
    sortOrder?: AdExecutionSortOrder;
};

export interface IAdExecution {
    id: string;
    userId: number;
    projectId: string;
    unifiedPostTargetId: string;
    platform: string;
    status: AdExecutionStatus;
    durationDays: number;
    budgetAmount: number;
    currency: AdCurrency;
    objective: AdObjective;
    callToAction: AdCallToAction;
    targeting?: IAdTargeting;
    placements?: string[];
    creativeOverrides?: IAdCreativeOverrides;
    platformData?: Record<string, unknown>;
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    failedAt: string | null;
    externalCampaignId: string | null;
    externalAdSetId: string | null;
    externalAdId: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
    queueState?: string;
    /** Proposed contract: the post the boost promotes, so the list can link back to it. */
    unifiedPostId?: string;
}

