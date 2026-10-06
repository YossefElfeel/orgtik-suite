// Shapes of the analytics reads (dashboard, reports, competitors). They follow the API's answers
// as the mock serves them (local-dev/apps/marketing/analytics.js and routes/insights.js).

/** Platforms as the report endpoints name them (X is still "TWITTER" there). */
export enum EPlatform {
  FACEBOOK = "FACEBOOK",
  INSTAGRAM = "INSTAGRAM",
  TIKTOK = "TIKTOK",
  TWITTER = "TWITTER",
  YOUTUBE = "YOUTUBE",
  LINKEDIN = "LINKEDIN",
  GOOGLE = "GOOGLE",
}

export interface IReportPeriod {
  start: string;
  end: string;
}

/** The query every report read takes. Days are calendar days ("2026-09-01") in the project's zone. */
export interface IReportQuery {
  projectId?: string;
  periodStart?: string;
  periodEnd?: string;
  compareStart?: string;
  compareEnd?: string;
  platforms?: string[];
  profileIds?: string[];
  source?: string;
  sortBy?: "impressions" | "engagements" | "reach" | "followers";
  sortOrder?: "asc" | "desc";
}

export interface IUnifiedMetrics {
  impressions: number;
  reach: number;
  engagements: number;
  followers: number;
  followersGained: number;
  profileViews: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  videoViews: number;
  sessions: number;
  activeUsers: number;
  following: number;
  posts: number;
}
export type MetricKey = keyof IUnifiedMetrics;
/** @deprecated the same shape as IUnifiedMetrics */
export type IOverviewMetrics = IUnifiedMetrics;

export interface IRawMetrics {
  fan_count: number;
  page_post_engagements: number;
  page_impressions_unique: number;
}

export interface IMetricWithRate {
  value: number;
  /** Change against the comparison period, in percent (12.5 is +12.5%); null when there was nothing before. */
  rate: number | null;
}

export interface ISyncFailure {
  integrationId: string;
  platform: string;
  profileName: string;
  error: string;
}

export interface ISyncStatus {
  attempted: boolean;
  totalIntegrations: number;
  succeeded: number;
  failed: number;
  metricsCount: number;
  failures: ISyncFailure[];
}

// ---------------------------------------------------------------- overview
export interface IOverviewReport {
  period: IReportPeriod;
  comparePeriod: IReportPeriod;
  totals: {
    current: IUnifiedMetrics;
    compare: IUnifiedMetrics;
    withRate: Record<MetricKey, IMetricWithRate>;
    rawCurrent: IRawMetrics;
    rawCompare: IRawMetrics;
  };
  trends: { date: string; metrics: IUnifiedMetrics }[];
  syncStatus: ISyncStatus;
}

// ---------------------------------------------------------------- profiles
export interface IProfileReportItem {
  platform: string;
  profileId: string;
  profileName: string;
  impressions: number;
  engagements: number;
  engagementRate: number;
  followersGained: number;
  postsPublished: number;
  reach: number;
  unifiedMetrics: IUnifiedMetrics;
  rawMetrics: IRawMetrics;
}

export interface IProfilesReportData {
  period: IReportPeriod;
  comparePeriod?: IReportPeriod;
  items: IProfileReportItem[];
  syncStatus: ISyncStatus;
}

// ---------------------------------------------------------------- followers
export interface IFollowersReportItem {
  profileId: string;
  platform: string;
  profileName: string;
  followers: number;
  followersGained: number;
  series: { date: string; followers: number; followersGained: number }[];
}

export interface IFollowersReport {
  period: IReportPeriod;
  items: IFollowersReportItem[];
}

// ---------------------------------------------------------------- mentions
export interface IMention {
  id: string;
  name: string;
  username: string;
  text: string;
  platform: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | string;
  likes: number;
  replies: number;
  reposts: number;
  postedAt: string;
}

export interface IListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IMentionsReport {
  items: IMention[];
  meta: IListMeta;
}

// ---------------------------------------------------------------- post performance
export interface IPostPerformance {
  id: string;
  projectId: string;
  platform: string;
  source: string;
  profileId: string | null;
  profileName: string;
  profileImageUrl: string | null;
  pageName: string;
  pageImageUrl: string | null;
  platformPostId: string;
  unifiedPostId: string;
  status: string;
  date: string;
  createdAt: string;
  postContent: string;
  unifiedPostTitle: string;
  unifiedPostText: string;
  impressions: number;
  reach: number;
  engagements: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  mediaTypes: string[];
  url: string | null;
}

// ---------------------------------------------------------------- competitors
export interface ICompetitorProfile {
  platform: string;
  followers: number;
  followersGained: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postsPublished: number;
}

export interface ICompetitor {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  profiles: ICompetitorProfile[];
  followers: number;
  followersGained: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postsPublished: number;
  createdAt: string;
}

// ---------------------------------------------------------------- dashboard reads
/** A connected account, as GET /integrations/project lists it (the fields the insights screens read). */
export interface IInsightsIntegration {
  id: string;
  platform: string;
  name: string;
  status: string;
  isConnected: boolean;
  requiresReconnect: boolean;
  metadata: { name?: string | null; pageName?: string | null; handle?: string | null; pictureUrl?: string | null; followers?: number | null };
  lastSyncedAt?: string | null;
}

/** A post in GET /publishing/posts (the fields the dashboard reads). */
export interface IDashboardPost {
  id: string;
  title: string;
  postTitle?: string;
  status: string;
  effectiveScheduledAt: string | null;
  publishedAt: string | null;
  platforms: { id: string; platform: string; status: string; effectiveScheduledAt: string | null }[];
  viewerReview?: { isReviewer: boolean; reviewerStatus: string | null; canApprove: boolean; canReject: boolean };
  createdAt: string;
}

export interface IDashboardPostsParams {
  uiStatuses?: string;
  page?: number;
  limit?: number;
}
