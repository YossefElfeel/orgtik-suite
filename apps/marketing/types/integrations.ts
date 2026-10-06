export interface IIntegrationsAvailable {
  id: string;
  name: string;
  icon: string;
  color: string;
  platform: IntegrationPlatform;
  oauthVersion: string;
  requiresRefreshToken: boolean;
}
/**
 * Starts a connection. The redirect address is the server's own configuration: the client no longer
 * sends one (MKT-060).
 */
export interface IConnectIntegration {
  platform: IntegrationPlatform;
}

export interface IConnectionResponse {
  authUrl: string;
  /** The single-use value the provider sends back; the client keeps it to check the return (MKT-018). */
  state?: string;
  provider?: string;
  simulated?: boolean;
}

export interface IIntegrationCallbackParams {
  platform: string;

  // OAuth 1.0a
  oauth_verifier?: string;
  oauth_token?: string;

  // OAuth 2.0
  code?: string;
  state?: string;
}

export interface IGoogleIntegration {
  requiredScopes: string[];
  grantedScopes: string[];
  missingScopes: string[];
  requiresReconnect: boolean;
  id: string;
  platform: string;
  status: "CONNECTED" | "DISCONNECTED" | string;
  metadata: GoogleMetadata;
  connectedAt: string;
  expiresAt: string;
  lastSyncedAt: string | null;
  name: string;
  icon: string;
  color: string;
}

export interface GoogleMetadata {
  name: string;
  email: string;
  scopes: string[];
  googleUserId: string;
  grantedScopes: string[];
  requestedScopes: string[];
}

export interface IGoogleIntegrationFull {
  id: string;
  name: string;
  icon: string;
  color: string;
  platform: IntegrationPlatform;
  oauthVersion: string;
  requiresRefreshToken: boolean;
  requiresReconnect: boolean;
  status: "CONNECTED" | "DISCONNECTED" | string;
  requiredScopes: string[];
  grantedScopes: string[];
  missingScopes: string[];
  metadata: {
    pageName?: string;
    name?: string;
    email: string;
    scopes: string[];
    googleUserId: string;
    grantedScopes: string[];
    requestedScopes: string[];
  };
  connectedAt: string;
  expiresAt: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
}

export interface IFacebookPage {
  id: string;
  name: string;
  category: string;
}

export interface IFacebookCallbackData {
  requiresSelection: boolean;
  pages: IFacebookPage[];
  tempDataId: string;
}


export type IntegrationPlatform =
  | "FACEBOOK"
  | "GOOGLE"
  | "INSTAGRAM"
  | "X"
  | "LINKEDIN"
  | "TIKTOK"
  | "YOUTUBE";

export interface IIntegrationCallbackResponse {

  tempDataId: string;
  projectId: string;
  platform: string;
  name: string;
  oauthVersion: string;
  color: string;
  icon: string;

  requiresSelection: boolean;
  requiresReconnect: boolean;

  profile: {
    connectedAt: string;
    externalUserId: string;
    displayName: string;
    email: string;
    accountType: string | null;
    isProfessional: boolean | null;
  };

  permissions: {
    requiredScopes: string[];
    grantedScopes: string[];
    missingScopes: string[];
    requiredScopesCount: number;
    grantedScopesCount: number;
    missingScopesCount: number;
  };

  selectionStatus: {
    pageSelected: boolean;
    publishingSelected: boolean;
    businessSelected: boolean;
    analyticsSelected: boolean;
    adAccountSelected: boolean;
    readyForAds: boolean;
  };

  accountsSummary: {
    totalAccounts: number;
    selectedAccounts: number;
    adsAccounts: number;
    publishAccounts: number;
    analyticsAccounts: number;
    messagingAccounts: number;
  };

  capabilityStatuses: {
    capability: string;
    state: string;
    availableResources: number;
    selectedResources: number;
  }[];

  featureStatuses: {
    feature: string;
    ready: boolean;
    requiredScopesCount: number;
    missingScopesCount: number;
  }[];

  resourceSelection: {
    totalCount: number;
    selectedCount: number;

    groups: {
      [key: string]: {
        title: string;
        totalCount: number;
        selectedCount: number;

        resources: {
          id: string;
          capability: string;
          backingCapability: string;
          resourceType: string;
          type: string;

          externalId: string;
          parentExternalId: string | null;

          displayName: string;
          handleOrCode: string;

          currency: string | null;

          isSelectable: boolean;
          isSelected: boolean;

          metadata: {
            derivedFromProfile: boolean;
            source: string;
          };

          lastSyncedAt: string;
        }[];
      };
    };
  };
};


// 1(Shared Interfaces)
export interface MetricValue {
  value: number;
  rate: number | null;
}

export interface SyncStatus {
  status: string;
  attempted: boolean;
  queued: boolean;
  metricsCount: number | null;
  error: string | null;
  queuedJobId: string | null;
}

// 2.(Account Resources)
export interface AccountResource {
  id: string;
  capability: "ADS" | "PUBLISH" | "MESSAGING" | "ANALYTICS";
  resourceType: "FACEBOOK_AD_ACCOUNT" | "FACEBOOK_PAGE";
  displayName: string;
  externalId: string;
  currency: string | null;
  isSelected: boolean;
  lastSyncedAt: string;
}

// 3 Scopes
export interface CapabilityStatus {
  capability: string;
  state: "satisfied" | string;
  availableResources: number;
  selectedResources: number;
}

export interface FeatureStatus {
  feature: string;
  ready: boolean;
  requiredScopesCount: number;
  missingScopesCount: number;
}

// 4.(Analytics & Engagement)
export interface GrowthSeries {
  date: string;
  followers: number;
  following: number;
  impressions: number;
  reach: number;
  engagements: number;
}

// 5. Audience
export interface AudienceLabelValue {
  label: string;
  value: number;
}

export interface GenderSplit {
  male: number;
  female: number;
  unknown: number;
}

// 6. Recent Posts
export interface RecentPostItem {
  id: string;
  platformPostId: string;
  content: string;
  postedAt: string;
  profileId: number | string;
  profileName: string;
  url: string;
  impressions: number;
  reach: number;
  engagements: number;
  engagementRate: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
}

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface IntegrationResponse {
  id: string;
  platform: "FACEBOOK" | string;
  name: string;
  oauthVersion: string;
  color: string;
  icon: string;
  publishConnected: boolean;
  adsConnected: boolean;
  requiresReconnect: boolean;
  isConnected: boolean;
  status: "CONNECTED" | string;
  connectedAt: string;
  expiresAt: string | null;
  lastSyncedAt: string;

  scopeSummary: {
    requiredScopesCount: number;
    grantedScopesCount: number;
    missingScopesCount: number;
  };

  accountsSummary: {
    totalAccounts: number;
    selectedAccounts: number;
    adsAccounts: number;
    publishAccounts: number;
    analyticsAccounts: number;
    messagingAccounts: number;
  };

  accountResources: AccountResource[];
  capabilityStatuses: CapabilityStatus[];
  featureStatuses: FeatureStatus[];

  analytics: {
    status: string;
    period: { start: string; end: string };
    comparePeriod: { start: string; end: string };
    sync: {
      accountMetrics: SyncStatus;
      audienceMetrics: SyncStatus;
      recentPostsImport: SyncStatus;
      lastSyncAt: string | null;
      errors: any[];
    };
    overview: {
      status: string;
      profile: {
        displayName: string;
        handle: string;
        externalId: string | number;
        imageUrl: string | null;
        category: string;
        websiteUrl: string | null;
      };
      followers: MetricValue;
      following: MetricValue;
      totalPosts: MetricValue;
      reach: MetricValue;
      impressions: MetricValue;
    };
    engagement: {
      status: string;
      engagementRate: MetricValue;
      avgLikes: MetricValue;
      avgComments: MetricValue;
      avgShares: MetricValue;
      profileViews: MetricValue;
    };
    growth: {
      status: string;
      followersDelta: MetricValue;
      followingDelta: MetricValue;
      impressionsDelta: MetricValue;
      series: GrowthSeries[];
    };
    audience: {
      status: string;
      topCountries: AudienceLabelValue[];
      ageGroups: AudienceLabelValue[];
      genderSplit: GenderSplit;
    };
    recentPosts: {
      status: string;
      items: RecentPostItem[];
      meta: PaginationMeta;
    };
  };
}


/** A row of GET /integrations/project: one connected account of the active project. */
export interface IIntegrationListItem {
  id: string;
  projectId: string;
  name: string;
  platform: IntegrationPlatform;
  oauthVersion: string;
  requiresReconnect: boolean;
  status: "CONNECTED" | "DISCONNECTED" | string;
  isConnected: boolean;
  requiredScopes: string[];
  grantedScopes: string[];
  missingScopes: string[];
  metadata: {
    name?: string;
    pageName?: string;
    email?: string | null;
    handle?: string | null;
    externalId?: string | null;
    pictureUrl?: string | null;
    followers?: number | null;
  };
  publishConnected?: boolean;
  adsConnected?: boolean;
  connectedAt: string;
  expiresAt: string | null;
  lastSyncedAt: string | null;
}

/** A pickable resource in the connect wizard (a page, an ad account, an inbox). */
export type IWizardResource = IIntegrationCallbackResponse["resourceSelection"]["groups"][string]["resources"][number];

/** What the wizard sends to preflight and finish: the resources chosen per capability. */
export interface IWizardSelection {
  capability: string;
  resourceIds: string[];
}
