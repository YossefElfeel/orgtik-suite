"use client";

// Customers and leads: the list view of the leads inbox (D-028). The same filters as the pipeline
// (stage, source, owner, age, search) and the page sit in the address. Salespeople see their own;
// admins and managers see everyone's and can assign. Lists say when they fail, with Retry, instead
// of looking empty (SAL-099, SAL-102).
import { useTranslations } from "next-intl";
import { Button, NoPermissionState, PageHeader } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { CustomerManagement } from "@/components/pages/customers/CustomerManagement";
import LeadToolbar from "@/components/pages/customers/LeadToolbar";
import { PAGE_SIZES } from "@/components/pages/customers/leads";
import { INBOX_LIMIT, useLeadInbox } from "@/components/pages/customers/useLeadInbox";
import { useRole } from "@/hooks/useRole";
import { useCustomerColumns } from "./columns";

export default function CustomersPage() {
  const t = useTranslations("Customers");
  const { isCustomer, isReady, isAdmin, isManager } = useRole();
  const data = useLeadInbox();
  const { inbox } = data;
  const columns = useCustomerColumns({ canEdit: data.canEdit, canAssign: data.canAssign, canDelete: data.canDelete, showOwner: isAdmin || isManager });

  // Customers have their own portal; this area is for staff (the nav hides it too).
  if (isReady && isCustomer) return <NoPermissionState size="page" titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} />;

  const pagination: PaginationState = { pageIndex: inbox.filters.page - 1, pageSize: inbox.filters.size };
  const create = data.canEdit ? <CustomerManagement urlParam="new" /> : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={create} />
      <LeadToolbar view="list" inbox={inbox} sources={data.sources} owners={data.owners} stageCounts={data.stageCounts} />
      {data.truncated ? <p className="text-caption text-fg-muted">{t("truncated", { count: INBOX_LIMIT })}</p> : null}
      <DataTable
        label={t("listLabel")}
        columns={columns}
        data={data.shown}
        getRowId={(c) => c.id}
        mode="client"
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          inbox.set({ page: next.pageIndex + 1, size: next.pageSize });
        }}
        pageSizes={PAGE_SIZES}
        status={data.status === "ready" ? (data.shown.length ? "ready" : "empty") : data.status}
        onRetry={() => void data.refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        forbidden={{ title: t("noAccessTitle"), description: t("noAccessBody") }}
        empty={
          inbox.filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={inbox.clear}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: data.canEdit ? t("emptyBody") : t("emptyBodyViewer"), action: data.canEdit ? <CustomerManagement /> : undefined }
        }
      />
    </section>
  );
}
