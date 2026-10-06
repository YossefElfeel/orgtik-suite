"use client";

// A lead's stage (D-028) with a menu to move it. The badge shows what the record says: the stage
// changes at once (the API cache is patched) and goes back by itself if the API refuses, with the
// app's one toast (SAL-070). Lost asks for the reason first. A real menu with radio items replaces
// the listbox of buttons (SAL-114).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown } from "@phosphor-icons/react";
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger, useStatusLabel } from "@orgtik/ui";
import { LeadStatus } from "@/components/shared/SalesStatus";
import LostLeadDialog from "@/components/dialogs/customers/LostLeadDialog";
import { useUpdateStatusMutation } from "@/redux/features/customers/customersApi";
import type { LeadStatus as Stage } from "@/types/customers";
import { LEAD_STAGES, isLeadStatus, leadStatusOf } from "../leads";

type Props = {
  status: Stage | string;
  /** The record to move. With it, the cell saves the move itself. */
  customerId?: string;
  /** The lead's name, for the lost question. */
  name?: string;
  /** Without customerId: saves the move. Return the request (unwrapped) so a refusal is seen. */
  onStatusChange?: (status: Stage, lostReason?: string) => unknown;
  /** Shows the stage only (View as, or a role that can't move it). */
  readOnly?: boolean;
};

export default function CustomerStatusCell({ status, customerId, name = "", onStatusChange, readOnly }: Props) {
  const t = useTranslations("Customers.stage");
  const label = useStatusLabel();
  const [updateStatus] = useUpdateStatusMutation();
  const [askLost, setAskLost] = useState(false);
  const value = leadStatusOf(status);

  const save = (next: Stage, lostReason?: string) =>
    customerId ? updateStatus({ id: customerId, status: next, lostReason }).unwrap() : Promise.resolve(onStatusChange?.(next, lostReason));

  if (readOnly || (!customerId && !onStatusChange)) return <LeadStatus value={value} size="sm" />;

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          }
        >
          <LeadStatus value={value} size="sm" />
          <span className="sr-only">{t("change")}</span>
          <CaretDown aria-hidden className="size-3.5 text-fg-muted" />
        </MenuTrigger>
        <MenuContent className="min-w-52">
          <MenuRadioGroup
            value={value}
            onValueChange={(next: unknown) => {
              if (!isLeadStatus(next) || next === value) return;
              if (next === "lost") setAskLost(true);
              else void save(next).catch(() => undefined);
            }}
          >
            {LEAD_STAGES.map((s) => (
              <MenuRadioItem key={s} value={s}>
                {label("lead", s)}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
      <LostLeadDialog open={askLost} onOpenChange={setAskLost} name={name} onConfirm={(reason) => save("lost", reason)} />
    </>
  );
}
