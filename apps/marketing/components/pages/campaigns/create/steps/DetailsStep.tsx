"use client";

// Details: the campaign's type, name, category and description. Next creates the draft (or saves
// it) and moves on. Changing the type of a saved draft asks first and says what is deleted with it:
// the server clears a draft's settings and ad sets when its type changes (MKT-010).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChatCircleText, GoogleLogo, Megaphone, ShareNetwork } from "@phosphor-icons/react";
import { ConfirmDialog, Field, Input, Textarea, toast } from "@orgtik/ui";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useCreateCampaignMutation, useUpdateCampaignDraftMutation } from "@/redux/features/campaigns/campaignsApi";
import { CAMPAIGN_CATEGORY_SUGGESTIONS, CAMPAIGN_OBJECTIVE_VALUES } from "@/constants/campaigns";
import { API_TYPE_TO_OBJECTIVE, OBJECTIVE_TO_API_TYPE } from "@/lib/campaigns/workflow";
import { humanize, useCampaignLabels } from "@/lib/campaigns/labels";
import { useDraft } from "@/lib/campaigns/use-draft";
import { isolate } from "@/lib/bidi";
import type { CampaignObjective } from "@/types/campaignTypes";
import type { ICreatedCampaign } from "@/types/campaigns";
import { ChoiceCards, ChoiceChips } from "../../shared/Choice";
import { StepFrame } from "../StepFrame";

const ICONS: Record<CampaignObjective, React.ReactNode> = {
  GOOGLE_SEARCH: <GoogleLogo weight="bold" className="size-5" />,
  PAID_SOCIAL: <Megaphone className="size-5" />,
  SOCIAL_MEDIA: <ShareNetwork className="size-5" />,
  MESSAGING: <ChatCircleText className="size-5" />,
};

type Values = { objective: CampaignObjective; name: string; category: string | null; otherCategory: string; description: string };

const SUGGESTED = new Set<string>(CAMPAIGN_CATEGORY_SUGGESTIONS);

function initialValues(campaign: ICreatedCampaign | undefined, objective: CampaignObjective): Values {
  const saved = campaign?.categories?.[0]?.name?.toUpperCase() ?? "";
  return {
    objective: campaign ? API_TYPE_TO_OBJECTIVE[campaign.type] : objective,
    name: campaign?.name ?? "",
    category: !saved ? null : SUGGESTED.has(saved) ? saved : "OTHER",
    otherCategory: saved && !SUGGESTED.has(saved) ? humanize(saved) : "",
    description: campaign?.description ?? "",
  };
}

export default function DetailsStep() {
  const t = useTranslations("CampaignDetailsStep");
  const labels = useCampaignLabels();
  const { campaign, campaignId, objective, replaceObjective, goNext } = useCampaignStepNavigation();
  const draft = useDraft<Values>(initialValues(campaign, objective));
  const v = draft.value;
  const [errors, setErrors] = useState<{ name?: string; otherCategory?: string }>({});
  const [pendingType, setPendingType] = useState<CampaignObjective | null>(null);
  const [createCampaign, { isLoading: creating }] = useCreateCampaignMutation();
  const [updateDraft, { isLoading: updating }] = useUpdateCampaignDraftMutation();
  const savedObjective = campaign ? API_TYPE_TO_OBJECTIVE[campaign.type] : null;

  const pickType = (next: CampaignObjective) => {
    if (next === v.objective) return;
    // A saved draft with something in it loses it: ask first.
    const hasWork = campaign && (Object.keys(campaign.configuration ?? {}).length > 0 || (campaign.adSets?.length ?? 0) > 0);
    if (savedObjective && next !== savedObjective && hasWork) return setPendingType(next);
    draft.patch({ objective: next });
    if (!campaignId) replaceObjective(next);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!v.name.trim()) e.name = t("nameRequired");
    else if (v.name.trim().length > 120) e.name = t("nameTooLong");
    if (v.category === "OTHER" && !v.otherCategory.trim()) e.otherCategory = t("otherCategoryRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Saves the draft; resolves to its id, or null when it couldn't. */
  const save = async (): Promise<string | null> => {
    if (!validate()) return null;
    const category = v.category === "OTHER" ? v.otherCategory.trim() : v.category;
    const body = {
      name: v.name.trim(),
      type: OBJECTIVE_TO_API_TYPE[v.objective],
      categoryNames: category ? [category] : [],
      description: v.description.trim(),
    };
    try {
      if (campaignId) {
        await updateDraft({ campaignId, body }).unwrap();
        draft.reset(v);
        return campaignId;
      }
      const created = await createCampaign(body).unwrap();
      draft.reset(v);
      return created.data.id;
    } catch {
      // baseApi has said why.
      return null;
    }
  };

  useStepGuard(draft.dirty, async () => Boolean(await save()));

  const submit = async () => {
    const id = await save();
    if (!id) return;
    if (campaignId && savedObjective && savedObjective !== v.objective) toast.info(t("typeChanged", { type: labels.type(v.objective) }));
    goNext({ campaignId: id, objective: v.objective });
  };

  const lost: string[] = [];
  if (campaign) {
    if (Object.keys(campaign.configuration ?? {}).length > 0) lost.push(t("lostSettings"));
    const sets = campaign.adSets?.length ?? 0;
    if (sets > 0) {
      if (campaign.type === "GOOGLE_SEARCH_ADS") lost.push(t("lostAdGroups", { count: sets }));
      else if (campaign.type === "PAID_SOCIAL_ADS") lost.push(t("lostAdSets", { count: sets }));
      else if (campaign.type === "SOCIAL_MEDIA") lost.push(t("lostPlatforms", { count: sets }));
      else lost.push(t("lostMessage"));
    }
  }

  return (
    <StepFrame title={t("title")} description={t("description")} onSubmit={() => void submit()} busy={creating || updating}>
      <ChoiceCards<CampaignObjective>
        legend={t("typeLegend")}
        name="campaign-type"
        value={v.objective}
        onChange={pickType}
        options={CAMPAIGN_OBJECTIVE_VALUES.map((o) => ({ value: o, title: labels.type(o), description: labels.typeDescription(o), icon: ICONS[o] }))}
      />

      <Field label={t("name")} required error={errors.name}>
        <Input value={v.name} maxLength={120} dir="auto" placeholder={t("namePlaceholder")} onChange={(e) => draft.patch({ name: e.target.value })} required />
      </Field>

      <div className="flex flex-col gap-3">
        <ChoiceChips<string>
          legend={t("category")}
          name="campaign-category"
          allowClear
          value={v.category}
          onChange={(c) => draft.patch({ category: c })}
          options={[...CAMPAIGN_CATEGORY_SUGGESTIONS.map((c) => ({ value: c, label: labels.label("category", c) })), { value: "OTHER", label: t("otherCategory") }]}
        />
        {v.category === "OTHER" ? (
          <Field label={t("otherCategoryLabel")} required error={errors.otherCategory}>
            <Input value={v.otherCategory} maxLength={60} dir="auto" onChange={(e) => draft.patch({ otherCategory: e.target.value })} />
          </Field>
        ) : null}
      </div>

      <Field label={t("descriptionLabel")} optional>
        <Textarea value={v.description} maxLength={1000} dir="auto" maxRows={6} placeholder={t("descriptionPlaceholder")} onChange={(e) => draft.patch({ description: e.target.value })} />
      </Field>

      {pendingType ? (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setPendingType(null)}
          tone="danger"
          title={t("typeChangeTitle", { from: labels.type(savedObjective), to: labels.type(pendingType) })}
          impact={
            <span className="flex flex-col gap-2">
              <span>{t("typeChangeIntro", { name: isolate(campaign?.name) })}</span>
              <ul className="list-disc ps-5">
                {lost.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <span>{t("typeChangeKept")}</span>
            </span>
          }
          confirmLabel={t("typeChangeConfirm", { to: labels.type(pendingType) })}
          cancelLabel={t("typeChangeKeep", { from: labels.type(savedObjective) })}
          onConfirm={() => {
            draft.patch({ objective: pendingType });
            setPendingType(null);
          }}
        />
      ) : null}
    </StepFrame>
  );
}
