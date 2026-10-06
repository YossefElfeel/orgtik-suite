"use client";

// Ad groups: keywords (and negatives) with their match types, a default bid in the ad account's
// currency, and responsive search ads. A group needs a name, a keyword and an ad: the client let
// empty groups through before (the server only checked at publish).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Megaphone, PencilSimple, Plus, Stack, Trash } from "@phosphor-icons/react";
import { Badge, Button, EmptyState, Field, IconButton, Input, MoneyField } from "@orgtik/ui";
import AddResponsiveSearchAdDialog from "@/components/dialogs/AddResponsiveSearchAdDialog";
import ResponsiveSearchAdPreviewDialog from "@/components/dialogs/ResponsiveSearchAdPreviewDialog";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useProjectContext } from "@/lib/project-context";
import { useDraft } from "@/lib/campaigns/use-draft";
import { adGroupsFromCampaign, buildGoogleSearchAdGroupsPayload } from "@/lib/campaigns/google-search/onboarding";
import { isolate } from "@/lib/bidi";
import type { CampaignAdGroup, CampaignResponsiveSearchAd } from "@/lib/campaigns/types";
import { KeywordEditor } from "../../../shared/KeywordEditor";
import { StepFrame } from "../../StepFrame";

type GroupErrors = { name?: string; keywords?: string; ads?: string };

export default function GoogleAdGroupsStep() {
  const t = useTranslations("CampaignGoogle");
  const { campaign, campaignId, goNext } = useCampaignStepNavigation();
  const project = useProjectContext();
  const currency = campaign?.budgetCurrency || campaign?.configuration?.budgetCurrency || project.currency;
  const draft = useDraft<{ groups: CampaignAdGroup[] }>({ groups: adGroupsFromCampaign(campaign) });
  const groups = draft.value.groups;
  const [errors, setErrors] = useState<{ list?: string; groups: Record<string, GroupErrors> }>({ groups: {} });
  const [editing, setEditing] = useState<{ groupId: string; ad: CampaignResponsiveSearchAd | null } | null>(null);
  const [preview, setPreview] = useState<CampaignResponsiveSearchAd | null>(null);
  const [update, { isLoading }] = useUpdateCampaignOnboardingMutation();

  const setGroups = (next: CampaignAdGroup[]) => draft.setValue({ groups: next });
  const patchGroup = (id: string, p: Partial<CampaignAdGroup>) => setGroups(groups.map((g) => (g.id === id ? { ...g, ...p } : g)));
  const addGroup = () => setGroups([...groups, { id: crypto.randomUUID(), name: t("adGroupDefaultName", { n: groups.length + 1 }), keywords: [], negativeKeywords: [], defaultBid: null, responsiveSearchAds: [] }]);

  const validate = () => {
    const out: typeof errors = { groups: {} };
    if (!groups.length) out.list = t("adGroupsRequired");
    for (const g of groups) {
      const e: GroupErrors = {};
      if (!g.name.trim()) e.name = t("adGroupNameRequired");
      if (!g.keywords.length) e.keywords = t("keywordsRequired");
      if (!g.responsiveSearchAds.length) e.ads = t("adsRequired");
      if (Object.keys(e).length) out.groups[g.id] = e;
    }
    setErrors(out);
    return !out.list && Object.keys(out.groups).length === 0;
  };

  const save = async () => {
    if (!campaignId || !validate()) return false;
    try {
      await update({ campaignId, body: buildGoogleSearchAdGroupsPayload(groups) }).unwrap();
      draft.reset(draft.value);
      return true;
    } catch {
      return false;
    }
  };
  useStepGuard(draft.dirty, save);

  const addButton = (
    <Button type="button" variant="secondary" startIcon={<Plus />} onClick={addGroup}>
      {t("addAdGroup")}
    </Button>
  );

  return (
    <StepFrame title={t("adGroupsTitle")} description={t("adGroupsDescription")} onSubmit={() => void save().then((ok) => ok && goNext())} busy={isLoading} headerActions={groups.length ? addButton : null}>
      {groups.length === 0 ? (
        <EmptyState size="compact" icon={<Stack />} title={t("noAdGroupsTitle")} description={t("noAdGroupsBody")} action={addButton} />
      ) : null}
      {errors.list ? <p className="text-body-sm text-danger">{errors.list}</p> : null}

      {groups.map((g) => {
        const e = errors.groups[g.id] ?? {};
        return (
          <section key={g.id} className="flex flex-col gap-4 rounded-card border border-line p-4" aria-label={g.name || t("adGroupUnnamed")}>
            <div className="flex items-end gap-2">
              <Field label={t("adGroupName")} required error={e.name} className="min-w-0 flex-1">
                <Input value={g.name} dir="auto" maxLength={80} onChange={(ev) => patchGroup(g.id, { name: ev.target.value })} />
              </Field>
              <Badge size="sm">{t("adsCount", { count: g.responsiveSearchAds.length })}</Badge>
              <IconButton type="button" variant="ghost" label={t("removeAdGroup", { name: isolate(g.name || t("adGroupUnnamed")) })} icon={<Trash />} onClick={() => setGroups(groups.filter((x) => x.id !== g.id))} />
            </div>

            <KeywordEditor label={t("keywords")} required keywords={g.keywords} onChange={(k) => patchGroup(g.id, { keywords: k })} placeholder={t("keywordPlaceholder")} error={e.keywords} />
            <KeywordEditor label={t("negativeKeywords")} negative keywords={g.negativeKeywords} onChange={(k) => patchGroup(g.id, { negativeKeywords: k })} placeholder={t("negativeKeywordPlaceholder")} />

            <Field label={t("defaultBid")} optional description={t("defaultBidHint", { currency })} className="max-w-60">
              <MoneyField currency={currency} value={g.defaultBid} min={0} onValueChange={(n) => patchGroup(g.id, { defaultBid: n })} />
            </Field>

            <div className="flex flex-col gap-2">
              <h3 className="text-label text-fg">{t("responsiveAds")}</h3>
              {g.responsiveSearchAds.length ? (
                <ul className="flex flex-col gap-2">
                  {g.responsiveSearchAds.map((ad) => (
                    <li key={ad.id} className="flex items-center gap-3 rounded-field border border-line p-3">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-field bg-sunken text-fg-muted">
                        <Megaphone className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span dir="auto" className="truncate text-body font-semibold text-fg">
                          {ad.name}
                        </span>
                        <span className="text-caption text-fg-muted">{t("adSummary", { headlines: ad.headlines.length, descriptions: ad.descriptions.length })}</span>
                      </span>
                      <IconButton type="button" variant="ghost" label={t("previewAd", { name: isolate(ad.name) })} icon={<Eye />} onClick={() => setPreview(ad)} />
                      <IconButton type="button" variant="ghost" label={t("editAd", { name: isolate(ad.name) })} icon={<PencilSimple />} onClick={() => setEditing({ groupId: g.id, ad })} />
                      <IconButton type="button" variant="ghost" label={t("removeAd", { name: isolate(ad.name) })} icon={<Trash />} onClick={() => patchGroup(g.id, { responsiveSearchAds: g.responsiveSearchAds.filter((a) => a.id !== ad.id) })} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {e.ads ? <p className="text-caption text-danger">{e.ads}</p> : null}
              <Button type="button" variant="secondary" startIcon={<Plus />} onClick={() => setEditing({ groupId: g.id, ad: null })} className="self-start">
                {t("addResponsiveAd")}
              </Button>
            </div>
          </section>
        );
      })}

      {editing ? (
        <AddResponsiveSearchAdDialog
          key={editing.ad?.id ?? `new-${editing.groupId}`}
          open
          ad={editing.ad}
          onOpenChange={(o) => !o && setEditing(null)}
          onSave={(ad) => {
            const g = groups.find((x) => x.id === editing.groupId);
            if (!g) return;
            const exists = g.responsiveSearchAds.some((a) => a.id === ad.id);
            patchGroup(g.id, { responsiveSearchAds: exists ? g.responsiveSearchAds.map((a) => (a.id === ad.id ? ad : a)) : [...g.responsiveSearchAds, ad] });
          }}
        />
      ) : null}
      <ResponsiveSearchAdPreviewDialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)} ad={preview} />
    </StepFrame>
  );
}
