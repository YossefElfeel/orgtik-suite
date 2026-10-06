"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Combobox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field } from "@orgtik/ui";
import { useCan } from "@/lib/permissions";
import { useMeQuery, type RoleKey } from "@/store/api";
import { useStaffQuery } from "@/store/system";

export type Person = { key: string; name: string };

/**
 * People to assign work to. The staff list needs staff:view (Super Admin); other roles choose from
 * the people already on this kind of work (`known`) and themselves.
 */
export function useAssignees(roles: RoleKey[], known: Person[]) {
  const can = useCan();
  const me = useMeQuery();
  const staff = useStaffQuery(undefined, { skip: !can("staff:view") });
  const out = new Map<string, Person>();
  if (staff.data) for (const s of staff.data.items) if (s.roles.some((r) => roles.includes(r))) out.set(s.key, { key: s.key, name: s.name });
  for (const p of known) if (p.key && !out.has(p.key)) out.set(p.key, p);
  if (me.data && !out.has(me.data.user.key)) out.set(me.data.user.key, { key: me.data.user.key, name: `${me.data.user.firstName} ${me.data.user.lastName}` });
  return { people: [...out.values()].sort((a, b) => a.name.localeCompare(b.name)), partial: !staff.data };
}

export function AssignDialog({ title, current, people, partial, busy, error, onAssign, onClose }: { title: string; current: string | null; people: Person[]; partial: boolean; busy: boolean; error?: string; onAssign: (key: string) => void; onClose: () => void }) {
  const t = useTranslations("Services");
  const tc = useTranslations("Common");
  const [who, setWho] = useState<string | null>(current);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{partial ? t("assign.partial") : t("assign.help")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label={t("assign.person")} error={error}>
            <Combobox value={who} onValueChange={setWho} options={people.map((p) => ({ value: p.key, label: p.name }))} placeholder={t("assign.placeholder")} emptyText={t("assign.noMatch")} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={busy} disabled={!who || who === current} onClick={() => who && onAssign(who)}>
            {t("assign.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
