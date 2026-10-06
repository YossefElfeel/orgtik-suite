"use client";

// Starts (or restarts) connecting a platform: asks the API for the provider's address, keeps the
// single-use state it carries, and leaves for the provider. "Try again" after a failed return calls
// this too, so it begins a new connect instead of resending a code that was already used (MKT-020).
import { useState } from "react";
import { useLocale } from "next-intl";
import { useConnectIntegrationMutation } from "@/redux/features/integrations/integrationsApi";
import { useProjectContext } from "@/lib/project-context";
import type { IntegrationPlatform } from "@/types/integrations";
import { isSafeAuthUrl, savePending } from "./connect-session";

export type StartError = "failed" | "unsafe" | "noProject";

export function useStartConnect(platform: string) {
  const locale = useLocale();
  const project = useProjectContext();
  const [connect] = useConnectIntegrationMutation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StartError | null>(null);

  const start = async () => {
    setError(null);
    if (!project.id) {
      setError("noProject");
      return;
    }
    setBusy(true);
    try {
      const res = await connect({ platform: platform.toUpperCase() as IntegrationPlatform }).unwrap();
      const authUrl = res?.data?.authUrl;
      // The provider's address must be a web address, and it must carry a state to check on return.
      if (!isSafeAuthUrl(authUrl)) {
        setError("unsafe");
        setBusy(false);
        return;
      }
      const state = res.data.state ?? new URL(authUrl, window.location.href).searchParams.get("state");
      if (!state) {
        setError("unsafe");
        setBusy(false);
        return;
      }
      savePending({ state, platform: platform.toUpperCase(), projectId: project.id, locale });
      window.location.assign(authUrl);
      // Stays busy while the browser leaves.
    } catch {
      // baseApi's toast says why.
      setError("failed");
      setBusy(false);
    }
  };

  return { start, busy, error };
}
