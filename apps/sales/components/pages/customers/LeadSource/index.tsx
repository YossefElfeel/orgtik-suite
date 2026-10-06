"use client";

// Where a lead came from. A website lead names the page and the bundle it asked about (D-028), so
// the salesperson knows what to talk about before the first call.
import { useTranslations } from "next-intl";
import { Globe, HandPointing, Megaphone, PencilSimple, Storefront, UploadSimple, UsersThree } from "@phosphor-icons/react";
import { Badge } from "@orgtik/ui";
import type { Customer } from "@/types/customers";
import { isolate } from "@/lib/bidi";
import { KNOWN_SOURCES, sourceOf } from "../leads";

const ICONS: Record<string, typeof Globe> = {
  website: Globe,
  manual: PencilSimple,
  referral: UsersThree,
  partner: Storefront,
  event: Megaphone,
  import: UploadSimple,
};

/** The source's name in the reader's language; an unknown source shows as the API wrote it. */
export function useSourceLabel() {
  const t = useTranslations("Customers.source");
  return (source: string) => ((KNOWN_SOURCES as readonly string[]).includes(source) ? t(source) : source);
}

type Props = {
  lead: Pick<Customer, "source" | "sourceContext">;
  /** Adds the page and the bundle under the badge. */
  withContext?: boolean;
};

export default function LeadSource({ lead, withContext = false }: Props) {
  const t = useTranslations("Customers.source");
  const label = useSourceLabel();
  const source = sourceOf(lead);
  const Icon = ICONS[source] ?? HandPointing;
  const ctx = lead.sourceContext;
  const campaign = ctx?.utm?.utm_campaign ?? ctx?.utm?.campaign;
  return (
    <span className="flex min-w-0 flex-col items-start gap-1">
      <Badge tone={source === "website" ? "brand" : "neutral"} size="sm" icon={<Icon weight="bold" />}>
        {label(source)}
      </Badge>
      {withContext && ctx && (ctx.page || ctx.bundle || campaign) ? (
        <span className="flex max-w-full flex-col text-caption text-fg-muted">
          {ctx.page ? <span className="truncate">{t("pageValue", { page: isolate(ctx.page) })}</span> : null}
          {ctx.bundle ? <span className="truncate">{t("bundleValue", { bundle: isolate(ctx.bundle) })}</span> : null}
          {campaign ? <span className="truncate">{t("campaignValue", { campaign: isolate(campaign) })}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
