"use client";

// Ad sets: one or more per platform, each with ads, and optional overrides of the campaign's
// budget, audience and schedule. The ad sets used to live only in this screen's memory, so a reload
// lost them, and a schedule override was never sent: both are now loaded from and saved to the API.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Image as ImageIcon, Plus, Stack, Trash } from "@phosphor-icons/react";
import { Badge, Button, EmptyState, Field, IconButton, Input, MoneyField, Switch, useFormatter } from "@orgtik/ui";
import AddSocialMediaPlatformDialog from "@/components/dialogs/AddSocialMediaPlatformDialog";
import AddPaidSocialAdDialog from "@/components/dialogs/AddPaidSocialAdDialog";
import SocialMediaPostPreviewDialog from "@/components/dialogs/SocialMediaPostPreviewDialog";
import { PlatformBadge, platformMeta } from "@/components/shared/PlatformBadge";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useGetAllIntegrationsQuery } from "@/redux/features/integrations/integrationsApi";
import { useProjectContext } from "@/lib/project-context";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { useDraft } from "@/lib/campaigns/use-draft";
import { scheduleErrors } from "@/lib/campaigns/schedule";
import { extractIntegrations } from "@/lib/campaigns/integrations";
import { adSetsFromCampaign, buildPaidSocialAdSetsPayload, paidSettingsFromCampaign, type PaidAd, type PaidAdSet } from "@/lib/campaigns/paid-social";
import { PAID_SOCIAL_PLATFORM_IDS } from "@/constants/campaigns";
import { isolate } from "@/lib/bidi";
import { AudienceFields, audienceErrors, type AudienceErrors } from "../../../shared/AudienceFields";
import { ScheduleFields } from "../../../shared/ScheduleFields";
import { StepFrame } from "../../StepFrame";

type SetErrors = { name?: string; ads?: string; budget?: string; audience?: AudienceErrors; schedule?: ReturnType<typeof scheduleErrors>; integration?: string };

function Override({ title, summary, enabled, onToggle, children }: { title: string; summary: string; enabled: boolean; onToggle: (on: boolean) => void; children: React.ReactNode }) {
  const t = useTranslations("CampaignPaid");
  return (
    <div className="flex flex-col gap-3 rounded-field border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-label text-fg">{title}</h3>
          {!enabled ? <p className="text-caption text-fg-muted">{summary}</p> : null}
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} label={t("override")} />
      </div>
      {enabled ? children : null}
    </div>
  );
}

export default function PaidAdSetsStep() {
  const t = useTranslations("CampaignPaid");
  const tw = useTranslations("CampaignWizard");
  const f = useFormatter();
  const labels = useCampaignLabels();
  const project = useProjectContext();
  const { campaign, campaignId, goNext } = useCampaignStepNavigation();
  const defaults = useMemo(() => paidSettingsFromCampaign(campaign), [campaign]);
  const currency = campaign?.budgetCurrency || campaign?.configuration?.budgetCurrency || project.currency;
  const draft = useDraft<{ sets: PaidAdSet[] }>({ sets: adSetsFromCampaign(campaign) });
  const sets = draft.value.sets;
  const [errors, setErrors] = useState<{ list?: string; sets: Record<string, SetErrors> }>({ sets: {} });
  const [adFor, setAdFor] = useState<PaidAdSet | null>(null);
  const [preview, setPreview] = useState<{ platform: string; ad: PaidAd } | null>(null);
  const [update, { isLoading }] = useUpdateCampaignOnboardingMutation();
  const integrations = extractIntegrations(useGetAllIntegrationsQuery({ isConnected: true }).data);
  const connected = PAID_SOCIAL_PLATFORM_IDS.filter((p) => integrations.some((i) => i.platform === p));

  const setSets = (next: PaidAdSet[]) => draft.setValue({ sets: next });
  const patchSet = (id: string, p: Partial<PaidAdSet>) => setSets(sets.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const addSet = (platform: string) =>
    setSets([
      ...sets,
      {
        id: crypto.randomUUID(),
        name: t("adSetDefaultName", { platform: platformMeta(platform).name }),
        platform,
        integrationId: integrations.find((i) => i.platform === platform)?.id ?? "",
        budget: { enabled: false, amount: defaults.budgetAmount },
        audience: { enabled: false, value: defaults.audience },
        schedule: { enabled: false, startAt: defaults.startAt, endAt: defaults.endAt },
        ads: [],
      },
    ]);

  const budgetSummary = defaults.budgetAmount ? t(defaults.budgetType === "LIFETIME" ? "usingBudgetLifetime" : "usingBudgetDaily", { amount: f.money(defaults.budgetAmount, currency) }) : t("usingCampaignBudget");
  const audienceSummary = t("usingAudience", { count: defaults.audience.locations.length, min: defaults.audience.ageMin, max: defaults.audience.ageMax });
  const scheduleSummary = defaults.startAt ? t("usingScheduleFrom", { date: f.date(defaults.startAt, { dateStyle: "medium", timeZone: project.timeZone }) }) : t("usingSchedule");

  const validate = () => {
    const out: typeof errors = { sets: {} };
    if (!sets.length) out.list = t("adSetsRequired");
    for (const s of sets) {
      const e: SetErrors = {};
      if (!s.name.trim()) e.name = t("adSetNameRequired");
      if (!s.integrationId) e.integration = t("adSetNoAccount", { platform: platformMeta(s.platform).name });
      if (!s.ads.length) e.ads = t("adsRequired");
      if (s.budget.enabled && !(Number(s.budget.amount) > 0)) e.budget = t("budgetRequired");
      if (s.audience.enabled) {
        const a = audienceErrors(s.audience.value, t);
        if (Object.keys(a).length) e.audience = a;
      }
      if (s.schedule.enabled) {
        const sc = scheduleErrors(s.schedule);
        if (sc.start || sc.end) e.schedule = sc;
      }
      if (Object.keys(e).length) out.sets[s.id] = e;
    }
    setErrors(out);
    return !out.list && Object.keys(out.sets).length === 0;
  };

  const save = async () => {
    if (!campaignId || !validate()) return false;
    try {
      await update({ campaignId, body: buildPaidSocialAdSetsPayload(sets) }).unwrap();
      draft.reset(draft.value);
      return true;
    } catch {
      return false;
    }
  };
  useStepGuard(draft.dirty, save);

  const addMenu = (
    <AddSocialMediaPlatformDialog
      trigger={
        <Button type="button" variant="secondary" startIcon={<Plus />}>
          {t("addAdSet")}
        </Button>
      }
      platforms={PAID_SOCIAL_PLATFORM_IDS}
      connected={connected}
      onSelect={addSet}
    />
  );

  return (
    <StepFrame title={t("adSetsTitle")} description={t("adSetsDescription")} onSubmit={() => void save().then((ok) => ok && goNext())} busy={isLoading} headerActions={sets.length ? addMenu : null}>
      {sets.length === 0 ? <EmptyState size="compact" icon={<Stack />} title={t("noAdSetsTitle")} description={t("noAdSetsBody")} action={addMenu} /> : null}
      {errors.list ? <p className="text-body-sm text-danger">{errors.list}</p> : null}

      {sets.map((s) => {
        const e = errors.sets[s.id] ?? {};
        return (
          <section key={s.id} className="flex flex-col gap-4 rounded-card border border-line p-4" aria-label={s.name || platformMeta(s.platform).name}>
            <div className="flex flex-wrap items-end gap-2">
              <PlatformBadge platform={s.platform} className="pb-2.5" />
              <Field label={t("adSetName")} required error={e.name} className="min-w-48 flex-1">
                <Input value={s.name} dir="auto" maxLength={80} onChange={(ev) => patchSet(s.id, { name: ev.target.value })} />
              </Field>
              <Badge size="sm">{t("adsCount", { count: s.ads.length })}</Badge>
              <IconButton type="button" variant="ghost" label={t("removeAdSet", { name: isolate(s.name) })} icon={<Trash />} onClick={() => setSets(sets.filter((x) => x.id !== s.id))} />
            </div>
            {e.integration ? <p className="text-caption text-danger">{e.integration}</p> : null}

            <Override title={t("budgetTitle")} summary={budgetSummary} enabled={s.budget.enabled} onToggle={(on) => patchSet(s.id, { budget: { ...s.budget, enabled: on } })}>
              <Field label={t("budgetAmount")} required error={e.budget} description={t("currencyNote", { currency })} className="max-w-72">
                <MoneyField currency={currency} value={s.budget.amount} min={0} onValueChange={(n) => patchSet(s.id, { budget: { ...s.budget, amount: n } })} />
              </Field>
            </Override>
            <Override title={t("audienceTitle")} summary={audienceSummary} enabled={s.audience.enabled} onToggle={(on) => patchSet(s.id, { audience: { ...s.audience, enabled: on } })}>
              <AudienceFields idPrefix={s.id} value={s.audience.value} onChange={(a) => patchSet(s.id, { audience: { ...s.audience, value: a } })} errors={e.audience} />
            </Override>
            <Override title={tw("schedule.title")} summary={scheduleSummary} enabled={s.schedule.enabled} onToggle={(on) => patchSet(s.id, { schedule: { ...s.schedule, enabled: on } })}>
              <ScheduleFields startAt={s.schedule.startAt} endAt={s.schedule.endAt} onChange={(sc) => patchSet(s.id, { schedule: { ...s.schedule, ...sc } })} errors={e.schedule} />
            </Override>

            <div className="flex flex-col gap-2">
              <h3 className="text-label text-fg">{t("ads")}</h3>
              {s.ads.length ? (
                <ul className="flex flex-col gap-2">
                  {s.ads.map((ad) => (
                    <li key={ad.id} className="flex items-center gap-3 rounded-field border border-line p-3">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-field bg-sunken text-fg-muted">
                        <ImageIcon className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span dir="auto" className="truncate text-body font-semibold text-fg">
                          {ad.name}
                        </span>
                        <span className="truncate text-caption text-fg-muted">
                          {labels.label("cta", ad.callToAction)} · <span dir="auto">{ad.post?.title}</span>
                        </span>
                      </span>
                      {ad.post ? <IconButton type="button" variant="ghost" label={t("previewAd", { name: isolate(ad.name) })} icon={<Eye />} onClick={() => setPreview({ platform: s.platform, ad })} /> : null}
                      <IconButton type="button" variant="ghost" label={t("removeAd", { name: isolate(ad.name) })} icon={<Trash />} onClick={() => patchSet(s.id, { ads: s.ads.filter((a) => a.id !== ad.id) })} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {e.ads ? <p className="text-caption text-danger">{e.ads}</p> : null}
              <Button type="button" variant="secondary" startIcon={<Plus />} onClick={() => setAdFor(s)} className="self-start">
                {t("addAd")}
              </Button>
            </div>
          </section>
        );
      })}

      {adFor ? (
        <AddPaidSocialAdDialog
          key={adFor.id}
          open
          platform={adFor.platform}
          onOpenChange={(o) => !o && setAdFor(null)}
          onAdd={(ad) => {
            const current = sets.find((x) => x.id === adFor.id);
            if (current) patchSet(current.id, { ads: [...current.ads, ad] });
          }}
        />
      ) : null}
      <SocialMediaPostPreviewDialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)} platform={preview?.platform ?? ""} post={preview?.ad.post ?? null} />
    </StepFrame>
  );
}
