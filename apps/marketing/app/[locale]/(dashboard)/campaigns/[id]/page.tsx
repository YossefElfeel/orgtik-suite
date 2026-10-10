"use client";

import { useParams } from "next/navigation";
import CampaignEngagement from "@/components/pages/campaign-engagement";
import CampaignDetailsView from "@/components/pages/campaigns/details/CampaignDetailsView";

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <CampaignDetailsView key={id} campaignId={id} />
      <CampaignEngagement key={`engagement:${id}`} id={id} />
    </>
  );
}
