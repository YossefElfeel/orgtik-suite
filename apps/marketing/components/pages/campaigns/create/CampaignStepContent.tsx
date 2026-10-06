"use client";

// The current step's screen. A later step opened without a saved campaign (a deep link) says to
// start with Details instead of offering buttons that can't save (MKT-054).
import { useEffect, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Button, EmptyState } from "@orgtik/ui";
import { useCampaignStepNavigation } from "@/hooks/useCampaignStepNavigation";
import type { CampaignObjective } from "@/types/campaignTypes";
import type { CampaignStepId } from "@/lib/campaigns/workflow";
import { StepSkeleton } from "./StepFrame";
import DetailsStep from "./steps/DetailsStep";
import GoogleSettingsStep from "./steps/google/SettingsStep";
import GoogleAdGroupsStep from "./steps/google/AdGroupsStep";
import PaidSettingsStep from "./steps/paid/SettingsStep";
import PaidAdSetsStep from "./steps/paid/AdSetsStep";
import SocialPostsStep from "./steps/social/PostsStep";
import MessagingAudienceStep from "./steps/messaging/AudienceStep";
import MessagingMessageStep from "./steps/messaging/MessageStep";
import ReviewStep from "./steps/ReviewStep";

const STEPS: Record<CampaignObjective, Partial<Record<CampaignStepId, ComponentType>>> = {
  GOOGLE_SEARCH: { settings: GoogleSettingsStep, "ad-groups": GoogleAdGroupsStep },
  PAID_SOCIAL: { settings: PaidSettingsStep, "ad-sets": PaidAdSetsStep },
  SOCIAL_MEDIA: { posts: SocialPostsStep },
  MESSAGING: { audience: MessagingAudienceStep, message: MessagingMessageStep },
};

export default function CampaignStepContent() {
  const t = useTranslations("CampaignWizard");
  const { objective, stepId, campaignId, campaignStatus, isRefreshing, goToStep } = useCampaignStepNavigation();
  // A step reads the saved campaign once, when it opens. Right after Next the campaign is being
  // fetched again (the save changed it): wait for the fresh copy before opening the next step.
  const stepKey = `${campaignId}-${stepId}`;
  const [settled, setSettled] = useState<string | null>(null);
  useEffect(() => {
    if (!isRefreshing) setSettled(stepKey);
  }, [isRefreshing, stepKey]);

  if (campaignStatus === "notFound" || campaignStatus === "error") return null;
  if (campaignStatus === "loading" || (campaignId && settled !== stepKey)) return <StepSkeleton title={t(`steps.${stepId}`)} />;
  if (stepId === "details") return <DetailsStep key={campaignId ?? "new"} />;
  if (!campaignId) {
    return (
      <EmptyState
        title={t("startWithDetailsTitle")}
        description={t("startWithDetailsBody")}
        action={
          <Button variant="primary" onClick={() => goToStep("details")}>
            {t("goToDetails")}
          </Button>
        }
      />
    );
  }
  if (stepId === "review") return <ReviewStep key={campaignId} />;
  const Step = STEPS[objective][stepId];
  return Step ? <Step key={`${campaignId}-${stepId}`} /> : null;
}
