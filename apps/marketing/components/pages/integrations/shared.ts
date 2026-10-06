"use client";

// Small helpers the hub, the detail page and the wizard share.
import { useTranslations } from "next-intl";
import { platformMeta } from "@/components/shared/PlatformBadge";
import type { IIntegrationListItem } from "@/types/integrations";

export { CONNECTABLE, isConnectable } from "./platforms";

type Status = Pick<IIntegrationListItem, "isConnected" | "requiresReconnect">;

/** The status to show (MarketingStatus kind="integration"): reconnect wins over on/off. */
export const integrationState = (i: Status) => (i.requiresReconnect ? "NEEDS_RECONNECT" : i.isConnected ? "CONNECTED" : "DISABLED");

/** The connected page or profile's name, falling back to the platform's. */
export const accountName = (i: Pick<IIntegrationListItem, "metadata" | "platform" | "name">) =>
  i.metadata?.name || i.metadata?.pageName || i.name || platformMeta(i.platform).name;

/** What a capability (a resource group) is called. */
export function useCapabilityLabel() {
  const t = useTranslations("Integrations.capability");
  return (capability: string | null | undefined) => {
    const key = String(capability ?? "").toUpperCase();
    return t.has(key) ? t(key) : t("OTHER");
  };
}
