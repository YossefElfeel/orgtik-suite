import type { IInsightsIntegration } from "@/types/reports";

/** The account's name as people know it (the page or profile name). */
export const profileName = (p: IInsightsIntegration) => p.metadata?.pageName || p.metadata?.name || p.name;

/** The account's state for MarketingStatus kind="integration". */
export const integrationState = (p: IInsightsIntegration) => (p.requiresReconnect ? "NEEDS_RECONNECT" : p.isConnected ? "CONNECTED" : p.status || "DISCONNECTED");
