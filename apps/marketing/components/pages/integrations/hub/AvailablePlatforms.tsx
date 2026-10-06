"use client";

// The platforms a project can connect. Connect is a real link to the wizard (it was a button that
// pushed a path without the language, and the rows looked clickable but weren't, MKT-070).
import { useTranslations } from "next-intl";
import { buttonVariants, ListStates } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { useGetAllIntegrationsQuery, useGetIntegrationsAvailableQuery } from "@/redux/features/integrations/integrationsApi";
import type { IIntegrationListItem, IIntegrationsAvailable } from "@/types/integrations";
import { isConnectable } from "../shared";

export function AvailablePlatforms() {
  const t = useTranslations("Integrations");
  const { data, isLoading, isError, refetch } = useGetIntegrationsAvailableQuery();
  const accounts = useGetAllIntegrationsQuery({});
  const connected: IIntegrationListItem[] = Array.isArray(accounts.data?.data) ? accounts.data.data : [];
  const platforms = (data?.data ?? []).filter((p: IIntegrationsAvailable) => isConnectable(p.platform));
  const status = isLoading ? "loading" : isError ? "error" : platforms.length ? "ready" : "empty";

  return (
    <ListStates status={status} onRetry={refetch} empty={{ title: t("noPlatforms") }} error={{ title: t("platformsError") }} loadingRows={4}>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label={t("platformsLabel")}>
        {platforms.map((p: IIntegrationsAvailable) => {
          const name = platformMeta(p.platform).name;
          const n = connected.filter((c) => c.platform === p.platform).length;
          return (
            <li key={p.platform} className="flex items-center justify-between gap-3 rounded-card border border-line bg-raised p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-field bg-sunken">
                  <PlatformIcon platform={p.platform} className="size-6" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <bdi className="truncate font-semibold text-body text-fg">{name}</bdi>
                  <span className="text-body-sm text-fg-muted">{n ? t("connectedCount", { count: n }) : t("notConnected")}</span>
                </div>
              </div>
              <Link
                href={`/integrations/wizard/${p.platform}/1`}
                className={buttonVariants({ variant: n ? "secondary" : "primary", size: "sm" })}
                aria-label={t(n ? "connectAnotherPlatform" : "connectPlatform", { platform: name })}
              >
                {n ? t("connectAnother") : t("connect")}
              </Link>
            </li>
          );
        })}
      </ul>
    </ListStates>
  );
}
