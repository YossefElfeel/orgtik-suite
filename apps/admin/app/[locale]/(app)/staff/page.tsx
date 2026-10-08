"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple } from "@phosphor-icons/react";
import { Badge, Button, Card, Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, IconButton, PageHeader, toast } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { asApiError, listStatus } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { useMeQuery, type RoleKey } from "@/store/api";
import { useSetStaffRolesMutation, useStaffQuery, type MatrixModule, type StaffMember } from "@/store/system";
import { PaginatedTable } from "@orgtik/ui/table";

const ROLES: RoleKey[] = ["super_admin", "finance", "sales", "support", "service_mgr", "service_team", "content", "product_mgr"];
const MODULES = ["overview", "tools", "plans", "pricing", "bundles", "workspaces", "billing", "tax", "services", "tickets", "content", "suggestions", "waitlist", "templates", "staff", "reports", "settings"];
const LEVEL: Record<string, { key: string; tone: "brand" | "info" | "neutral" | "success" }> = {
  F: { key: "full", tone: "brand" },
  E: { key: "edit", tone: "success" },
  "E*": { key: "assigned", tone: "info" },
  V: { key: "view", tone: "neutral" },
};

function RolesDialog({ person, self, onClose }: { person: StaffMember; self: boolean; onClose: () => void }) {
  const t = useTranslations("System");
  const ta = useTranslations("App");
  const tc = useTranslations("Common");
  const [roles, setRoles] = useState<RoleKey[]>(person.roles);
  const [problem, setProblem] = useState<string | undefined>();
  const [save, saving] = useSetStaffRolesMutation();
  const toggle = (r: RoleKey, on: boolean) => setRoles(on ? [...roles, r].sort((a, b) => ROLES.indexOf(a) - ROLES.indexOf(b)) : roles.filter((x) => x !== r));
  const submit = () => {
    setProblem(undefined);
    save({ key: person.key, roles })
      .unwrap()
      .then(() => {
        toast.success(t("staff.saved", { name: person.name }));
        onClose();
      })
      .catch((x) => {
        const a = asApiError(x);
        setProblem(a.status === 409 && a.code === "self_lockout" ? t("staff.selfLockout") : a.status === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("staff.editTitle", { name: person.name })}</DialogTitle>
          <DialogDescription>{roles.length ? t("staff.dialogHelp") : t("staff.noRolesWarning")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {problem ? (
            <p role="alert" className="rounded-card bg-danger-subtle p-3 text-body-sm text-fg">
              {problem}
            </p>
          ) : null}
          <Field label={t("staff.roles")} group>
            <div className="flex flex-col gap-3">
              {ROLES.map((r) => {
                const locked = self && r === "super_admin" && person.roles.includes("super_admin");
                return <Checkbox key={r} checked={roles.includes(r)} disabled={locked} onCheckedChange={(v) => toggle(r, Boolean(v))} label={ta(`roles.${r}`)} description={locked ? t("staff.selfLocked") : t(`staff.roleHelp.${r}`)} />;
              })}
            </div>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={saving.isLoading} onClick={submit}>
            {t("staff.saveRoles")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Matrix({ modules, roleOrder }: { modules: MatrixModule[]; roleOrder: RoleKey[] }) {
  const t = useTranslations("System");
  const ta = useTranslations("App");
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-labelledby="matrix-title">
        <PaginatedTable><table className="w-full min-w-[56rem] text-body-sm">
          <caption className="sr-only">{t("staff.matrixTitle")}</caption>
          <thead className="bg-sunken">
            <tr>
              <th scope="col" className="sticky start-0 bg-sunken px-3 py-2 text-start font-medium text-fg">
                {t("staff.module")}
              </th>
              {roleOrder.map((r) => (
                <th key={r} scope="col" className="px-2 py-2 text-center font-medium text-fg">
                  {ta(`roles.${r}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.key} className="border-t border-line">
                <th scope="row" className="sticky start-0 bg-raised px-3 py-2 text-start font-normal text-fg">
                  {MODULES.includes(m.key) ? t(`staff.modules.${m.key}`) : m.label}
                </th>
                {m.levels.map((lv, i) => {
                  const l = LEVEL[lv];
                  return (
                    <td key={i} className="px-2 py-2 text-center">
                      {l ? (
                        <Badge size="sm" tone={l.tone} emphasis={l.key === "view" ? "outline" : "subtle"}>
                          {t(`staff.levels.${l.key}`)}
                        </Badge>
                      ) : (
                        <>
                          <span aria-hidden="true" className="text-fg-subtle">
                            —
                          </span>
                          <span className="sr-only">{t("staff.levels.none")}</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table></PaginatedTable>
      </div>
    </Card>
  );
}

function Staff() {
  const t = useTranslations("System");
  const ta = useTranslations("App");
  const can = useCan();
  const me = useMeQuery();
  const editable = can("staff:full");
  const { data, isLoading, error, refetch } = useStaffQuery();
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const myKey = me.data?.user.key;

  const columns = useMemo<ColumnDef<StaffMember, unknown>[]>(
    () => [
      {
        id: "person",
        header: t("staff.person"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <span className="inline-flex items-center gap-2">
              <bdi dir="auto" className="truncate font-medium text-fg">
                {row.original.name}
              </bdi>
              {row.original.key === myKey ? <Badge size="sm">{t("staff.you")}</Badge> : null}
            </span>
            <span dir="ltr" className="truncate text-start text-caption text-fg-subtle">
              {row.original.email}
            </span>
          </span>
        ),
      },
      {
        id: "roles",
        header: t("staff.roles"),
        meta: { wrap: true },
        cell: ({ row }) =>
          row.original.roles.length ? (
            <span className="flex flex-wrap gap-1">
              {row.original.roles.map((r) => (
                <Badge key={r} size="sm" tone="brand">
                  {ta(`roles.${r}`)}
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-fg-subtle">{t("staff.noAccess")}</span>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) => (editable ? <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("staff.editFor", { name: row.original.name })} onClick={() => setEditing(row.original)} /> : null),
      },
    ],
    [t, ta, editable, myKey],
  );

  const roleOrder = (data?.meta.roles.map((r) => r.key) ?? ROLES) as RoleKey[];
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("staff.title")} description={t("staff.description")} />
      <section aria-labelledby="people-title" className="flex flex-col gap-3">
        <h2 id="people-title" className="font-display text-title-sm text-fg">
          {t("staff.people")}
        </h2>
        <DataTable label={t("staff.people")} columns={columns} data={data?.items ?? []} getRowId={(r) => r.key} status={listStatus(isLoading, error)} paginate onRetry={refetch} empty={{ title: t("staff.empty") }} />
      </section>
      <section aria-labelledby="matrix-title" className="flex flex-col gap-3">
        <h2 id="matrix-title" className="font-display text-title-sm text-fg">
          {t("staff.matrixTitle")}
        </h2>
        <p className="text-body-sm text-fg-muted">{t("staff.matrixHelp")}</p>
        {data?.meta.modules.length ? <Matrix modules={data.meta.modules} roleOrder={roleOrder} /> : null}
      </section>
      {editing ? <RolesDialog person={editing} self={editing.key === myKey} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

export default function StaffPage() {
  return (
    <RequirePermission permission="staff:view">
      <Staff />
    </RequirePermission>
  );
}
