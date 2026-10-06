"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ErrorState, LoadingState, PageHeader, useFormatter } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { NotFound, useLocaleHref, useLocalized, useToolName, ViewOnlyNote } from "@/components/catalog/bits";
import { PlanStatusBadge } from "@/components/catalog/PlanBits";
import { PlanForm } from "@/components/catalog/PlanForm";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { usePlanQuery } from "@/store/catalog";

// ADM-07: one plan, edited in place. Its prices are in the price grid (linked from the form).
function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("Catalog.planForm");
  const tp = useTranslations("Catalog.plans");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const name = useLocalized();
  const toolName = useToolName();
  const href = useLocaleHref();
  const { data: plan, isLoading, error, refetch } = usePlanQuery(id);

  if (statusOf(error) === 404) return <NotFound title={t("notFound")} body={t("notFoundBody", { id })} back={t("back")} backHref="/plans" />;
  if (error) return <ErrorState title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;
  if (isLoading || !plan) return <LoadingState rows={8} label={tc("loading")} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={name(plan.name)}
        description={t("editDescription", { tool: toolName(plan.tool), count: plan.subscribers ?? 0, subscribers: f.number(plan.subscribers ?? 0) })}
        breadcrumb={[{ label: tp("title"), href: href("/plans") }, { label: toolName(plan.tool), href: href(`/plans?tool=${plan.tool}`) }, { label: name(plan.name) }]}
        status={<PlanStatusBadge status={plan.status} />}
      />
      <p className="-mt-3 text-caption text-fg-subtle">
        <code dir="ltr" className="font-mono">{plan.id}</code>
      </p>
      {!can("plans:edit") ? <ViewOnlyNote /> : null}
      <PlanForm key={plan.id} plan={plan} />
    </div>
  );
}

export default function PlanDetailPage() {
  return (
    <RequirePermission permission="plans:view">
      <PlanPage />
    </RequirePermission>
  );
}
