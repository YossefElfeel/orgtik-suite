"use client";

// What a campaign is, read from the saved campaign: the review step and the details page show the
// same summary, in one currency (the campaign's; MKT-011) and in the project's time zone.
import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, Megaphone } from "@phosphor-icons/react";
import { Badge, Button, Card, CardHeader, IconButton, useFormatter } from "@orgtik/ui";
import ResponsiveSearchAdPreviewDialog from "@/components/dialogs/ResponsiveSearchAdPreviewDialog";
import MessagingMessagePreviewDialog from "@/components/dialogs/MessagingMessagePreviewDialog";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { useProjectContext } from "@/lib/project-context";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { adGroupsFromCampaign } from "@/lib/campaigns/google-search/onboarding";
import { googleLanguageName, googleLocationName } from "@/lib/campaigns/google-search/targets";
import { adSetsFromCampaign, paidSettingsFromCampaign } from "@/lib/campaigns/paid-social";
import { messagingConfig } from "@/lib/campaigns/messaging/onboarding";
import { stripHtml } from "@/lib/campaigns/messaging/templates";
import { isolate } from "@/lib/bidi";
import type { CampaignResponsiveSearchAd, MessagingChannel } from "@/lib/campaigns/types";
import type { ICreatedCampaign } from "@/types/campaigns";

const DASH = "—";

export function SummaryList({ rows }: { rows: { term: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map((r, i) => (
        <div key={i} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-caption text-fg-muted">{r.term}</dt>
          <dd className="min-w-0 break-words text-body text-fg">{r.value || DASH}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "SAR 350 a day" / "SAR 12,000 in total". */
export function useBudgetLabel() {
  const t = useTranslations("CampaignSummary");
  const f = useFormatter();
  return (amount: number | null | undefined, type: string | null | undefined, currency: string) =>
    amount ? t(type === "LIFETIME" ? "budgetLifetime" : "budgetDaily", { amount: f.money(Number(amount), currency) }) : DASH;
}

export function useScheduleLabel() {
  const t = useTranslations("CampaignSummary");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const d = (iso: string) => f.date(iso, { dateStyle: "medium", timeStyle: "short", timeZone });
  return (startAt?: string | null, endAt?: string | null) => (startAt && endAt ? t("scheduleRange", { start: d(startAt), end: d(endAt) }) : startAt ? t("scheduleFrom", { start: d(startAt) }) : endAt ? t("scheduleUntil", { end: d(endAt) }) : t("noSchedule"));
}

export function campaignCurrency(c: ICreatedCampaign | undefined, fallback: string) {
  return c?.budgetCurrency || c?.configuration?.budgetCurrency || fallback;
}

function GoogleSummary({ campaign }: { campaign: ICreatedCampaign }) {
  const t = useTranslations("CampaignSummary");
  const locale = useLocale();
  const labels = useCampaignLabels();
  const f = useFormatter();
  const budget = useBudgetLabel();
  const schedule = useScheduleLabel();
  const project = useProjectContext();
  const currency = campaignCurrency(campaign, project.currency);
  const cfg = campaign.configuration ?? {};
  const groups = adGroupsFromCampaign(campaign);
  const [preview, setPreview] = useState<CampaignResponsiveSearchAd | null>(null);
  const list = (ids: string[] | undefined, name: (id: string) => string | null) => (ids?.length ? new Intl.ListFormat(locale, { type: "conjunction" }).format(ids.map((id) => name(id) ?? id)) : DASH);
  return (
    <>
      <Card>
        <CardHeader title={t("settings")} />
        <div className="mt-4">
          <SummaryList
            rows={[
              { term: t("objective"), value: labels.label("googleObjective", cfg.objective) },
              { term: t("budget"), value: budget(cfg.budgetAmount, cfg.budgetType, currency) },
              { term: t("bidding"), value: labels.label("bidding", cfg.biddingStrategy) },
              { term: t("networks"), value: cfg.networks?.length ? new Intl.ListFormat(locale).format(cfg.networks.map((n) => labels.label("network", n))) : DASH },
              { term: t("locations"), value: list(cfg.locations, (id) => googleLocationName(id, locale)) },
              { term: t("languages"), value: list(cfg.languages, (id) => googleLanguageName(id, locale)) },
              { term: t("schedule"), value: schedule(campaign.startAt, campaign.endAt) },
            ]}
          />
        </div>
      </Card>
      <Card>
        <CardHeader title={t("adGroups", { count: groups.length })} />
        {groups.length === 0 ? <p className="mt-3 text-body-sm text-fg-muted">{t("noAdGroups")}</p> : null}
        <ul className="mt-4 flex flex-col gap-3">
          {groups.map((g) => (
            <li key={g.id} className="flex flex-col gap-2 rounded-field border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 dir="auto" className="text-body font-semibold text-fg">
                  {g.name}
                </h4>
                <span className="text-caption text-fg-muted">
                  {t("keywordsCount", { count: g.keywords.length })}
                  {g.defaultBid ? ` · ${t("bid", { amount: f.money(g.defaultBid, currency) })}` : ""}
                </span>
              </div>
              {g.keywords.length ? (
                <ul className="flex flex-wrap gap-1.5" aria-label={t("keywords")}>
                  {g.keywords.map((k, i) => (
                    <li key={i} className="rounded-pill bg-brand-subtle px-2 py-0.5 text-caption text-fg-brand">
                      <bdi className="font-semibold">{k.text}</bdi> {labels.label("matchType", k.matchType)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {g.responsiveSearchAds.map((ad) => (
                <div key={ad.id} className="flex items-center gap-3 rounded-field bg-sunken p-2.5">
                  <Megaphone aria-hidden className="size-4 shrink-0 text-fg-muted" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span dir="auto" className="truncate text-body-sm font-semibold text-fg">
                      {ad.name}
                    </span>
                    <span className="text-caption text-fg-muted">{t("adSummary", { headlines: ad.headlines.length, descriptions: ad.descriptions.length })}</span>
                  </span>
                  <IconButton variant="ghost" size="sm" label={t("previewAd", { name: isolate(ad.name) })} icon={<Eye />} onClick={() => setPreview(ad)} />
                </div>
              ))}
            </li>
          ))}
        </ul>
      </Card>
      <ResponsiveSearchAdPreviewDialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)} ad={preview} />
    </>
  );
}

function PaidSummary({ campaign }: { campaign: ICreatedCampaign }) {
  const t = useTranslations("CampaignSummary");
  const locale = useLocale();
  const labels = useCampaignLabels();
  const budget = useBudgetLabel();
  const schedule = useScheduleLabel();
  const project = useProjectContext();
  const currency = campaignCurrency(campaign, project.currency);
  const s = paidSettingsFromCampaign(campaign);
  const sets = adSetsFromCampaign(campaign);
  const audience = (a: typeof s.audience) =>
    [a.locations.length ? new Intl.ListFormat(locale).format(a.locations) : null, t("ages", { min: a.ageMin, max: a.ageMax }), labels.label("gender", a.gender), a.interests.length ? new Intl.ListFormat(locale).format(a.interests.map((i) => labels.label("interest", i))) : null]
      .filter(Boolean)
      .join(" · ");
  return (
    <>
      <Card>
        <CardHeader title={t("settings")} />
        <div className="mt-4">
          <SummaryList
            rows={[
              { term: t("objective"), value: labels.label("paidObjective", s.objective) },
              { term: t("budget"), value: budget(s.budgetAmount, s.budgetType, currency) },
              { term: t("audience"), value: <span dir="auto">{audience(s.audience)}</span> },
              { term: t("schedule"), value: schedule(campaign.startAt, campaign.endAt) },
            ]}
          />
        </div>
      </Card>
      <Card>
        <CardHeader title={t("adSets", { count: sets.length })} />
        {sets.length === 0 ? <p className="mt-3 text-body-sm text-fg-muted">{t("noAdSets")}</p> : null}
        <ul className="mt-4 flex flex-col gap-3">
          {sets.map((set) => (
            <li key={set.id} className="flex flex-col gap-2 rounded-field border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <PlatformBadge platform={set.platform} />
                  <h4 dir="auto" className="truncate text-body font-semibold text-fg">
                    {set.name}
                  </h4>
                </span>
                <Badge size="sm">{t("adsCount", { count: set.ads.length })}</Badge>
              </div>
              {set.budget.enabled || set.audience.enabled || set.schedule.enabled ? (
                <ul className="flex flex-col gap-0.5 text-caption text-fg-muted">
                  {set.budget.enabled ? <li>{t("ownBudget", { budget: budget(set.budget.amount, s.budgetType, currency) })}</li> : null}
                  {set.audience.enabled ? <li dir="auto">{t("ownAudience", { audience: audience(set.audience.value) })}</li> : null}
                  {set.schedule.enabled ? <li>{t("ownSchedule", { schedule: schedule(set.schedule.startAt, set.schedule.endAt) })}</li> : null}
                </ul>
              ) : (
                <p className="text-caption text-fg-muted">{t("usesCampaignSettings")}</p>
              )}
              {set.ads.map((ad) => (
                <p key={ad.id} className="flex flex-wrap items-center gap-2 rounded-field bg-sunken p-2.5 text-body-sm">
                  <span dir="auto" className="font-semibold text-fg">
                    {ad.name}
                  </span>
                  <span className="text-fg-muted">· {labels.label("cta", ad.callToAction)}</span>
                </p>
              ))}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function SocialSummary({ campaign }: { campaign: ICreatedCampaign }) {
  const t = useTranslations("CampaignSummary");
  const schedule = useScheduleLabel();
  const sets = campaign.adSets ?? [];
  return (
    <Card>
      <CardHeader title={t("platforms", { count: sets.length })} description={schedule(campaign.startAt, campaign.endAt)} />
      {sets.length === 0 ? <p className="mt-3 text-body-sm text-fg-muted">{t("noPlatforms")}</p> : null}
      <ul className="mt-4 flex flex-col gap-3">
        {sets.map((set) => (
          <li key={set.id} className="flex flex-col gap-2 rounded-field border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <PlatformBadge platform={set.platform} />
              <Badge size="sm">{t("postsCount", { count: set.ads?.length ?? 0 })}</Badge>
            </div>
            <ul className="flex flex-col gap-1.5">
              {(set.ads ?? []).map((a) => (
                <li key={a.id} dir="auto" className="rounded-field bg-sunken p-2.5 text-body-sm text-fg">
                  {a.creative?.title || a.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MessagingSummary({ campaign }: { campaign: ICreatedCampaign }) {
  const t = useTranslations("CampaignSummary");
  const labels = useCampaignLabels();
  const schedule = useScheduleLabel();
  const saved = messagingConfig(campaign);
  const [open, setOpen] = useState(false);
  const cfg = saved?.cfg;
  const template = cfg?.template;
  const channel = (cfg?.channel ?? "EMAIL") as MessagingChannel;
  return (
    <Card>
      <CardHeader
        title={t("message")}
        actions={
          template ? (
            <Button variant="secondary" size="sm" startIcon={<Eye />} onClick={() => setOpen(true)}>
              {t("previewMessage")}
            </Button>
          ) : null
        }
      />
      <div className="mt-4">
        <SummaryList
          rows={[
            { term: t("channel"), value: cfg?.channel ? labels.label("channel", cfg.channel) : DASH },
            { term: t("audience"), value: saved?.name ? <span dir="auto">{saved.name}</span> : DASH },
            { term: t("sender"), value: cfg?.senderConfig?.name ? <span dir="auto">{cfg.senderConfig.name}</span> : DASH },
            { term: t("template"), value: template?.name ? <span dir="auto">{template.name}</span> : DASH },
            { term: t("sendTime"), value: campaign.startAt ? schedule(campaign.startAt, null) : t("noSendTime") },
          ]}
        />
      </div>
      {template ? (
        <MessagingMessagePreviewDialog
          open={open}
          onOpenChange={setOpen}
          channel={channel}
          sender={cfg?.senderConfig?.name ?? ""}
          recipient={saved?.name}
          preview={{ name: template.name ?? "", subject: template.subject ?? undefined, body: stripHtml(template.body ?? "") }}
        />
      ) : null}
    </Card>
  );
}

/** The type-specific part of a campaign: settings and its ad groups, ad sets, posts or message. */
export function CampaignSummary({ campaign }: { campaign: ICreatedCampaign }) {
  switch (campaign.type) {
    case "GOOGLE_SEARCH_ADS":
      return <GoogleSummary campaign={campaign} />;
    case "PAID_SOCIAL_ADS":
      return <PaidSummary campaign={campaign} />;
    case "SOCIAL_MEDIA":
      return <SocialSummary campaign={campaign} />;
    case "MESSAGING":
      return <MessagingSummary campaign={campaign} />;
    default:
      return null;
  }
}
