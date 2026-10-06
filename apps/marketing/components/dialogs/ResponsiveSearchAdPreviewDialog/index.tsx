"use client";

// How a responsive search ad may show on Google: its address, a few headlines and its
// descriptions, then every headline and description it was given. The ad's text is the
// advertiser's, in its own direction.
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";
import { displayUrl } from "@/lib/campaigns/google-search/onboarding";
import type { CampaignResponsiveSearchAd } from "@/lib/campaigns/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: CampaignResponsiveSearchAd | null;
};

export default function ResponsiveSearchAdPreviewDialog({ open, onOpenChange, ad }: Props) {
  const t = useTranslations("CampaignDialogs");
  if (!ad) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            <span dir="auto">{ad.name}</span>
          </DialogTitle>
          <DialogDescription>{t("rsaPreview.description")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 rounded-card border border-line bg-raised p-4" dir="auto">
            <p className="flex items-center gap-2 text-body-sm text-fg">
              <span className="rounded-field border border-line px-1 text-micro font-semibold">{t("rsaPreview.adBadge")}</span>
              <bdi dir="ltr" className="truncate">
                {displayUrl(ad)}
              </bdi>
            </p>
            <p className="text-title-sm text-fg-brand">{ad.headlines.slice(0, 3).join(" | ")}</p>
            <p className="text-body text-fg">{ad.descriptions.slice(0, 2).join(" ")}</p>
          </div>
          <section className="flex flex-col gap-2">
            <h3 className="text-label text-fg">{t("rsaPreview.headlines", { count: ad.headlines.length })}</h3>
            <ul className="flex flex-wrap gap-2">
              {ad.headlines.map((h, i) => (
                <li key={`${h}-${i}`} dir="auto" className="rounded-pill bg-sunken px-2.5 py-1 text-body-sm text-fg">
                  {h}
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-label text-fg">{t("rsaPreview.descriptions", { count: ad.descriptions.length })}</h3>
            <ul className="flex flex-col gap-1.5">
              {ad.descriptions.map((d, i) => (
                <li key={`${d}-${i}`} dir="auto" className="rounded-field bg-sunken px-3 py-2 text-body-sm text-fg">
                  {d}
                </li>
              ))}
            </ul>
          </section>
          <p className="flex flex-wrap items-center gap-2 text-body-sm text-fg-muted">
            {t("rsaPreview.finalUrl")}
            <bdi dir="ltr" className="break-all text-fg">
              {ad.finalUrl}
            </bdi>
          </p>
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
