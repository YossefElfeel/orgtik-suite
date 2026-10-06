// The composer's draft: what the person has written so far, how each step checks it, and the
// requests it becomes. It lives in the composer (not the store), so leaving the page can't carry a
// half-written post into the next one.
import type { ApproverOption } from "@/components/dialogs/AddApproversDialog";
import type { ICreatePostBody, IGalleryItem, IPlatform, IPostDetail, PublishMode } from "@/types/post";
import { isVideo } from "../shared/media";
import { isFuture } from "../shared/zone";

export type StepId = "content" | "media" | "schedule";
export const STEPS: StepId[] = ["content", "media", "schedule"];

export type Draft = {
  title: string;
  /** The text every platform shares while `sameText` is on. */
  text: string;
  sameText: boolean;
  /** Platform keys, in the order they were chosen. */
  platforms: string[];
  textByPlatform: Record<string, string>;
  formatByPlatform: Record<string, string>;
  sameMedia: boolean;
  media: IGalleryItem[];
  mediaByPlatform: Record<string, IGalleryItem[]>;
  labelIds: string[];
  campaignIds: string[];
  mode: PublishMode;
  scheduledAt: string | null;
  perPlatformTime: boolean;
  scheduleByPlatform: Record<string, string | null>;
  approvers: ApproverOption[];
  note: string;
};

export const emptyDraft = (): Draft => ({
  title: "",
  text: "",
  sameText: true,
  platforms: [],
  textByPlatform: {},
  formatByPlatform: {},
  sameMedia: true,
  media: [],
  mediaByPlatform: {},
  labelIds: [],
  campaignIds: [],
  mode: "SCHEDULED",
  scheduledAt: null,
  perPlatformTime: false,
  scheduleByPlatform: {},
  approvers: [],
  note: "",
});

/** Longest text each platform takes. X is the strict one. */
export const TEXT_LIMITS: Record<string, number> = { X: 280, INSTAGRAM: 2200, TIKTOK: 2200, LINKEDIN: 3000, YOUTUBE: 5000, FACEBOOK: 63206 };
/** Platforms that can't post text alone. */
const NEEDS_MEDIA = new Set(["INSTAGRAM"]);
const NEEDS_VIDEO = new Set(["TIKTOK", "YOUTUBE"]);

/** Media is optional only when no chosen platform needs an image or a video. */
export const mediaRequired = (platforms: string[]) => platforms.some((p) => NEEDS_MEDIA.has(p) || NEEDS_VIDEO.has(p));

// With one platform there is nothing to differ: the shared text, media and time apply.
export const sharedText = (d: Draft) => d.sameText || d.platforms.length < 2;
export const sharedMedia = (d: Draft) => d.sameMedia || d.platforms.length < 2;
export const sharedTime = (d: Draft) => !d.perPlatformTime || d.platforms.length < 2;
export const textFor = (d: Draft, p: string) => (sharedText(d) ? d.text : (d.textByPlatform[p] ?? ""));
export const mediaFor = (d: Draft, p: string) => (sharedMedia(d) ? d.media : (d.mediaByPlatform[p] ?? []));
export const scheduleFor = (d: Draft, p: string) => (sharedTime(d) ? d.scheduledAt : (d.scheduleByPlatform[p] ?? null));
/** The earliest time any platform goes out, for the post's own schedule. */
export const firstTime = (d: Draft) => (sharedTime(d) ? d.scheduledAt : (d.platforms.map((p) => d.scheduleByPlatform[p]).filter(Boolean).sort()[0] ?? null));

/** A message key in the PostComposer namespace, with its values. */
export type Problem = { key: string; values?: Record<string, string | number> };
export type Problems = Record<string, Problem>;

type Limits = Record<string, { maxItems: number; maxVideos: number }>;

export function check(step: StepId, d: Draft, limits: Limits, name: (p: string) => string): Problems {
  const out: Problems = {};
  if (step === "content") {
    if (!d.title.trim()) out.title = { key: "errTitle" };
    else if (d.title.trim().length > 150) out.title = { key: "errTitleLong", values: { max: 150 } };
    if (!d.platforms.length) out.platforms = { key: "errPlatforms" };
    const fields = sharedText(d) ? [["text", d.text, d.platforms] as const] : d.platforms.map((p) => [`text.${p}`, d.textByPlatform[p] ?? "", [p]] as const);
    for (const [field, value, on] of fields) {
      if (!value.trim()) {
        out[field] = { key: "errText" };
        continue;
      }
      const tight = on.filter((p) => value.length > (TEXT_LIMITS[p] ?? Infinity));
      if (tight.length) out[field] = { key: "errTextLong", values: { platform: name(tight[0]), max: TEXT_LIMITS[tight[0]] } };
    }
  }
  if (step === "media") {
    const groups = sharedMedia(d) ? [["media", d.media, d.platforms] as const] : d.platforms.map((p) => [`media.${p}`, d.mediaByPlatform[p] ?? [], [p]] as const);
    for (const [field, items, on] of groups) {
      const videos = items.filter(isVideo).length;
      for (const p of on) {
        const lim = limits[p];
        if (lim && items.length > lim.maxItems) out[field] = { key: "errMediaMany", values: { platform: name(p), max: lim.maxItems } };
        else if (lim && videos > lim.maxVideos) out[field] = { key: "errVideosMany", values: { platform: name(p), max: lim.maxVideos } };
        else if (NEEDS_VIDEO.has(p) && !videos) out[field] = { key: "errNeedsVideo", values: { platform: name(p) } };
        else if (NEEDS_MEDIA.has(p) && !items.length) out[field] = { key: "errNeedsMedia", values: { platform: name(p) } };
        if (out[field]) break;
      }
    }
  }
  if (step === "schedule" && d.mode === "SCHEDULED") {
    const slots = sharedTime(d) ? [["schedule", d.scheduledAt] as const] : d.platforms.map((p) => [`schedule.${p}`, d.scheduleByPlatform[p] ?? null] as const);
    for (const [field, at] of slots) {
      if (!at) out[field] = { key: "errWhen" };
      else if (!isFuture(at)) out[field] = { key: "errPast" };
    }
  }
  return out;
}

/** The draft as a post for POST /publishing/posts. Publish now is sent as a draft and then published with publish-now. */
export function toCreateBody(d: Draft): ICreatePostBody {
  const now = d.mode === "PUBLISH_NOW";
  const scheduled = d.mode === "SCHEDULED";
  const first = scheduled ? firstTime(d) : null;
  return {
    title: d.title.trim(),
    text: textFor(d, d.platforms[0] ?? ""),
    contentMode: sharedText(d) ? "SYNC" : "PER_PLATFORM",
    // With approvers, "publish now" means "publish as soon as it is approved": the API does that for INSTANT posts.
    publishMode: now && !d.approvers.length ? "DRAFT" : d.mode,
    ...(first ? { scheduledAt: first } : {}),
    targets: d.platforms.map((p) => ({
      platform: p,
      ...(d.formatByPlatform[p] ? { contentType: d.formatByPlatform[p] } : {}),
      text: textFor(d, p),
      useMasterText: sharedText(d),
      galleryIds: mediaFor(d, p).map((m) => m.id),
      ...(scheduled && !sharedTime(d) && d.scheduleByPlatform[p] ? { scheduledAt: d.scheduleByPlatform[p]! } : {}),
    })),
    labelIds: d.labelIds,
    campaignIds: d.campaignIds,
    approvalUserIds: d.approvers.map((a) => Number(a.id)),
    ...(d.approvers.length && d.note.trim() ? { approvalNote: d.note.trim() } : {}),
  };
}

const sameIds = (a: IGalleryItem[], b: IGalleryItem[]) => a.map((x) => x.id).join(",") === b.map((x) => x.id).join(",");

/** An existing post as a draft, for Edit. */
export function fromPost(post: IPostDetail): Draft {
  const d = emptyDraft();
  const targets = post.targets;
  const platforms = targets.map((t) => t.platformKey);
  const perText = targets.some((t) => !t.useMasterText && t.textOverride);
  const media = Object.fromEntries(targets.map((t) => [t.platformKey, t.galleries ?? []]));
  const firstMedia = targets[0]?.galleries ?? [];
  const sameMedia = targets.every((t) => sameIds(t.galleries ?? [], firstMedia));
  const perTime = targets.some((t) => t.scheduledAt && t.scheduledAt !== post.scheduledAt);
  return {
    ...d,
    title: post.title ?? "",
    // One platform with its own text: that text is what the post says.
    text: targets.length === 1 && perText ? (targets[0].textOverride ?? post.text ?? "") : (post.text ?? ""),
    sameText: !perText || targets.length === 1,
    platforms,
    textByPlatform: Object.fromEntries(targets.map((t) => [t.platformKey, t.useMasterText ? post.text : (t.textOverride ?? post.text)])),
    formatByPlatform: Object.fromEntries(targets.map((t) => [t.platformKey, t.contentType])),
    sameMedia,
    media: sameMedia ? firstMedia : [],
    mediaByPlatform: media,
    labelIds: post.labelIds ?? post.labels.map((l) => l.id),
    campaignIds: post.campaignIds ?? [],
    mode: ["SCHEDULED", "PENDING"].includes(post.status) && post.scheduledAt ? "SCHEDULED" : "DRAFT",
    scheduledAt: post.scheduledAt,
    perPlatformTime: perTime,
    scheduleByPlatform: Object.fromEntries(targets.map((t) => [t.platformKey, t.scheduledAt ?? post.scheduledAt])),
    approvers: (post.approvalRequest?.reviewerUser ?? []).map((r) => ({ id: Number(r.id), name: r.name, email: r.email, avatar: r.avatar ?? undefined })),
    note: post.approvalRequest?.note ?? "",
  };
}

/** Each connected account's media limits, by platform key. */
export const limitsOf = (platforms: IPlatform[] | undefined): Limits =>
  Object.fromEntries((platforms ?? []).map((p) => [p.platform.toUpperCase(), p.mediaConstraints ?? { maxItems: 10, maxVideos: 1 }]));
