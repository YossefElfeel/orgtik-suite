"use client";

// A person's account type, on the library Dialog (FS-SOS-4). Controlled, so the row's menu opens
// it from outside the menu (the overlay-family rule). The types read in the reader's language.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Select } from "@orgtik/ui";
import { IPeopleItem, UserType } from "@/types/user";
import { useUpdateUserTypeMutation } from "@/redux/features/users/usersApi";

export const USER_TYPES = [UserType.ADMIN, UserType.MANAGER, UserType.EMPLOYEE, UserType.SALESMAN, UserType.CUSTOMER] as const;

export default function EditUserTypeDialog({ user, open, onOpenChange }: { user: IPeopleItem | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("People");
  const [value, setValue] = useState<string>("none");
  const [updateUserType, { isLoading }] = useUpdateUserTypeMutation();

  useEffect(() => {
    if (open && user) setValue(user.userType ?? "none");
  }, [open, user]);

  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
  const options = [{ value: "none", label: t("types.none") }, ...USER_TYPES.map((v) => ({ value: v, label: t(`types.${v}`) }))];

  const save = async () => {
    try {
      await updateUserType({ userId: user.id, userType: value === "none" ? null : value }).unwrap();
      onOpenChange(false);
    } catch {
      // Said by lib/api-feedback; the dialog stays open to try again.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("typeTitle")}</DialogTitle>
          <DialogDescription>{t("typeBody", { name })}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label={t("typeLabel")}>
            <Select options={options} value={value} onValueChange={(v) => setValue(v ?? "none")} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" loading={isLoading} onClick={save}>
            {t("typeSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
