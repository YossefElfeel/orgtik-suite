"use client";

// Opening a suite app (FS-SOS-2): every launcher link points here, a real address that works with
// a middle click or "open in new tab", and carries no token. This page asks for the hand-off and
// replaces itself with the app, so Back returns to where you were. If the app is turned off or
// not yours, or the hand-off fails, it says so with a way home.
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowClockwise } from "@phosphor-icons/react";
import { Button, ErrorState, NoPermissionState, Spinner } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useAppLabel, useMyScopes } from "@/components/suite/useSuiteApps";
import { handoffHref } from "@/lib/handoff";
import useUser from "@/hooks/use-user";
import { useMounted } from "@/hooks/use-mounted";
import { switchWorkspace } from "@orgtik/ui/auth";
import { API_URL } from "@/constants/env";

export default function OpenAppPage() {
  const t = useTranslations("Open");
  const scope = String(useParams().scope ?? "");
  // Where to land in the app (its own path only, e.g. /hq/chat/c-design): passed on with the code.
  const query = useSearchParams();
  const requestedWorkspace = query.get("workspaceId");
  const landing = (query.get("redirect") ?? "").replace(/[\t\n\r]/g, "");
  const path = landing.startsWith("/") && !landing.startsWith("//") && !landing.startsWith("/\\") ? landing : "";
  const locale = useLocale();
  const mounted = useMounted();
  const appLabel = useAppLabel();
  const { accessToken, workspaceContext } = useUser();
  const [problem, setProblem] = useState<"notYours" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${accessToken ?? ""}:${requestedWorkspace ?? ""}:${attempt}`;
  const [launch, setLaunch] = useState<{ key: string; token: string } | null>(null);
  const launchToken = launch?.key === requestKey ? launch.token : null;
  const { scopes, failed } = useMyScopes(mounted ? launchToken : null, attempt);
  const app = scopes?.find((s) => s.name === scope);
  const name = app ? appLabel(app.name, app.displayName) : appLabel(scope, scope);

  useEffect(() => {
    if (!accessToken) return;
    let live = true;
    setProblem(null);
    if (requestedWorkspace && requestedWorkspace !== workspaceContext?.workspace.id) {
      switchWorkspace(API_URL, accessToken, requestedWorkspace).then(session => live && setLaunch({ key: requestKey, token: session.tokens.accessToken })).catch(() => live && setProblem("failed"));
    } else setLaunch({ key: requestKey, token: accessToken });
    return () => { live = false; };
  }, [accessToken, requestedWorkspace, workspaceContext?.workspace.id, requestKey]);

  useEffect(() => {
    if (!launchToken || scopes === null) return;
    if (!app) return setProblem("notYours");
    setProblem(null);
    handoffHref(app.domain, launchToken, { scope: app.name, locale })
      .then((href) => window.location.replace(path ? `${href}&redirect=${encodeURIComponent(path)}` : href))
      .catch(() => setProblem("failed"));
  }, [launchToken, scopes, app, locale, attempt, path]);

  const home = <ButtonLink href="/">{t("home")}</ButtonLink>;
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      {problem === "notYours" ? (
        <NoPermissionState titleAs="h1" title={t("notYoursTitle", { name })} description={t("notYoursBody")} action={home} />
      ) : problem === "failed" || failed ? (
        <ErrorState
          titleAs="h1"
          title={t("failedTitle", { name })}
          description={t("failedBody")}
          action={
            <>
              <Button variant="primary" startIcon={<ArrowClockwise />} onClick={() => setAttempt((n) => n + 1)}>
                {t("retry")}
              </Button>
              {home}
            </>
          }
        />
      ) : (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
          <Spinner />
          <h1 className="font-display text-title-sm text-fg">{t("opening", { name })}</h1>
        </div>
      )}
    </main>
  );
}
