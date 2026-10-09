"use client";

// The project's connected accounts. Each name is a link to the account's page (it was hidden two
// clicks deep in a popover, MKT-070). Turning an account off, and disconnecting it, ask first and
// stay open until the server answers (MKT-071); the old switch disconnected on one click. The
// pagination used to claim 30 rows whatever the count.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowsClockwise, DotsThree, Eye, LinkBreak, Pause, Play } from "@phosphor-icons/react";
import { Button, ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { PlatformBadge, PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { isolate } from "@/lib/bidi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import {
  useDeleteIntegrationMutation,
  useGetAllIntegrationsQuery,
  useSyncIntegrationMutation,
  useToggleIntegrationStatusMutation,
} from "@/redux/features/integrations/integrationsApi";
import type { IIntegrationListItem } from "@/types/integrations";
import { accountName, integrationState } from "../shared";

type Pending = { kind: "disconnect" | "turnOff"; row: IIntegrationListItem } | null;

const errorStatus = (e: unknown) => (e as { status?: number | string } | undefined)?.status;

export function ConnectedAccounts({ onAdd }: { onAdd?: () => void }) {
  const t = useTranslations("Integrations");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const can = useMarketingRoles();
  const { data, isLoading, isError, error, refetch } = useGetAllIntegrationsQuery({});
  const [toggle] = useToggleIntegrationStatusMutation();
  const [remove] = useDeleteIntegrationMutation();
  const [sync] = useSyncIntegrationMutation();
  // The row stays set while the dialog animates closed, so its words don't blank out.
  const [pending, setPendingRow] = useState<Pending>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const setPending = (p: Pending) => {
    if (p) setPendingRow(p);
    setConfirmOpen(Boolean(p));
  };
  const [syncing, setSyncing] = useState<string | null>(null);

  const rows: IIntegrationListItem[] = Array.isArray(data?.data) ? data.data : [];
  const status = isLoading ? "loading" : isError ? (errorStatus(error) === 403 ? "forbidden" : "error") : "ready";

  const runSync = async (id: string) => {
    setSyncing(id);
    try {
      await sync({ integrationId: id }).unwrap();
    } catch {
      // baseApi's toast says why.
    } finally {
      setSyncing(null);
    }
  };

  const columns: ColumnDef<IIntegrationListItem>[] = [
    {
      id: "account",
      header: t("colAccount"),
      meta: { truncate: true },
      cell: ({ row }) => {
        const i = row.original;
        return (
          <Link
            href={`/integrations/platform/${i.id}`}
            className="flex min-w-0 items-center gap-2 rounded-field font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            <PlatformIcon platform={i.platform} />
            <span dir="auto" className="truncate">
              {accountName(i)}
            </span>
            {i.metadata?.handle ? (
              <bdi dir="ltr" className="truncate text-body-sm font-normal text-fg-muted">
                @{i.metadata.handle}
              </bdi>
            ) : null}
          </Link>
        );
      },
    },
    { id: "platform", header: t("colPlatform"), cell: ({ row }) => <PlatformBadge platform={row.original.platform} /> },
    { id: "status", header: t("colStatus"), cell: ({ row }) => <MarketingStatus kind="integration" value={integrationState(row.original)} size="sm" /> },
    {
      id: "synced",
      header: t("colSynced"),
      cell: ({ row }) =>
        row.original.lastSyncedAt ? (
          <span className="text-body-sm text-fg-muted">{f.date(row.original.lastSyncedAt, { dateStyle: "medium", timeStyle: "short", timeZone })}</span>
        ) : (
          <span className="text-body-sm text-fg-subtle">{t("neverSynced")}</span>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("colActions")}</span>,
      meta: { width: "1%" },
      cell: ({ row }) => {
        const i = row.original;
        const name = accountName(i);
        return (
          <Menu>
            <MenuTrigger
              render={<IconButton variant="ghost" size="sm" label={t("rowActions", { name: isolate(name) })} icon={<DotsThree weight="bold" />} />}
            />
            <MenuContent align="end">
              <MenuLinkItem icon={<Eye />} render={<Link href={`/integrations/platform/${i.id}`} />}>
                {t("viewDetails")}
              </MenuLinkItem>
              {can.syncIntegrations ? (
                <MenuItem icon={<ArrowsClockwise />} disabled={syncing === i.id} onClick={() => runSync(i.id)}>
                  {t("syncNow")}
                </MenuItem>
              ) : null}
              {can.manageIntegrations ? (
                <>
                  {i.isConnected ? (
                    <MenuItem icon={<Pause />} onClick={() => setPending({ kind: "turnOff", row: i })}>
                      {t("turnOff")}
                    </MenuItem>
                  ) : (
                    <MenuItem icon={<Play />} onClick={() => toggle({ integrationId: i.id }).unwrap().catch(() => undefined)}>
                      {t("turnOn")}
                    </MenuItem>
                  )}
                  <MenuSeparator />
                  <MenuItem tone="danger" icon={<LinkBreak />} onClick={() => setPending({ kind: "disconnect", row: i })}>
                    {t("disconnect")}
                  </MenuItem>
                </>
              ) : null}
            </MenuContent>
          </Menu>
        );
      },
    },
  ];

  const target = pending?.row;
  const targetName = target ? isolate(accountName(target)) : "";
  const platformName = target ? platformMeta(target.platform).name : "";

  return (
    <>
      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        status={status}
        onRetry={refetch}
        paginate
        empty={{
          title: t("emptyTitle"),
          description: can.manageIntegrations ? t("emptyBody") : t("emptyBodyReadOnly"),
          action: onAdd ? (
            <Button variant="primary" onClick={onAdd}>
              {t("connectFirst")}
            </Button>
          ) : undefined,
        }}
        error={{ title: t("loadError") }}
        forbidden={{ title: t("forbidden") }}
      />

      <ConfirmDialog
        open={confirmOpen && pending?.kind === "disconnect"}
        onOpenChange={(o) => !o && setPending(null)}
        title={t("disconnectTitle", { name: targetName })}
        impact={t("disconnectImpact", { platform: platformName })}
        irreversible
        tone="danger"
        confirmLabel={t("disconnectConfirm")}
        cancelLabel={t("keepConnected")}
        onConfirm={async () => {
          if (target) await remove({ integrationId: target.id }).unwrap();
        }}
      />
      <ConfirmDialog
        open={confirmOpen && pending?.kind === "turnOff"}
        onOpenChange={(o) => !o && setPending(null)}
        title={t("turnOffTitle", { name: targetName })}
        impact={t("turnOffImpact", { platform: platformName })}
        tone="primary"
        confirmLabel={t("turnOffConfirm")}
        cancelLabel={t("keepOn")}
        onConfirm={async () => {
          if (target) await toggle({ integrationId: target.id }).unwrap();
        }}
      />
    </>
  );
}
