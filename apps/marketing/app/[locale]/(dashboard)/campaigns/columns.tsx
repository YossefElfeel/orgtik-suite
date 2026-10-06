"use client";

// The campaigns table's columns. The name is the link to the campaign; the row menu is a named
// Menu (Open, Continue setup or Edit, Delete). Statuses are words, not raw enums (MKT-058).
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowSquareOut, DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import { ConfirmDialog, Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger, useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { useDeleteCampaignMutation } from "@/redux/features/campaigns/campaignsApi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { wizardPath } from "@/lib/campaigns/routing";
import { isolate } from "@/lib/bidi";
import type { ICampaignListItem } from "@/types/campaigns";

function CampaignActions({ campaign }: { campaign: ICampaignListItem }) {
  const t = useTranslations("Campaigns");
  const { editCampaigns } = useMarketingRoles();
  const [remove] = useDeleteCampaignMutation();
  const [confirm, setConfirm] = useState(false);
  const name = isolate(campaign.name);
  return (
    <>
      <Menu>
        <MenuTrigger aria-label={t("actionsFor", { name })} className="grid size-8 place-items-center rounded-pill text-fg-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus">
          <DotsThreeVertical weight="bold" aria-hidden className="size-5" />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuLinkItem icon={<ArrowSquareOut />} render={<Link href={`/campaigns/${campaign.id}`} />}>
            {t("open")}
          </MenuLinkItem>
          {editCampaigns ? (
            <MenuLinkItem icon={<PencilSimple />} render={<Link href={wizardPath(campaign.type, campaign.isComplete ? "details" : "review", campaign.id)} />}>
              {campaign.isComplete ? t("edit") : t("continueSetup")}
            </MenuLinkItem>
          ) : null}
          {editCampaigns ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<Trash />} tone="danger" onClick={() => setConfirm(true)}>
                {t("delete")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
      {editCampaigns ? (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          tone="danger"
          irreversible
          title={t("deleteTitle", { name })}
          impact={["RUNNING", "READY"].includes(String(campaign.workflowState).toUpperCase()) ? t("deleteImpactLive") : t("deleteImpact")}
          confirmLabel={t("deleteConfirm")}
          cancelLabel={t("keep")}
          onConfirm={() => remove(campaign.id).unwrap()}
        />
      ) : null}
    </>
  );
}

export function useCampaignColumns(): ColumnDef<ICampaignListItem>[] {
  const t = useTranslations("Campaigns");
  const locale = useLocale();
  const f = useFormatter();
  const labels = useCampaignLabels();
  const { timeZone } = useProjectContext();
  return useMemo<ColumnDef<ICampaignListItem>[]>(() => {
    const d = (iso: string) => f.date(iso, { dateStyle: "medium", timeZone });
    return [
      {
        id: "name",
        header: t("colName"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <Link href={`/campaigns/${row.original.id}`} dir="auto" className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {row.original.name}
            </Link>
            <span className="text-caption text-fg-muted">{labels.type(row.original.type)}</span>
          </div>
        ),
      },
      {
        id: "schedule",
        header: t("colSchedule"),
        cell: ({ row }) => {
          const { startAt, endAt } = row.original;
          if (!startAt && !endAt) return <span className="text-fg-muted">{t("noSchedule")}</span>;
          return startAt && endAt ? t("range", { start: d(startAt), end: d(endAt) }) : startAt ? t("from", { start: d(startAt) }) : t("until", { end: d(endAt!) });
        },
      },
      { id: "status", header: t("colStatus"), cell: ({ row }) => <MarketingStatus kind="campaign" value={row.original.workflowState} size="sm" /> },
      { id: "approval", header: t("colApproval"), cell: ({ row }) => <MarketingStatus kind="approval" value={row.original.approvalStatus} size="sm" /> },
      { id: "updated", header: t("colUpdated"), meta: { numeric: true }, cell: ({ row }) => (row.original.updatedAt ? d(row.original.updatedAt) : "") },
      { id: "actions", header: () => <span className="sr-only">{t("colActions")}</span>, meta: { width: "1%" }, cell: ({ row }) => <CampaignActions campaign={row.original} /> },
    ];
    // locale changes the formatter's words
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, f, labels, timeZone, locale]);
}
