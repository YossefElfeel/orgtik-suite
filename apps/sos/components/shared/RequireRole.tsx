"use client";

// A page for some people only (FS-SOS-10, SOS-026). Before, only the navigation hid these pages:
// a direct link showed "New system", "Delete" and the Active switch to anyone. Now the page itself
// says it isn't for you, with the way home. The API still has the last word.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ErrorState, NoPermissionState, Spinner } from "@orgtik/ui";
import { profileFor, readClientSession, sessionRequest, SessionRequestError, type AuthEnvelope, type SessionTokens } from "@orgtik/ui/auth";
import useUser from "@/hooks/use-user";
import { useMounted } from "@/hooks/use-mounted";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useAppDispatch } from "@/redux/app/hooks";
import { switchSession } from "@/redux/features/auth/authThunks";
import { API_URL } from "@/constants/env";
import { staffSessionAllowed } from "@/lib/staff-entry";
import type { IUser } from "@/types/user";

export function RequireRole({ role, permission, children }: { role: "admin" | "websiteManager"; permission?: string; children: ReactNode }) {
  const t = useTranslations("Errors");
  const feedback = useTranslations("Feedback");
  const mounted = useMounted();
  const dispatch = useAppDispatch();
  const { user, isAdmin, isWebsiteManager, accessToken, workspaceContext, staffAccess } = useUser();
  const adminGrant = staffAccess?.apps.includes("admin") === true;
  const hasPermission = !permission || staffAccess?.permissions.admin?.includes(permission) === true;
  const allowed = (role === "admin" ? isAdmin : isWebsiteManager || isAdmin) && hasPermission;
  const target = role === "admin" || adminGrant ? "admin" : "wm";
  const canPrepare = !allowed && hasPermission && !!accessToken && !workspaceContext?.actor.readOnly &&
    (target === "admin" ? !!adminGrant : staffAccess?.apps.includes("wm") === true);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ key: string; error: SessionRequestError } | null>(null);
  const prepared = useRef<{ key: string; tokens: Promise<SessionTokens>; attempt?: number; profile?: Promise<AuthEnvelope<IUser>> } | null>(null);
  const key = `${accessToken || ""}:${target}`;

  useEffect(() => {
    if (!mounted || !user || !canPrepare || !accessToken) return;
    const sourceToken = accessToken;
    if (!prepared.current || prepared.current.key !== key) {
      const pending = { key, tokens: sessionRequest<{ tokens: SessionTokens }>(API_URL, "/auth/workspace", sourceToken, { mode: "staff", target }).then(value => value.tokens) };
      pending.tokens = pending.tokens.catch(error => { if (prepared.current === pending) prepared.current = null; throw error; });
      prepared.current = pending;
    }
    const pending = prepared.current;
    // Retain the new family across a profile outage rather than minting another.
    if (pending.attempt !== attempt) {
      pending.attempt = attempt;
      pending.profile = pending.tokens.then(tokens => profileFor<IUser>(API_URL, tokens));
    }
    let live = true;
    setFailure(null);
    pending.profile!.then(session => {
      if (!live || readClientSession()?.tokens.accessToken !== sourceToken) return;
      if (session.user.id !== user.id || !staffSessionAllowed(session, target, permission)) throw new SessionRequestError(403, "staff_access_denied");
      dispatch(switchSession({ ...session, scopes: session.scopes.map(scope => ({ ...scope, permissions: scope.permissions || [] })) }));
    }).catch(error => {
      if (live && readClientSession()?.tokens.accessToken === sourceToken) setFailure({ key, error: error instanceof SessionRequestError ? error : new SessionRequestError(503, "session_unavailable") });
    });
    return () => { live = false; };
  }, [mounted, user, canPrepare, accessToken, key, target, permission, attempt, dispatch]);

  const problem = failure?.key === key ? failure.error : null;
  if (canPrepare && problem && ![401, 403].includes(problem.status)) {
    return <ErrorState titleAs="h1" title={feedback("offline")} onRetry={() => setAttempt(value => value + 1)} />;
  }
  if (!mounted || !user || canPrepare && !problem) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (!allowed) {
    return <NoPermissionState titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} action={<ButtonLink href="/">{t("toHome")}</ButtonLink>} />;
  }
  return <>{children}</>;
}
