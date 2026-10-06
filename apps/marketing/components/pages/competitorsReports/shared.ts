import type { ICompetitor } from "@/types/reports";

export type CompetitorRow = {
  id: string;
  name: string;
  handle: string;
  platforms: string[];
  followers: number;
  followersGained: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postsPublished: number;
};

export const COMPETITOR_SORTS = ["name", "followers", "followersGained", "impressions", "engagements", "engagementRate", "postsPublished"] as const;
export type CompetitorSort = (typeof COMPETITOR_SORTS)[number];

/** A competitor's figures overall, or on one platform (null when it isn't on that platform). */
export function competitorRow(c: ICompetitor, platform: string | null): CompetitorRow | null {
  const platforms = c.profiles.map((p) => p.platform);
  if (!platform) return { id: c.id, name: c.name, handle: c.handle, platforms, followers: c.followers, followersGained: c.followersGained, impressions: c.impressions, engagements: c.engagements, engagementRate: c.engagementRate, postsPublished: c.postsPublished };
  const p = c.profiles.find((x) => x.platform === platform);
  return p ? { id: c.id, name: c.name, handle: c.handle, platforms, followers: p.followers, followersGained: p.followersGained, impressions: p.impressions, engagements: p.engagements, engagementRate: p.engagementRate, postsPublished: p.postsPublished } : null;
}
