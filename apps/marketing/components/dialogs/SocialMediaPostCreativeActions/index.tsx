"use client";

// The two ways to add a post to a campaign: pick one from the library, or write a new draft.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListMagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button } from "@orgtik/ui";
import CreateSocialMediaPostDialog from "@/components/dialogs/CreateSocialMediaPostDialog";
import PickSocialMediaPostDialog from "@/components/dialogs/PickSocialMediaPostDialog";
import type { CampaignLinkedPost } from "@/lib/campaigns/types";

type Props = {
  platform: string;
  onLinked: (post: CampaignLinkedPost) => void;
  excludeIds?: string[];
  /** Names the buttons for screen readers when several platforms have them ("for Facebook"). */
  context?: string;
};

export default function SocialMediaPostCreativeActions({ platform, onLinked, excludeIds, context }: Props) {
  const t = useTranslations("CampaignDialogs");
  const [pick, setPick] = useState(false);
  const [create, setCreate] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" startIcon={<ListMagnifyingGlass />} onClick={() => setPick(true)} aria-label={context ? t("pickFor", { context }) : undefined}>
        {t("pickExisting")}
      </Button>
      <Button type="button" variant="secondary" startIcon={<Plus />} onClick={() => setCreate(true)} aria-label={context ? t("createFor", { context }) : undefined}>
        {t("createNew")}
      </Button>
      <PickSocialMediaPostDialog open={pick} onOpenChange={setPick} platform={platform} onSelect={onLinked} excludeIds={excludeIds} />
      <CreateSocialMediaPostDialog open={create} onOpenChange={setCreate} platform={platform} onCreate={onLinked} />
    </div>
  );
}
