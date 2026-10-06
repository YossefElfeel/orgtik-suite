"use client";

// A post's status in words and an icon. The list's SYNCED (a post imported from the platform) isn't
// one of the shared post states, so it gets its own badge here.
import { useTranslations } from "next-intl";
import { DownloadSimple } from "@phosphor-icons/react";
import { Badge } from "@orgtik/ui";
import { MarketingStatus } from "@/components/shared/MarketingStatus";

export function PostStatusBadge({ value, size = "sm" }: { value: string | null | undefined; size?: "sm" | "md" }) {
  const t = useTranslations("PostShared");
  if (String(value).toUpperCase() === "SYNCED") {
    return (
      <Badge tone="success" icon={<DownloadSimple />} size={size}>
        {t("imported")}
      </Badge>
    );
  }
  return <MarketingStatus kind="post" value={value} size={size} />;
}
