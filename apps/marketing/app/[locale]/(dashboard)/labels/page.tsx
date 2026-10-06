"use client";

// Labels for sorting posts, on the library's DataTable with the page in the address. The
// numbering continues across pages, and every state has its own screen.
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button, NoPermissionState, PageHeader } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { usePathname, useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { LabelFormDialog } from "@/components/pages/labels/LabelFormDialog";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetLabelsQuery } from "@/redux/features/labels/labelsApi";
import { useLabelColumns } from "./columns";

const SIZES = [10, 25, 50];

export default function LabelsPage() {
  const t = useTranslations("Labels");
  const can = useMarketingRoles();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : SIZES[0];
  const { data, isLoading, isError, error, refetch } = useGetLabelsQuery({ page, limit: pageSize }, { skip: !can.manageAudience });
  const columns = useLabelColumns({ offset: (page - 1) * pageSize, canManage: can.manageAudience });
  const items = data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };

  if (!can.manageAudience) {
    return (
      <NoPermissionState
        size="page"
        titleAs="h1"
        title={t("noAccessTitle")}
        description={can.readOnlySession ? t("noAccessReadOnly") : t("noAccessBody")}
        action={<ButtonLink href="/posts" variant="secondary">{t("toPosts")}</ButtonLink>}
      />
    );
  }

  const go = (next: { page: number; size: number }) => {
    const sp = new URLSearchParams(params.toString());
    if (next.page > 1) sp.set("page", String(next.page));
    else sp.delete("page");
    if (next.size !== SIZES[0]) sp.set("size", String(next.size));
    else sp.delete("size");
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  const create = (
    <LabelFormDialog
      trigger={
        <Button variant="primary" startIcon={<Plus />}>
          {t("newLabel")}
        </Button>
      }
    />
  );
  const meta = data?.data?.meta as { total?: number } | undefined;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={create} />
      <DataTable
        label={t("title")}
        columns={columns}
        data={items}
        getRowId={(r) => r.id}
        mode="server"
        rowCount={meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          go({ page: next.pageIndex + 1, size: next.pageSize });
        }}
        pageSizes={SIZES}
        status={isLoading ? "loading" : isError ? ((error as { status?: number })?.status === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty"}
        onRetry={() => refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        empty={{ title: t("emptyTitle"), description: t("emptyBody"), action: create }}
      />
    </section>
  );
}
