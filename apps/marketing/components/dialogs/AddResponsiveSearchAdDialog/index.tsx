"use client";

// A responsive search ad: name, final URL, 3–15 headlines, 2–4 descriptions and the display path,
// with Google's limits checked on the fields.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { TagInput } from "@/components/pages/campaigns/shared/TagInput";
import { RSA_LIMITS, isValidUrl } from "@/lib/campaigns/google-search/onboarding";
import type { CampaignResponsiveSearchAd } from "@/lib/campaigns/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ad: CampaignResponsiveSearchAd) => void;
  /** An ad to edit; a new one when left out. */
  ad?: CampaignResponsiveSearchAd | null;
};

const empty = (): CampaignResponsiveSearchAd => ({ id: crypto.randomUUID(), name: "", finalUrl: "", headlines: [], descriptions: [], path1: "", path2: "" });

export default function AddResponsiveSearchAdDialog({ open, onOpenChange, onSave, ad }: Props) {
  const t = useTranslations("CampaignDialogs");
  const tw = useTranslations("CampaignWizard");
  const [v, setV] = useState<CampaignResponsiveSearchAd>(ad ?? empty());
  const [errors, setErrors] = useState<Partial<Record<"name" | "finalUrl" | "headlines" | "descriptions", string>>>({});
  const patch = (p: Partial<CampaignResponsiveSearchAd>) => setV((x) => ({ ...x, ...p }));

  const submit = async () => {
    const e: typeof errors = {};
    if (!v.name.trim()) e.name = t("rsa.nameRequired");
    if (!isValidUrl(v.finalUrl)) e.finalUrl = t("rsa.urlInvalid");
    if (v.headlines.length < RSA_LIMITS.headlinesMin) e.headlines = t("rsa.headlinesMin", { count: RSA_LIMITS.headlinesMin });
    if (v.descriptions.length < RSA_LIMITS.descriptionsMin) e.descriptions = t("rsa.descriptionsMin", { count: RSA_LIMITS.descriptionsMin });
    setErrors(e);
    if (Object.keys(e).length) throw new Error("invalid");
    onSave({ ...v, name: v.name.trim(), finalUrl: v.finalUrl.trim(), path1: v.path1?.trim() || undefined, path2: v.path2?.trim() || undefined });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setV(ad ?? empty());
        setErrors({});
      }}
      title={ad ? t("rsa.editTitle") : t("rsa.title")}
      description={t("rsa.description")}
      submitLabel={ad ? t("rsa.save") : t("rsa.add")}
      cancelLabel={tw("cancel")}
      onSubmit={submit}
    >
      <Field label={t("rsa.name")} required error={errors.name}>
        <Input value={v.name} maxLength={80} dir="auto" placeholder={t("rsa.namePlaceholder")} onChange={(e) => patch({ name: e.target.value })} />
      </Field>
      <Field label={t("rsa.finalUrl")} required error={errors.finalUrl} description={t("rsa.finalUrlHint")}>
        <Input type="url" dir="auto" value={v.finalUrl} placeholder={t("rsa.finalUrlPlaceholder")} onChange={(e) => patch({ finalUrl: e.target.value })} />
      </Field>
      <TagInput
        label={t("rsa.headlines")}
        required
        values={v.headlines}
        onChange={(headlines) => patch({ headlines })}
        maxLength={RSA_LIMITS.headlineLength}
        max={RSA_LIMITS.headlinesMax}
        placeholder={t("rsa.headlinePlaceholder")}
        description={t("rsa.headlinesHint", { min: RSA_LIMITS.headlinesMin, max: RSA_LIMITS.headlinesMax, length: RSA_LIMITS.headlineLength, count: v.headlines.length })}
        error={errors.headlines}
      />
      <TagInput
        label={t("rsa.descriptions")}
        required
        values={v.descriptions}
        onChange={(descriptions) => patch({ descriptions })}
        maxLength={RSA_LIMITS.descriptionLength}
        max={RSA_LIMITS.descriptionsMax}
        placeholder={t("rsa.descriptionPlaceholder")}
        description={t("rsa.descriptionsHint", { min: RSA_LIMITS.descriptionsMin, max: RSA_LIMITS.descriptionsMax, length: RSA_LIMITS.descriptionLength, count: v.descriptions.length })}
        error={errors.descriptions}
      />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-label text-fg">{t("rsa.displayPath")}</legend>
        <p className="text-caption text-fg-muted">{t("rsa.displayPathHint", { length: RSA_LIMITS.pathLength })}</p>
        <div className="grid grid-cols-2 gap-3">
          <Input aria-label={t("rsa.path1")} dir="auto" value={v.path1 ?? ""} maxLength={RSA_LIMITS.pathLength} placeholder={t("rsa.path1")} onChange={(e) => patch({ path1: e.target.value })} />
          <Input aria-label={t("rsa.path2")} dir="auto" value={v.path2 ?? ""} maxLength={RSA_LIMITS.pathLength} placeholder={t("rsa.path2")} onChange={(e) => patch({ path2: e.target.value })} />
        </div>
      </fieldset>
    </FormDialog>
  );
}
