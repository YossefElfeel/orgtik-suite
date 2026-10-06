// Posts as the publishing API sends them (local-dev mock: apps/marketing/views.js postListItem and
// postDetail). The old file typed the list item as an array and the details' labels as numbers;
// these follow the real shapes.
import type { ILabel } from "./label";

/** A post's own status (`status` on the details). */
export type IPostStatus = "DRAFT" | "PENDING" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "CANCELED" | "PARTIAL";

/** The status the list shows and filters by (`uiStatuses[]`). SYNCED is a post imported from a platform. */
export type PostUiStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "SYNCED";

export type PublishMode = "PUBLISH_NOW" | "SCHEDULED" | "DRAFT";
export type ContentMode = "SYNC" | "PER_PLATFORM";

export type IGetAllPostsParams = {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: IPostStatus;
  year?: number;
  month?: number;
  week?: number;
  platforms?: string[];
  search?: string;
  uiStatuses?: string[];
  labelIds?: string[];
};

export interface IPostActions {
  canPublishNow: boolean;
  canSchedule: boolean;
  canReschedule: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canRepostNow?: boolean;
  canRollbackToLastApproved?: boolean;
}

export interface IViewerReview {
  isReviewer: boolean;
  reviewerStatus: string | null;
  canApprove: boolean;
  canReject: boolean;
}

export interface IPersonBrief {
  id: number;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  status?: string;
}

/** One row of GET /publishing/posts. */
export interface IPostListItem {
  id: string;
  dateTime: string;
  postTitle: string;
  title?: string;
  status: PostUiStatus;
  workflowState?: string;
  approvalStatus?: string;
  reApproveRequired?: boolean;
  actions?: Partial<IPostActions>;
  viewerReview?: IViewerReview;
  scheduleScope?: "GLOBAL" | "PER_TARGET";
  /** The first time the post goes out (its own schedule, a target's, or when it was published). */
  effectiveScheduledAt: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  isEditable?: boolean;
  platforms: { id: string; platform: string; name: string; status?: string; effectiveScheduledAt?: string | null }[];
  labels: { id: string; name: string; color?: string }[];
  approvers: IPersonBrief[];
  approverCount?: number;
  imported?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGalleryItem {
  id: number;
  image: string;
  alt: string;
  created_at?: string;
  updated_at?: string;
  /** Proposed contract: the file's type, so videos aren't guessed from the name. */
  mimeType?: string;
  /** Proposed contract: who uploaded it, so people who may delete only their own see Delete. */
  uploadedBy?: number;
}

export interface IPostTarget {
  id: string;
  errorMessage: string | null;
  unifiedPostId: string;
  platform: { name: string; color?: string; icon?: string };
  /** FACEBOOK, INSTAGRAM, … */
  platformKey: string;
  integrationId: string | null;
  contentType: string;
  effectiveText: string;
  textOverride: string | null;
  useMasterText: boolean;
  status: string;
  /** The target's own schedule. null when it follows the post's. */
  scheduledAt: string | null;
  effectiveScheduledAt: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  postUrl: string | null;
  isDeletedOnPlatform: boolean;
  galleryIds: number[];
  galleries: IGalleryItem[];
  analyticsAvailable: boolean;
  performanceMatrix: Record<string, { value: number; rate: number }>;
  integrationPublishPageData?: { name: string; image: string | null; followers: number };
}

export interface IReviewerUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  isMine: boolean;
  isApproved: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  note?: string | null;
  decidedAt?: string | null;
}

/** GET /publishing/posts/:id */
export interface IPostDetail {
  id: string;
  userId: number;
  projectId: string;
  title: string;
  text: string;
  campaignIds: string[];
  campaignPosts: { id: string; name: string }[];
  labels: { id: string; name: string; color?: string }[];
  labelIds: string[];
  status: IPostStatus;
  uiStatus: PostUiStatus;
  workflowState: string;
  reApproveRequired: boolean;
  scheduledAt: string | null;
  publishedAt: string | null;
  approvalStatus: string;
  approvalNotes: string | null;
  approvalVersion: number;
  lastContentEditedAt: string | null;
  approvalRequest: { note: string; sentAt: string; sentByUserId: number; reviewerUser: IReviewerUser[] } | null;
  actions: IPostActions;
  targets: IPostTarget[];
  contentMode: ContentMode;
  publishMode: "SCHEDULED" | "INSTANT";
  imported: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreatePostTarget {
  platform: string;
  contentType?: string;
  text: string;
  useMasterText: boolean;
  galleryIds: number[];
  scheduledAt?: string;
}

/** POST /publishing/posts from the composer. */
export interface ICreatePostBody {
  title: string;
  text: string;
  contentMode: ContentMode;
  publishMode: PublishMode;
  scheduledAt?: string;
  targets: ICreatePostTarget[];
  labelIds: string[];
  campaignIds: string[];
  approvalUserIds: number[];
  approvalNote?: string;
}

/** The lighter create shape the campaign wizard sends. */
export interface IPostDTO {
  projectId: string;
  title: string;
  text?: string;
  labelIds: string[];
  scheduledAt: string;
  status?: IPostStatus;
  targets: { platform: string }[];
}

export interface IUpdatePostDTO {
  title?: string;
  text?: string;
  labelIds?: string[];
  campaignIds?: string[];
  scheduledAt?: string;
  /** DRAFT, SCHEDULED, PENDING_APPROVAL (send for approval), CANCELED. Publishing goes through publish-now. */
  status?: string;
}

export interface IUpdateTargetBody {
  /** "" goes back to the post's text. */
  text?: string;
  contentType?: string;
  scheduledAt?: string;
  galleryIds?: number[];
  galleryIdsToRemove?: number[];
}

export interface ICommentDTO {
  text: string;
}

export interface IComment {
  id: string;
  text: string;
  user: { id: number; firstName?: string; lastName?: string; avatar?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

/** A connected account posts can go to (GET /publishing/platforms/available). */
export interface IPlatform {
  platform: string;
  integrationId: string;
  resourceId: string;
  resourceType: string;
  resourceName: string;
  handleOrCode: string;
  supportedContentTypes: string[];
  mediaConstraints: { maxItems: number; maxVideos: number };
  name: string;
  oauthVersion: string;
  color: string;
  icon: string;
  requiresRefreshToken: boolean;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  /** Proposed contract: totals per type over the whole library, for the type filter. */
  counts?: { all?: number; image?: number; video?: number };
}

export interface GalleryResponse {
  items: IGalleryItem[];
  meta: IPaginationMeta;
}

export interface IReviewerProfile {
  id: number;
  jobTitle: string | null;
  department: string | null;
  about: string | null;
  language: string;
  timeZone: string;
}

export interface IReviewer {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  managerId: number | null;
  scopes: string[];
  userType: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  profile: IReviewerProfile;
}

export interface ReviewersResponse {
  items: IReviewer[];
}

export interface LabelsResponse {
  items: ILabel[];
}
