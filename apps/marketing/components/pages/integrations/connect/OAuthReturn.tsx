"use client";

// Where the provider sends the person back (MKT-067: the callback route rendered the word "page").
//
// - The code and state leave the address bar at once (MKT-060): they are read, then the history
//   entry is replaced, so Back or a reload never replays them.
// - The state must be the one this tab kept before leaving, for this platform and project. Anything
//   else is refused without calling the API (MKT-018). The kept state is spent on the first try.
// - The code is exchanged once. Then the wizard's step 2 opens on the server's connect session (its
//   temp data id in the address), in the language the connect started in.
// - On a failure, "Start again" begins a new connect; it never resends the used code (MKT-020).
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button, ErrorState, NoPermissionState, Spinner } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { integrationsApi } from "@/redux/features/integrations/integrationsApi";
import { useAppDispatch } from "@/redux/app/hooks";
import { useGetActiveProjectQuery } from "@/redux/features/projects/projectApi";
import type { IIntegrationCallbackResponse } from "@/types/integrations";
import { saveSession, selectionsFrom, takePending } from "./connect-session";
import { useStartConnect } from "./useStartConnect";

type Failure = "denied" | "mismatch" | "expired" | "otherProject" | "exchange" | "noProject";
type Outcome = { ok: true; tempDataId: string; locale: string } | { ok: false; reason: Failure };

type Params = { code: string | null; state: string | null; oauthToken: string | null; oauthVerifier: string | null; error: string | null };

// One exchange per state, shared by React's double effects in development and any re-render.
const inflight = new Map<string, Promise<Outcome>>();

export function OAuthReturn({ platform }: { platform: string }) {
  const t = useTranslations("ConnectWizard");
  const can = useMarketingRoles();
  const search = useSearchParams();
  const router = useRouter();
  const project = useProjectContext();
  const active = useGetActiveProjectQuery();
  const dispatch = useAppDispatch();
  // Not a lazy query hook: cleaning the address re-renders the wizard, and a hook's request is
  // cancelled with its component, which spent the one-time code for nothing ("didn't confirm").
  // A request started from the store finishes whatever happens to this component.
  const exchange = useCallback(
    (args: Parameters<typeof integrationsApi.endpoints.integrationsCallback.initiate>[0]) =>
      dispatch(integrationsApi.endpoints.integrationsCallback.initiate(args, { subscribe: false, forceRefetch: true })),
    [dispatch],
  );
  const restart = useStartConnect(platform);
  const [failure, setFailure] = useState<Failure | null>(null);
  // Read once: the address is cleaned right after.
  const [params] = useState<Params>(() => ({
    code: search.get("code"),
    state: search.get("state"),
    oauthToken: search.get("oauth_token"),
    oauthVerifier: search.get("oauth_verifier"),
    error: search.get("error"),
  }));
  const name = platformMeta(platform).name;
  const P = platform.toUpperCase();

  useEffect(() => {
    // Keep the path, drop the code and state from the address and from history.
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!can.manageIntegrations || !project.id) return;
    const key = params.state ?? `none:${params.error ?? ""}`;
    let run = inflight.get(key);
    if (!run) {
      run = (async (): Promise<Outcome> => {
        if (params.error) {
          takePending(params.state, P);
          return { ok: false, reason: "denied" };
        }
        const check = takePending(params.state, P);
        if (!check.ok) return { ok: false, reason: check.reason === "expired" ? "expired" : "mismatch" };
        if (check.pending.projectId !== project.id) return { ok: false, reason: "otherProject" };
        if (!params.code && !params.oauthVerifier) return { ok: false, reason: "mismatch" };
        try {
          const res = await exchange({
            platform: P,
            state: params.state ?? undefined,
            code: params.code ?? undefined,
            oauth_token: params.oauthToken ?? undefined,
            oauth_verifier: params.oauthVerifier ?? undefined,
          }).unwrap();
          const data = res.data as IIntegrationCallbackResponse;
          if (!data?.tempDataId) return { ok: false, reason: "exchange" };
          saveSession({ tempDataId: data.tempDataId, platform: P, projectId: project.id as string, data, selections: selectionsFrom(data), review: null });
          return { ok: true, tempDataId: data.tempDataId, locale: check.pending.locale };
        } catch {
          return { ok: false, reason: "exchange" };
        }
      })();
      inflight.set(key, run);
    }
    let live = true;
    run.then((o) => {
      if (!live) return;
      if (o.ok) router.replace(`/integrations/wizard/${P}/2?session=${encodeURIComponent(o.tempDataId)}`, { locale: o.locale });
      else setFailure(o.reason);
    });
    return () => {
      live = false;
    };
  }, [can.manageIntegrations, project.id, params, P, exchange, router]);

  if (!can.manageIntegrations) return <NoPermissionState title={t("noPermission")} description={t("noPermissionBody")} />;

  const shown: Failure | null = failure ?? (active.isError && !project.id ? "noProject" : null);

  if (!shown)
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center" aria-busy="true">
        <Spinner size="lg" />
        <p role="status" className="text-body text-fg-muted">
          {t("finishingSignIn", { platform: name })}
        </p>
      </div>
    );

  const copy: Record<Failure, { title: string; body: string }> = {
    denied: { title: t("deniedTitle", { platform: name }), body: t("deniedBody", { platform: name }) },
    mismatch: { title: t("mismatchTitle"), body: t("mismatchBody", { platform: name }) },
    expired: { title: t("expiredTitle"), body: t("expiredBody", { platform: name }) },
    otherProject: { title: t("otherProjectTitle"), body: t("otherProjectBody") },
    exchange: { title: t("exchangeTitle", { platform: name }), body: t("exchangeBody", { platform: name }) },
    noProject: { title: t("noProjectTitle"), body: t("noProjectBody") },
  };

  return (
    <ErrorState
      title={copy[shown].title}
      description={copy[shown].body}
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ButtonLink href="/integrations" variant="secondary">
            {t("backToAccounts")}
          </ButtonLink>
          <Button variant="primary" startIcon={<ArrowCounterClockwise />} loading={restart.busy} onClick={restart.start}>
            {t("startAgain")}
          </Button>
        </div>
      }
    />
  );
}
