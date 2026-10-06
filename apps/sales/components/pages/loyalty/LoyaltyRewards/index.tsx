"use client";

// The rewards customers can redeem points for (admins), on the library's DataTable with the page
// in the address.
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button, Card, CardHeader } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { useRole } from "@/hooks/useRole";
import RewardDialog from "@/components/dialogs/loyalty/RewardDialog";
import { useGetLoyaltyRewardsQuery, useGetLoyaltySettingsQuery } from "@/redux/features/loyalty/loyaltyApi";
import { useUrlState } from "@/lib/commissions";
import { useRewardColumns } from "./columns";

export default function LoyaltyRewards() {
  const t = useTranslations("Team.loyalty");
  const { isAdmin, canEdit } = useRole();
  const url = useUrlState();
  const settings = useGetLoyaltySettingsQuery();
  const base = settings.data?.data?.baseCurrency ?? "USD";
  const list = useGetLoyaltyRewardsQuery({ page: url.page, limit: url.size });
  const editable = isAdmin && canEdit;
  const columns = useRewardColumns(base, editable);
  const items = list.data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };
  const add = editable ? (
    <RewardDialog
      baseCurrency={base}
      trigger={
        <Button variant="primary" startIcon={<Plus />}>
          {t("addReward")}
        </Button>
      }
    />
  ) : null;

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader title={t("rewardsTitle")} description={t("rewardsHint")} actions={add} />
      <DataTable
        label={t("rewardsTitle")}
        columns={columns}
        data={items}
        getRowId={(r) => r.id}
        mode="server"
        rowCount={list.data?.data?.meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          url.set({ page: next.pageIndex + 1, ...(next.pageSize !== url.size ? { size: next.pageSize } : {}) });
        }}
        pageSizes={url.pageSizes}
        status={list.isLoading ? "loading" : list.isError ? "error" : items.length ? "ready" : "empty"}
        onRetry={() => void list.refetch()}
        error={{ title: t("rewardsErrorTitle"), description: t("errorBody") }}
        empty={{ title: t("rewardsEmptyTitle"), description: t("rewardsEmptyBody"), action: add ?? undefined }}
      />
    </Card>
  );
}
