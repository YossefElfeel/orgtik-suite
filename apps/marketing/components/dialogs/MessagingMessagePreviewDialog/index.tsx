"use client";

// A message as its channel shows it: an email with its sender and subject, or a text bubble for
// SMS and WhatsApp. {{variables}} stay as written; they are filled per recipient when it is sent.
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import type { MessagingChannel, MessagingTemplatePreview } from "@/lib/campaigns/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: MessagingChannel;
  sender: string;
  preview: MessagingTemplatePreview;
  recipient?: string;
};

export default function MessagingMessagePreviewDialog({ open, onOpenChange, channel, sender, preview, recipient }: Props) {
  const t = useTranslations("CampaignDialogs");
  const labels = useCampaignLabels();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("messagePreview.title")}</DialogTitle>
          <DialogDescription>
            <span dir="auto">{preview.name}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {channel === "EMAIL" ? (
            <article className="flex flex-col gap-3 rounded-card border border-line bg-raised p-4">
              <p className="text-body-sm text-fg-muted">
                {t("messagePreview.from", { sender: isolate(sender) })}
                {recipient ? (
                  <>
                    {" · "}
                    {t("messagePreview.to", { recipient: isolate(recipient) })}
                  </>
                ) : null}
              </p>
              {preview.subject ? (
                <h3 dir="auto" className="text-title-sm text-fg">
                  {preview.subject}
                </h3>
              ) : null}
              <p dir="auto" className="whitespace-pre-wrap text-body text-fg">
                {preview.body}
              </p>
            </article>
          ) : (
            <div className="flex flex-col gap-3 rounded-card border border-line bg-sunken p-4">
              <p className="text-center text-caption text-fg-muted">{t("messagePreview.chatFrom", { channel: labels.label("channel", channel), sender: isolate(sender) })}</p>
              <p dir="auto" className="max-w-xs self-start whitespace-pre-wrap rounded-card rounded-es-field bg-raised p-3 text-body text-fg">
                {preview.body}
              </p>
            </div>
          )}
          <p className="text-caption text-fg-muted">{t("messagePreview.variables")}</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
