"use client";

// Add roles to a person in one tool (FS-SOS-5). The chosen roles go in one request, so they're all
// added or none are (they went one by one: a failure halfway left some added, silently). The list
// has its own loading, error and "nothing left to add" states.
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ErrorState, Field, MultiSelect, Spinner } from "@orgtik/ui";
import { useAddUserScopeRoleMutation, useGetRolesByScopeQuery } from "@/redux/features/users/usersApi";
import { IRole } from "@/types/user";
import { useRoleLabel } from "@/lib/role-label";

export default function AddRoleDialog({
  userId,
  scope,
  toolName,
  personName,
  assignedRoles,
  open,
  onOpenChange,
}: {
  userId: number;
  scope: string;
  toolName: string;
  personName: string;
  assignedRoles: IRole[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Access");
  const roleLabel = useRoleLabel();
  const [chosen, setChosen] = useState<string[]>([]);
  const { data, isFetching, isError, refetch } = useGetRolesByScopeQuery(scope, { skip: !open });
  const [addRoles, { isLoading }] = useAddUserScopeRoleMutation();

  useEffect(() => {
    if (open) setChosen([]);
  }, [open]);

  const options = useMemo(
    () =>
      (data?.data ?? [])
        .filter((r) => r.isActive && !assignedRoles.some((a) => a.id === r.id))
        .map((r) => ({ value: String(r.id), label: roleLabel(r.name) })),
    [data, assignedRoles, roleLabel],
  );

  const save = async () => {
    try {
      await addRoles({ userId, ids: chosen.map(Number), scope }).unwrap();
      onOpenChange(false);
    } catch {
      // Said by lib/api-feedback; nothing was added, and the choice stays.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("addRolesTitle", { tool: toolName })}</DialogTitle>
          <DialogDescription>{t("addRolesBody", { name: personName, tool: toolName })}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {isFetching ? (
            <div className="grid min-h-24 place-items-center">
              <Spinner />
            </div>
          ) : isError ? (
            <ErrorState size="compact" onRetry={refetch} />
          ) : options.length === 0 ? (
            <p className="text-body text-fg-muted">{t("noRolesLeft", { tool: toolName })}</p>
          ) : (
            <Field label={t("roles")}>
              <MultiSelect options={options} value={chosen} onValueChange={setChosen} placeholder={t("chooseRoles")} />
            </Field>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" loading={isLoading} disabled={!chosen.length} onClick={save}>
            {t("addRoles", { count: chosen.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
