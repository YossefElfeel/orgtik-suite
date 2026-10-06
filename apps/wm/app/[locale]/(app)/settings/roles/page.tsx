"use client";

import { useTranslations } from "next-intl";
import { Badge, Card, ErrorState, LoadingState, PageHeader } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { useMeQuery, useRolesQuery } from "@/store/api";

function Roles() {
  const t = useTranslations("Team");
  const tr = useTranslations("Roles");
  const me = useMeQuery();
  const { data, isLoading, isError, refetch } = useRolesQuery();
  const mine = new Set(me.data?.roles.map((r) => r.key));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {isLoading ? <LoadingState rows={4} /> : isError ? <ErrorState onRetry={refetch} /> : (
        <ul aria-label={t("label")} className="flex flex-col gap-3">
          {data!.map((role) => (
            <li key={role.key}>
              <Card className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-title-sm text-fg">{tr.has(role.key) ? tr(role.key) : role.label}</h2>
                  <div className="flex items-center gap-2">
                    {mine.has(role.key) ? <Badge tone="brand" size="sm">{t("yours")}</Badge> : null}
                    <span className="text-caption text-fg-muted tabular-nums">{t("count", { count: role.permissions.length })}</span>
                  </div>
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label={t("permissions")}>
                  {role.permissions.map((p) => (
                    <li key={p}><code dir="ltr" className="rounded-pill bg-sunken px-2 py-0.5 font-mono text-caption text-fg-muted">{p}</code></li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RolesPage() {
  return (
    <RequirePermission permission="settings:view">
      <Roles />
    </RequirePermission>
  );
}
