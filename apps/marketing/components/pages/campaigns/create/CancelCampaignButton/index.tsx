"use client";

// Leaving the wizard. Its old copy said "All unsaved progress will be lost" while the draft was
// already saved by Details (MKT-054): it now says what is kept and what isn't.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, ConfirmDialog } from "@orgtik/ui";
import { useCampaignStepNavigation } from "@/hooks/useCampaignStepNavigation";

export default function CancelCampaignButton() {
  const t = useTranslations("CampaignWizard");
  const { campaignId, isDirty, leave } = useCampaignStepNavigation();
  const [open, setOpen] = useState(false);
  const target = campaignId ? `/campaigns/${campaignId}` : "/campaigns";

  // Nothing typed and nothing saved: there's nothing to warn about.
  if (!campaignId && !isDirty) {
    return (
      <Button type="button" variant="ghost" onClick={() => leave("/campaigns")}>
        {t("cancel")}
      </Button>
    );
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" variant="ghost">
          {t("cancel")}
        </Button>
      }
      tone="primary"
      title={t("cancelTitle")}
      impact={campaignId ? (isDirty ? t("cancelImpactSavedDirty") : t("cancelImpactSaved")) : t("cancelImpactNew")}
      confirmLabel={t("cancelConfirm")}
      cancelLabel={t("keepEditing")}
      onConfirm={() => {
        setOpen(false);
        // This dialog already said the step's edits aren't kept: no second prompt.
        leave(target, true);
      }}
    />
  );
}
