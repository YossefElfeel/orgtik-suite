"use client";

// A paid social ad: its name, the post it promotes (picked from the library or written now) and
// its call to action, shown in words.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input, Select } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import SocialMediaPostCreativeActions from "@/components/dialogs/SocialMediaPostCreativeActions";
import { PAID_SOCIAL_CALL_TO_ACTION_VALUES, type PaidSocialCallToAction } from "@/constants/campaigns";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import type { PaidAd } from "@/lib/campaigns/paid-social";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  onAdd: (ad: PaidAd) => void;
};

export default function AddPaidSocialAdDialog({ open, onOpenChange, platform, onAdd }: Props) {
  const t = useTranslations("CampaignDialogs");
  const labels = useCampaignLabels();
  const [ad, setAd] = useState<PaidAd>(() => ({ id: crypto.randomUUID(), name: "", post: null, callToAction: "LEARN_MORE" }));
  const [errors, setErrors] = useState<{ name?: string; post?: string }>({});

  const submit = async () => {
    const e: typeof errors = {};
    if (!ad.name.trim()) e.name = t("ad.nameRequired");
    if (!ad.post) e.post = t("ad.postRequired");
    setErrors(e);
    if (Object.keys(e).length) throw new Error("invalid");
    onAdd({ ...ad, name: ad.name.trim() });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setAd({ id: crypto.randomUUID(), name: "", post: null, callToAction: "LEARN_MORE" });
        setErrors({});
      }}
      size="md"
      title={t("ad.title")}
      description={t("ad.description")}
      submitLabel={t("ad.add")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
    >
      <Field label={t("ad.name")} required error={errors.name}>
        <Input value={ad.name} maxLength={80} dir="auto" placeholder={t("ad.namePlaceholder")} onChange={(e) => setAd({ ...ad, name: e.target.value })} />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-label text-fg">
          {t("ad.post")}
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        </legend>
        {ad.post ? (
          <p className="text-body-sm text-fg">
            {t("ad.selectedPost")}{" "}
            <span dir="auto" className="font-semibold">
              {ad.post.title}
            </span>
          </p>
        ) : (
          <p className="text-body-sm text-fg-muted">{t("ad.noPost")}</p>
        )}
        <SocialMediaPostCreativeActions
          platform={platform}
          onLinked={(post) => {
            setAd((x) => ({ ...x, post, name: x.name || post.title }));
            setErrors((e) => ({ ...e, post: undefined }));
          }}
        />
        {errors.post ? <p className="text-caption text-danger">{errors.post}</p> : null}
      </fieldset>
      <Field label={t("ad.cta")}>
        <Select<PaidSocialCallToAction>
          value={ad.callToAction}
          onValueChange={(c) => c && setAd({ ...ad, callToAction: c })}
          options={PAID_SOCIAL_CALL_TO_ACTION_VALUES.map((c) => ({ value: c, label: labels.label("cta", c) }))}
        />
      </Field>
    </FormDialog>
  );
}
