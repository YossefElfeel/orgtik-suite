"use client";

// A linked post as it will go out: the platform, the brand that posts it, and its text. It shows
// what the campaign knows about the post; the post itself is edited in Posts.
import { useTranslations } from "next-intl";
import { Avatar, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { useProjectContext } from "@/lib/project-context";
import type { CampaignLinkedPost } from "@/lib/campaigns/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  post: CampaignLinkedPost | null;
};

export default function SocialMediaPostPreviewDialog({ open, onOpenChange, platform, post }: Props) {
  const t = useTranslations("CampaignDialogs");
  const { name } = useProjectContext();
  if (!post) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            <span dir="auto">{post.title}</span>
          </DialogTitle>
          <DialogDescription>{t("postPreview.description")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <PlatformBadge platform={platform} />
            {post.status === "DRAFT" ? <MarketingStatus kind="post" value="DRAFT" size="sm" /> : null}
          </div>
          <article className="flex flex-col gap-3 rounded-card border border-line bg-raised p-4">
            <div className="flex items-center gap-2">
              <Avatar name={name ?? "?"} size="sm" decorative />
              <span dir="auto" className="text-body font-semibold text-fg">
                {name}
              </span>
            </div>
            <p dir="auto" className="whitespace-pre-wrap text-body text-fg">
              {post.content?.trim() || post.title}
            </p>
            {!post.content ? <p className="text-caption text-fg-muted">{t("postPreview.titleOnly")}</p> : null}
          </article>
        </DialogBody>
        <DialogFooter>
          <ButtonLink href={`/posts/${post.postId}`} variant="ghost">
            {t("postPreview.openPost")}
          </ButtonLink>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
