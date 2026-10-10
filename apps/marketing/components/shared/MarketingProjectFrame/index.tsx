"use client";
import { usePathname } from "@/i18n/routing";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  NoPermissionState,
  PageHeader,
} from "@orgtik/ui";
import { useMarketingBootstrapQuery } from "@/redux/features/marketing-v3/marketingApi";
import { marketingErrorStatus } from "@/lib/marketing-v3";
import { ProjectFormDialog } from "@/components/pages/project/ProjectFormDialog";
import { useMarketingRoles } from "@/lib/permissions";
export default function MarketingProjectFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const t = useTranslations("MarketingV3"),
    nested = usePathname().startsWith("/settings"),
    query = useMarketingBootstrapQuery(),
    can = useMarketingRoles();
  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.isError)
    return marketingErrorStatus(query.error) === 403 ? (
      <NoPermissionState titleAs={nested ? "h2" : "h1"} title={t("noAccess")} />
    ) : (
      <ErrorState
        titleAs={nested ? "h2" : "h1"}
        title={t("loadError")}
        onRetry={() => void query.refetch()}
      />
    );
  if (!query.data?.project)
    return (
      <EmptyState
        titleAs={nested ? "h2" : "h1"}
        title={t("emptyProject")}
        action={
          can.manageProjects ? (
            <ProjectFormDialog
              trigger={<Button>{t("createProject")}</Button>}
              onCreated={() => void query.refetch()}
            />
          ) : undefined
        }
      />
    );
  return (
    <section className="flex min-w-0 flex-col gap-5">
      {nested ? (
        <h2 className="font-display text-title-sm">{title}</h2>
      ) : (
        <PageHeader title={title} />
      )}
      {children}
    </section>
  );
}
