"use client";

// Who signs in to a CMS through this account (FS-SOS-9). Members are listed by name with their
// status in words; removing one says what it does; adding takes several people at once, in one
// request. The list has its loading and empty states.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { UserMinus } from "@phosphor-icons/react";
import { Avatar, Button, ConfirmDialog, Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, Field, IconButton, LoadingState, MultiSelect } from "@orgtik/ui";
import { useGetAllUsersQuery } from "@/redux/features/users/usersApi";
import { useAssignUsersToCMSAccountMutation, useRemoveUserFromCMSAccountMutation } from "@/redux/features/cmsAccounts/cmsAccountsApi";
import { ICMSAccount } from "@/types/CMSAccount";
import { personName } from "@/lib/person";

export function AccountMembersDialog({ account, open, onOpenChange }: { account: ICMSAccount | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Cms");
  const { data, isLoading } = useGetAllUsersQuery(undefined, { skip: !open });
  const [assign, { isLoading: adding }] = useAssignUsersToCMSAccountMutation();
  const [remove] = useRemoveUserFromCMSAccountMutation();
  const [chosen, setChosen] = useState<string[]>([]);
  const [removing, setRemoving] = useState<{ id: number; name: string } | null>(null);

  const memberIds = useMemo(() => new Set((account?.members ?? []).map((m) => m.id)), [account]);
  const people = data?.data ?? [];
  const members = people.filter((p) => memberIds.has(p.id));
  const options = people.filter((p) => !memberIds.has(p.id) && p.isActive).map((p) => ({ value: String(p.id), label: personName(p), hint: p.email }));

  if (!account) return null;

  const add = async () => {
    try {
      await assign({ accountId: account.id, userIds: chosen.map(Number) }).unwrap();
      setChosen([]);
    } catch {
      // Said by lib/api-feedback.
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{t("membersTitle", { name: account.name })}</DialogTitle>
            <DialogDescription>{t("membersBody")}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end gap-2">
              <Field label={t("addMembers")} className="min-w-0 flex-1">
                <MultiSelect options={options} value={chosen} onValueChange={setChosen} placeholder={t("choosePeople")} />
              </Field>
              <Button variant="primary" disabled={!chosen.length} loading={adding} onClick={add}>
                {t("add")}
              </Button>
            </div>
            {isLoading ? (
              <LoadingState rows={3} />
            ) : members.length === 0 ? (
              <p className="text-body text-fg-muted">{t("noMembers")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line rounded-field border border-line">
                {members.map((m) => {
                  const name = personName(m);
                  return (
                    <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                      <Avatar name={name} src={m.avatar ?? undefined} size="sm" decorative />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span dir="auto" className="truncate font-medium text-fg">{name}</span>
                        <span dir="ltr" className="truncate text-start text-caption text-fg-muted">{m.email}</span>
                      </span>
                      <IconButton variant="ghost" size="sm" label={t("removeMemberLabel", { name })} icon={<UserMinus />} onClick={() => setRemoving({ id: m.id, name })} />
                    </li>
                  );
                })}
              </ul>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={removing ? t("removeMemberTitle", { name: removing.name }) : ""}
        impact={removing ? t("removeMemberImpact", { name: removing.name, account: account.name }) : ""}
        confirmLabel={t("removeMember")}
        tone="primary"
        onConfirm={async () => {
          if (removing) await remove({ accountId: account.id, userId: removing.id }).unwrap();
        }}
      />
    </>
  );
}
