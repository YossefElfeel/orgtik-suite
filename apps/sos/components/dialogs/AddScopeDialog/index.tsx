"use client";

// Give a person access to another tool (FS-SOS-5). Only active tools they don't have yet are offered
// (inactive ones were listed too), by their names in the reader's language.
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Select } from "@orgtik/ui";
import { useGetAllScopesQuery } from "@/redux/features/scopes/scopesApi";
import { useAddUserScopeMutation } from "@/redux/features/users/usersApi";
import { IUserScopesWithRoles } from "@/types/user";
import { useAppLabel } from "@/components/suite/useSuiteApps";

export default function AddScopeDialog({
  userId,
  personName,
  userScopes,
  open,
  onOpenChange,
}: {
  userId: number;
  personName: string;
  userScopes: IUserScopesWithRoles[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Access");
  const appLabel = useAppLabel();
  const [scope, setScope] = useState<string | null>(null);
  const { data } = useGetAllScopesQuery(undefined, { skip: !open });
  const [addUserScope, { isLoading }] = useAddUserScopeMutation();

  useEffect(() => {
    if (open) setScope(null);
  }, [open]);

  const options = useMemo(
    () =>
      (data?.data ?? [])
        .filter((s) => s.isActive && !userScopes.some((u) => u.name === s.name))
        .map((s) => ({ value: s.name, label: appLabel(s.name, s.displayName || s.name) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, userScopes],
  );

  const save = async () => {
    if (!scope) return;
    try {
      await addUserScope({ userId, scope }).unwrap();
      onOpenChange(false);
    } catch {
      // Said by lib/api-feedback.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("addToolTitle")}</DialogTitle>
          <DialogDescription>{t("addToolBody", { name: personName })}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {options.length === 0 && data ? (
            <p className="text-body text-fg-muted">{t("noToolsLeft", { name: personName })}</p>
          ) : (
            <Field label={t("tool")}>
              <Select options={options} value={scope} onValueChange={setScope} placeholder={t("chooseTool")} />
            </Field>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" loading={isLoading} disabled={!scope} onClick={save}>
            {t("addTool")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
