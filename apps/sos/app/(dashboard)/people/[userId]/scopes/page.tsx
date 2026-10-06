"use client";

// A person's access (FS-SOS-5): one card per tool with their roles. Removing a role or a whole tool
// says what it takes away before it does (a role went on one click; a tool reused "Delete X? This
// action cannot be undone"). Every remove has a name. The page tells a missing person, no
// permission and a failed load apart (all three said "User not found").
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash, UserCircleMinus } from "@phosphor-icons/react";
import { Avatar, Button, Card, ConfirmDialog, EmptyState, ErrorState, IconButton, LoadingState, NoPermissionState, PageHeader, Tag } from "@orgtik/ui";
import { useGetUserQuery, useGetUserScopesQuery, useRemoveUserScopeMutation, useRemoveUserScopeRoleMutation } from "@/redux/features/users/usersApi";
import { IRole, IUserScopesWithRoles } from "@/types/user";
import AddScopeDialog from "@/components/dialogs/AddScopeDialog";
import AddRoleDialog from "@/components/dialogs/AddRoleDialog";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useAppLabel } from "@/components/suite/useSuiteApps";
import { useRoleLabel } from "@/lib/role-label";
import { personName } from "@/lib/person";

const statusOf = (e: unknown) => (e && typeof e === "object" && "status" in e ? (e as { status: unknown }).status : undefined);

export default function PersonAccessPage() {
  const t = useTranslations("Access");
  const tp = useTranslations("People");
  const appLabel = useAppLabel();
  const roleLabel = useRoleLabel();
  const params = useParams();
  const userId = Number(params.userId);
  const valid = Number.isInteger(userId) && userId > 0;

  const person = useGetUserQuery(userId, { skip: !valid });
  const access = useGetUserScopesQuery(userId, { skip: !valid });
  const [removeScope] = useRemoveUserScopeMutation();
  const [removeRole] = useRemoveUserScopeRoleMutation();

  const [adding, setAdding] = useState<"tool" | IUserScopesWithRoles | null>(null);
  const [removing, setRemoving] = useState<{ tool: IUserScopesWithRoles; role?: IRole } | null>(null);

  const back = (
    <ButtonLink href="/people" variant="secondary">
      {t("backToPeople")}
    </ButtonLink>
  );
  const crumbs = [{ label: tp("title"), href: "/people" }];

  if (!valid || statusOf(person.error) === 404) {
    return <EmptyState titleAs="h1" icon={<UserCircleMinus />} title={t("notFoundTitle")} description={t("notFoundBody")} action={back} />;
  }
  if (statusOf(person.error) === 403 || statusOf(access.error) === 403) {
    return <NoPermissionState titleAs="h1" action={back} />;
  }
  if (person.isError || access.isError) {
    return (
      <ErrorState
        titleAs="h1"
        onRetry={() => {
          person.refetch();
          access.refetch();
        }}
      />
    );
  }
  if (person.isLoading || access.isLoading || !person.data) {
    return <LoadingState rows={4} />;
  }

  const p = person.data.data;
  const name = personName(p);
  const tools = access.data?.data ?? [];
  const toolName = (s: IUserScopesWithRoles) => appLabel(s.name, s.displayName || s.name);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[...crumbs, { label: <span dir="auto">{name}</span> }]}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={name} src={p.avatar ?? undefined} size="md" decorative />
            <span dir="auto">{t("title", { name })}</span>
          </span>
        }
        description={t("description")}
        actions={
          <Button variant="primary" startIcon={<Plus />} onClick={() => setAdding("tool")}>
            {t("addTool")}
          </Button>
        }
      />

      {tools.length === 0 ? (
        <EmptyState
          title={t("noAccessTitle", { name })}
          description={t("noAccessBody")}
          action={
            <Button variant="primary" startIcon={<Plus />} onClick={() => setAdding("tool")}>
              {t("addTool")}
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(22rem,100%),1fr))] gap-4">
          {tools.map((tool) => (
            <li key={tool.id}>
              <Card className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="font-display text-title-sm text-fg">{toolName(tool)}</h2>
                    <p className="text-caption text-fg-muted">{t("rolesCount", { count: tool.roles.length })}</p>
                  </div>
                  <IconButton variant="ghost" size="sm" label={t("removeToolLabel", { tool: toolName(tool) })} icon={<Trash />} onClick={() => setRemoving({ tool })} />
                </div>
                {tool.roles.length ? (
                  <ul className="flex flex-wrap gap-2" aria-label={t("rolesIn", { tool: toolName(tool) })}>
                    {tool.roles.map((role) => (
                      <li key={role.id}>
                        <Tag onRemove={() => setRemoving({ tool, role })}>{roleLabel(role.name)}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body-sm text-fg-muted">{t("noRoles")}</p>
                )}
                <div className="mt-auto">
                  <Button variant="secondary" size="sm" startIcon={<Plus />} onClick={() => setAdding(tool)}>
                    {t("addRolesButton")}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <AddScopeDialog userId={userId} personName={name} userScopes={tools} open={adding === "tool"} onOpenChange={(o) => !o && setAdding(null)} />
      {adding && adding !== "tool" ? (
        <AddRoleDialog
          userId={userId}
          scope={adding.name}
          toolName={toolName(adding)}
          personName={name}
          assignedRoles={adding.roles}
          open
          onOpenChange={(o) => !o && setAdding(null)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing && !removing.role)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={removing ? t("removeToolTitle", { tool: toolName(removing.tool) }) : ""}
        impact={removing ? t("removeToolImpact", { name, tool: toolName(removing.tool), count: removing.tool.roles.length }) : ""}
        confirmLabel={t("removeTool")}
        tone="danger"
        onConfirm={async () => {
          if (removing) await removeScope({ userId, scope: removing.tool.name }).unwrap();
        }}
      />
      <ConfirmDialog
        open={Boolean(removing?.role)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={removing?.role ? t("removeRoleTitle", { role: roleLabel(removing.role.name) }) : ""}
        impact={removing?.role ? t("removeRoleImpact", { name, role: roleLabel(removing.role.name), tool: toolName(removing.tool) }) : ""}
        confirmLabel={t("removeRole")}
        tone="primary"
        onConfirm={async () => {
          if (removing?.role) await removeRole({ userId, id: removing.role.id }).unwrap();
        }}
      />
    </div>
  );
}
