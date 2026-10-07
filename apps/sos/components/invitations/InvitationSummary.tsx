"use client";
import { useTranslations } from "next-intl";
import { Badge, useFormatter } from "@orgtik/ui";
import type { InvitationMetadata } from "@/redux/features/platform/invitations";
const appScopes: Record<string, string> = { tasks: "task_manager", files: "file_manager", hr: "hr_system", crm: "sales", marketing: "digital_marketing", chat: "hq" };

export function InvitationSummary({ invitation }: { invitation: InvitationMetadata }) {
  const t = useTranslations("WorkspaceInvite"), suite = useTranslations("Suite"), format = useFormatter();
  return <div className="mb-6 flex flex-col gap-4 border-b border-line pb-6">
    <dl className="grid gap-3 text-body-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><dt className="text-fg-muted">{t("recipient")}</dt><dd><bdi dir="ltr" className="break-all font-semibold text-fg">{invitation.email}</bdi></dd></div>
      <div className="flex items-center justify-between gap-2"><dt className="text-fg-muted">{t("access")}</dt><dd><Badge tone="neutral">{t(`roles.${invitation.role}`)}</Badge></dd></div>
      {invitation.status === "pending" ? <div className="flex flex-wrap items-baseline justify-between gap-2"><dt className="text-fg-muted">{t("expires")}</dt><dd className="text-fg">{format.date(invitation.expiresAt, { dateStyle: "medium" })}</dd></div> : null}
    </dl>
    <div className="flex flex-col gap-2"><p className="text-body-sm font-semibold text-fg">{t("tools")}</p>{invitation.tools.length ? <ul className="flex flex-wrap gap-2">{invitation.tools.map(tool => <li key={tool}><Badge tone="neutral">{appScopes[tool] && suite.has(`apps.${appScopes[tool]}`) ? suite(`apps.${appScopes[tool]}`) : tool}</Badge></li>)}</ul> : <p className="text-body-sm text-fg-muted">{t("noTools")}</p>}</div>
  </div>;
}
