// Google Search Ads: the saved campaign ↔ the Settings and Ad groups forms, and their payloads.
// The budget currency isn't sent: the server takes the ad account's (MKT-011).
import type { BudgetType, CampaignAdGroup, CampaignResponsiveSearchAd } from "@/lib/campaigns/types";
import type { GoogleSearchApiObjective, ICampaignOnboardingAdGroupsPayload, ICampaignOnboardingGoogleSearchSettingsPayload, ICreatedCampaign } from "@/types/campaigns";
import { GOOGLE_AD_OBJECTIVE_VALUES, GOOGLE_BIDDING_STRATEGY_VALUES } from "@/constants/campaigns";

export type GoogleSettingsValues = {
  integrationId: string;
  objective: GoogleSearchApiObjective;
  budgetAmount: number | null;
  budgetType: BudgetType;
  biddingStrategy: string;
  networks: string[];
  locations: string[];
  languages: string[];
  startAt: string | null;
  endAt: string | null;
};

export function googleSettingsFromCampaign(c: ICreatedCampaign | undefined): GoogleSettingsValues {
  const cfg = c?.configuration ?? {};
  const objective = (GOOGLE_AD_OBJECTIVE_VALUES as readonly string[]).includes(cfg.objective ?? "") ? (cfg.objective as GoogleSearchApiObjective) : "WEBSITE_TRAFFIC";
  return {
    integrationId: cfg.integrationId ?? "",
    objective,
    budgetAmount: cfg.budgetAmount != null && Number(cfg.budgetAmount) > 0 ? Number(cfg.budgetAmount) : null,
    budgetType: cfg.budgetType === "LIFETIME" ? "LIFETIME" : "DAILY",
    biddingStrategy: (GOOGLE_BIDDING_STRATEGY_VALUES as readonly string[]).includes(cfg.biddingStrategy ?? "") ? cfg.biddingStrategy! : "MAXIMIZE_CONVERSIONS",
    networks: cfg.networks?.length ? cfg.networks : ["GOOGLE_SEARCH"],
    locations: cfg.locations ?? [],
    languages: cfg.languages ?? [],
    startAt: c?.startAt ?? null,
    endAt: c?.endAt ?? null,
  };
}

export function buildGoogleSearchSettingsPayload(v: GoogleSettingsValues): ICampaignOnboardingGoogleSearchSettingsPayload {
  return {
    step: "SETTINGS",
    ...(v.startAt ? { startAt: v.startAt } : {}),
    ...(v.endAt ? { endAt: v.endAt } : {}),
    configuration: {
      integrationId: v.integrationId,
      objective: v.objective,
      budgetAmount: v.budgetAmount ?? 0,
      budgetType: v.budgetType,
      biddingStrategy: v.biddingStrategy,
      networks: v.networks,
      locations: v.locations,
      languages: v.languages,
    },
  };
}

const toMicros = (amount: number | null) => (amount && amount > 0 ? Math.round(amount * 1_000_000) : undefined);
const fromMicros = (micros?: number) => (micros ? micros / 1_000_000 : null);

export function adGroupsFromCampaign(c: ICreatedCampaign | undefined): CampaignAdGroup[] {
  return (c?.adSets ?? []).map((g) => ({
    id: g.id || crypto.randomUUID(),
    name: g.name ?? "",
    keywords: (g.configuration?.keywords ?? []).map((k) => ({ text: k.text, matchType: k.matchType })),
    negativeKeywords: (g.configuration?.negativeKeywords ?? []).map((k) => ({ text: k.text, matchType: k.matchType })),
    defaultBid: fromMicros(g.configuration?.defaultBidMicros),
    responsiveSearchAds: (g.ads ?? []).map(
      (a): CampaignResponsiveSearchAd => ({
        id: a.id || crypto.randomUUID(),
        name: a.name ?? "",
        finalUrl: a.configuration?.finalUrl ?? "",
        headlines: a.configuration?.headlines ?? [],
        descriptions: a.configuration?.descriptions ?? [],
        path1: a.configuration?.displayPath?.[0],
        path2: a.configuration?.displayPath?.[1],
      }),
    ),
  }));
}

export function buildGoogleSearchAdGroupsPayload(groups: CampaignAdGroup[]): ICampaignOnboardingAdGroupsPayload {
  return {
    step: "AD_GROUPS",
    adSets: groups.map((g) => ({
      name: g.name.trim(),
      configuration: {
        ...(toMicros(g.defaultBid) ? { defaultBidMicros: toMicros(g.defaultBid) } : {}),
        keywords: g.keywords,
        negativeKeywords: g.negativeKeywords,
      },
      ads: g.responsiveSearchAds.map((ad) => ({
        name: ad.name.trim(),
        configuration: {
          finalUrl: ad.finalUrl.trim(),
          headlines: ad.headlines,
          descriptions: ad.descriptions,
          ...([ad.path1, ad.path2].some(Boolean) ? { displayPath: [ad.path1, ad.path2].filter((p): p is string => Boolean(p)) } : {}),
        },
      })),
    })),
  };
}

/** Google's limits for a responsive search ad. */
export const RSA_LIMITS = { headlinesMin: 3, headlinesMax: 15, headlineLength: 30, descriptionsMin: 2, descriptionsMax: 4, descriptionLength: 90, pathLength: 15 };

export function isValidUrl(value: string): boolean {
  const raw = value.trim();
  if (!raw) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** "nilefoods.com/ksa/offers": how the ad's address shows under its headline. */
export function displayUrl(ad: Pick<CampaignResponsiveSearchAd, "finalUrl" | "path1" | "path2">): string {
  const paths = [ad.path1, ad.path2].filter(Boolean).join("/");
  const raw = ad.finalUrl.trim();
  if (!raw) return paths;
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
    return paths ? `${host}/${paths}` : host;
  } catch {
    return raw.replace(/^https?:\/\//, "");
  }
}
