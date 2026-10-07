"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ErrorState, LoadingState, NoPermissionState, buttonVariants } from "@orgtik/ui";
import { profileFor, SessionRequestError } from "@orgtik/ui/auth";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { API_URL } from "@/constants/env";
import useUser from "@/hooks/use-user";
import { useMounted } from "@/hooks/use-mounted";
import { useAppDispatch } from "@/redux/app/hooks";
import { switchSession } from "@/redux/features/auth/authThunks";
import { useWorkspaceInvitationQuery, useAcceptWorkspaceInvitationMutation, type InvitationAcceptance } from "@/redux/features/platform/invitations";
import type { PlatformError } from "@/redux/features/platform/platformApi";
import type { IUser } from "@/types/user";
import { InvitationAccountForm, type InvitationAccount } from "./InvitationAccountForm";
import { InvitationSummary } from "./InvitationSummary";

export function WorkspaceInvitation({ token }: { token: string }) {
  const t = useTranslations("WorkspaceInvite"), router = useRouter(), dispatch = useAppDispatch(), mounted = useMounted();
  const { user, accessToken, workspaceContext } = useUser();
  const valid = /^[A-Za-z0-9_-]{16,100}$/.test(token);
  const metadata = useWorkspaceInvitationQuery(token, { skip: !valid || !mounted, refetchOnMountOrArgChange: true });
  const [accept, { isLoading: accepting }] = useAcceptWorkspaceInvitationMutation();
  const [accepted, setAccepted] = useState<InvitationAcceptance | null>(null), [problem, setProblem] = useState<string | null>(null), [opening, setOpening] = useState(false);
  const operation = useRef<string | null>(null), busy = useRef(false);
  const invitation = metadata.data;
  const matching = mounted && !!user?.email && user.email.toLowerCase() === invitation?.email.toLowerCase();
  const signIn = `/auth/login?switch=1&redirect=${encodeURIComponent(`/invite/${encodeURIComponent(token)}`)}`;
  const home = <Link href="/" className={buttonVariants({ variant: "secondary" })}>{t("home")}</Link>;
  async function submit(values?: InvitationAccount, openAfter = false) {
    if (busy.current) return;
    busy.current = true; setProblem(null);
    operation.current ||= crypto.randomUUID();
    try {
      const result = await accept({ token, operationId: operation.current, ...(values || {}), ...(matching && invitation?.requiresSignIn && accessToken ? { accessToken } : {}) }).unwrap();
      setAccepted(result);
      if (openAfter) await open(result);
    } catch (error) {
      const failure = error as PlatformError;
      if ([401, 403].includes(Number(failure.status))) { setProblem("signInRequired"); void metadata.refetch(); }
      else if (Number(failure.status) === 423) setProblem("readOnly");
      else if ([404, 410].includes(Number(failure.status))) { setProblem("unavailable"); void metadata.refetch(); }
      else setProblem("acceptFailed");
    } finally { busy.current = false; }
  }
  async function open(result = accepted) {
    if (!result || opening) return;
    setOpening(true); setProblem(null);
    try {
      const session = await profileFor<IUser>(API_URL, result.tokens);
      if (session.workspaceContext?.workspace.id !== result.workspaceId || Number(session.user.id) !== result.userId) throw new SessionRequestError(503, "invitation_context_mismatch");
      dispatch(switchSession({ ...session, scopes: session.scopes.map(scope => ({ ...scope, permissions: scope.permissions || [] })) }));
      router.replace("/");
    } catch (error) {
      const needsSignIn = error instanceof SessionRequestError && [401, 403].includes(error.status);
      setProblem(needsSignIn ? "signInRequired" : "openFailed");
      if (needsSignIn) void metadata.refetch();
    }
    finally { setOpening(false); }
  }
  if (!valid) return <ErrorState titleAs="h1" title={t("invalidTitle")} description={t("invalidBody")} action={home} />;
  if (!mounted || metadata.isLoading) return <LoadingState rows={3} />;
  if (!invitation) return <ErrorState titleAs="h1" title={t(metadata.error && [404, 410].includes(Number((metadata.error as PlatformError).status)) ? "invalidTitle" : "loadFailedTitle")} description={t(metadata.error && [404, 410].includes(Number((metadata.error as PlatformError).status)) ? "invalidBody" : "loadFailedBody")} onRetry={() => void metadata.refetch()} action={metadata.error && [404, 410].includes(Number((metadata.error as PlatformError).status)) ? home : undefined} />;
  if (invitation.recipientState === "inactive") return <NoPermissionState titleAs="h1" title={t("inactiveTitle")} description={t("inactiveBody")} action={home} />;
  if (workspaceContext?.actor.readOnly) return <NoPermissionState titleAs="h1" title={t("readOnlyTitle")} description={t("readOnly")} action={home} />;
  if (!accepted && ["expired", "cancelled"].includes(invitation.status)) return <ErrorState titleAs="h1" title={t(`${invitation.status}Title`)} description={t(`${invitation.status}Body`)} action={home} />;
  const ready = accepted || invitation.status === "accepted";
  const mustSignIn = !matching && invitation.requiresSignIn || problem === "signInRequired";
  const canOpen = problem !== "signInRequired" && !!(matching || accepted);
  return <AuthPanel title={t(ready ? "readyTitle" : "title", { workspace: invitation.workspace.name })} subtitle={t(ready ? "readyBody" : "body", { workspace: invitation.workspace.name })} error={problem ? t(problem) : undefined}>
    <InvitationSummary invitation={accepted ? { ...invitation, status: "accepted" } : invitation} />
    {ready ? <div className="flex flex-col gap-3"><Button size="lg" loading={opening || accepting} disabled={opening || accepting} onClick={() => !canOpen ? router.push(signIn) : accepted ? void open() : void submit(undefined, true)}>{t(canOpen ? "open" : "signIn")}</Button>{home}</div>
      : mustSignIn ? <div className="flex flex-col gap-4"><p className="text-body-sm text-fg-muted">{t(user && !matching ? "wrongAccount" : "signInBody", { email: invitation.email })}</p><Link href={signIn} className={buttonVariants({ variant: "primary", size: "lg" })}>{t("signIn")}</Link>{home}</div>
      : invitation.requiresSignIn ? <div className="flex flex-col gap-4"><p className="text-body-sm text-fg-muted">{t("signedIn", { email: invitation.email })}</p><Button size="lg" loading={accepting} disabled={accepting} onClick={() => void submit()}>{t("accept")}</Button>{home}</div>
      : <div className="flex flex-col gap-4"><InvitationAccountForm creating={invitation.recipientState === "new"} busy={accepting} onAccept={submit} onChange={() => { operation.current = null; setProblem(null); }} />{problem === "acceptFailed" ? <p className="text-body-sm text-fg-muted">{t("lostResponseRecovery")} <Link href={signIn} className="font-semibold text-fg-brand underline underline-offset-4">{t("signIn")}</Link></p> : null}{home}</div>}
  </AuthPanel>;
}
