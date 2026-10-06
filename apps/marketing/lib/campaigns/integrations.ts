// The brand's connected accounts as the wizard needs them: which account a Google campaign runs
// on, and which integration an ad set or a platform's posts go out through.

export type ConnectedAccount = { id: string; platform: string; name: string; isConnected: boolean };

export function extractIntegrations(response: unknown): ConnectedAccount[] {
  const data = (response as { data?: unknown } | undefined)?.data;
  const items = Array.isArray(data) ? data : Array.isArray((data as { items?: unknown[] } | undefined)?.items) ? (data as { items: unknown[] }).items : [];
  return items.flatMap((raw) => {
    const i = raw as { id?: string; platform?: string; name?: string; isConnected?: boolean; metadata?: { name?: string; email?: string } };
    if (!i?.id) return [];
    return [{ id: i.id, platform: String(i.platform ?? "").toUpperCase(), name: i.metadata?.name || i.name || i.metadata?.email || i.id, isConnected: i.isConnected !== false }];
  });
}

/** The currency of an integration's ad account (resources[].currency), when the API names it. */
export function adAccountCurrency(details: unknown): { currency: string | null; accountName: string | null } {
  const resources = (details as { data?: { accountResources?: { capability?: string; currency?: string | null; displayName?: string }[] } } | undefined)?.data?.accountResources ?? [];
  const ads = resources.find((r) => r.capability === "ADS");
  return { currency: ads?.currency || null, accountName: ads?.displayName || null };
}
