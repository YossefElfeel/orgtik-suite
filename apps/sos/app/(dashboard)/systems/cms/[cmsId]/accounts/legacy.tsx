"use client";

// A client CMS's accounts (FS-SOS-9): titled with the CMS's name (it said "CMS #12 Accounts"),
// with the members of each account and a way into the CMS as that account. Opening it no longer
// gets stopped by popup blockers (lib/open-site). Deleting an account says who loses that sign-in.
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowSquareOut, DotsThreeVertical, PencilSimple, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import { Avatar, Button, ConfirmDialog, EmptyState, IconButton, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, PageHeader, toast } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { useGetCMSInstanceByIdQuery } from "@/redux/features/cms/cmsApi";
import { useCreateCMSAccountTokenMutation, useDeleteCMSAccountMutation, useGetCMSAccountsQuery } from "@/redux/features/cmsAccounts/cmsAccountsApi";
import { ICMSAccount } from "@/types/CMSAccount";
import { CmsAccountDialog } from "@/components/pages/systems/CmsAccountDialog";
import { AccountMembersDialog } from "@/components/pages/systems/AccountMembersDialog";
import { CmsLogo } from "@/components/pages/systems/CmsLogo";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { openSite } from "@/lib/open-site";
import { personName } from "@/lib/person";

export default function CmsAccountsPage() {
  const t = useTranslations("Cms");
  const ts = useTranslations("Systems");
  const cmsId = Number(useParams().cmsId);
  const valid = Number.isInteger(cmsId) && cmsId > 0;
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const cms = useGetCMSInstanceByIdQuery(cmsId, { skip: !valid });
  const { data, isLoading, isError, refetch } = useGetCMSAccountsQuery({ cmsId, page: pagination.pageIndex + 1, limit: pagination.pageSize }, { skip: !valid });
  const [remove] = useDeleteCMSAccountMutation();
  const [getToken] = useCreateCMSAccountTokenMutation();
  const [editing, setEditing] = useState<ICMSAccount | "new" | null>(null);
  const [members, setMembers] = useState<ICMSAccount | null>(null);
  const [deleting, setDeleting] = useState<ICMSAccount | null>(null);

  const site = cms.data?.data;
  if (!valid || (cms.error && (cms.error as { status?: number }).status === 404)) {
    return <EmptyState titleAs="h1" title={t("notFoundTitle")} description={t("notFoundBody")} action={<ButtonLink href="/systems/cms">{t("backToCms")}</ButtonLink>} />;
  }
  const accounts = data?.data ?? [];
  // Members of the account currently open in the dialog, kept fresh from the list.
  const membersAccount = members ? (accounts.find((a) => a.id === members.id) ?? members) : null;

  const openAs = async (account: ICMSAccount) => {
    const ok = await openSite(async () => {
      const r = await getToken(account.id).unwrap();
      const { accessToken, refreshToken } = r.data as { accessToken: string; refreshToken?: string };
      // The client CMS's own contract: its /auth page takes the tokens (outside D-017's scope: an
      // external site, not a suite app).
      const base = account.cmsInstance.domain.replace(/\/$/, "");
      return `${base}/auth?token=${encodeURIComponent(accessToken)}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ""}`;
    });
    if (!ok) toast.error(t("openFailed"));
  };

  const columns: ColumnDef<ICMSAccount>[] = [
    { id: "name", header: t("accountName"), meta: { truncate: true }, cell: ({ row }) => <span dir="auto" className="truncate font-semibold text-fg">{row.original.name}</span> },
    { id: "email", header: t("accountEmail"), meta: { truncate: true }, cell: ({ row }) => <span dir="ltr" className="truncate text-fg-muted">{row.original.email}</span> },
    {
      id: "members",
      header: t("members"),
      cell: ({ row }) => {
        const list = row.original.members ?? [];
        return (
          <button type="button" onClick={() => setMembers(row.original)} className="flex items-center gap-2 rounded-field text-start hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-focus">
            <span className="flex">
              {list.slice(0, 3).map((m, i) => (
                <span key={m.id} className={i ? "-ms-2" : undefined}>
                  <Avatar name={personName(m)} src={m.avatar ?? undefined} size="xs" decorative />
                </span>
              ))}
            </span>
            <span className="text-body-sm text-fg-muted">{t("membersCount", { count: list.length })}</span>
          </button>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{ts("colActions")}</span>,
      meta: { width: "1%" },
      cell: ({ row }) => {
        const a = row.original;
        return (
          <Menu>
            <MenuTrigger render={<IconButton variant="ghost" size="sm" label={ts("actionsFor", { name: a.name })} icon={<DotsThreeVertical weight="bold" />} />} />
            <MenuContent align="end">
              <MenuItem icon={<ArrowSquareOut />} onClick={() => openAs(a)}>
                {t("openAs")}
              </MenuItem>
              <MenuItem icon={<UsersThree />} onClick={() => setMembers(a)}>
                {t("manageMembers")}
              </MenuItem>
              <MenuItem icon={<PencilSimple />} onClick={() => setEditing(a)}>
                {ts("edit")}
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" icon={<Trash />} onClick={() => setDeleting(a)}>
                {t("deleteAccount")}
              </MenuItem>
            </MenuContent>
          </Menu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[
          { label: ts("title"), href: "/systems" },
          { label: ts("tabCms"), href: "/systems/cms" },
          { label: <span dir="auto">{site?.name ?? "…"}</span> },
        ]}
        title={
          <span className="flex items-center gap-3">
            {site ? <CmsLogo cms={site} /> : null}
            <span dir="auto">{site ? t("accountsTitle", { name: site.name }) : t("accounts")}</span>
          </span>
        }
        description={t("accountsBody")}
        actions={
          <Button variant="primary" startIcon={<Plus />} onClick={() => setEditing("new")}>
            {t("addAccount")}
          </Button>
        }
      />
      <DataTable
        label={t("accounts")}
        columns={columns}
        data={accounts}
        getRowId={(a) => String(a.id)}
        mode="server"
        rowCount={Number(data?.meta?.total ?? 0)}
        pagination={pagination}
        onPaginationChange={setPagination}
        status={isLoading ? "loading" : isError ? "error" : "ready"}
        onRetry={refetch}
        empty={{ title: t("noAccounts"), description: t("noAccountsBody"), action: <Button variant="primary" startIcon={<Plus />} onClick={() => setEditing("new")}>{t("addAccount")}</Button> }}
      />
      <CmsAccountDialog cmsId={cmsId} account={editing === "new" ? null : editing} open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} />
      <AccountMembersDialog account={membersAccount} open={members !== null} onOpenChange={(o) => !o && setMembers(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? t("deleteAccountTitle", { name: deleting.name }) : ""}
        impact={deleting ? t("deleteAccountImpact", { count: deleting.members?.length ?? 0, name: site?.name ?? "" }) : ""}
        confirmLabel={t("deleteAccount")}
        tone="danger"
        irreversible
        onConfirm={async () => {
          if (deleting) await remove(deleting.id).unwrap();
        }}
      />
    </div>
  );
}
