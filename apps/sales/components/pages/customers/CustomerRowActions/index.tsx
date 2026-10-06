"use client";

// A row's actions in the customers list: open, edit, schedule a meeting, assign (admins and
// managers) and delete (admins and managers, with a confirmation that names the customer). The
// menu is named after the customer, so a screen reader hears whose actions they are.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowSquareOut, CalendarPlus, DotsThreeVertical, PencilSimple, Trash, UserSwitch } from "@phosphor-icons/react";
import { Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import UpdateCustomerDialog from "@/components/dialogs/customers/UpdateCustomerDialog";
import AssignOwnerDialog from "@/components/dialogs/customers/AssignOwnerDialog";
import DeleteCustomerDialog from "@/components/dialogs/customers/DeleteCustomerDialog";
import ScheduleMeetingDialog from "@/components/dialogs/customers/ScheduleMeetingDialog";
import type { Customer } from "@/types/customers";

type Props = {
  customer: Customer;
  canEdit: boolean;
  canAssign: boolean;
  canDelete: boolean;
};

type Open = "edit" | "assign" | "meeting" | "delete" | null;

export default function CustomerRowActions({ customer, canEdit, canAssign, canDelete }: Props) {
  const t = useTranslations("Customers.actions");
  const [open, setOpen] = useState<Open>(null);
  const close = (o: boolean) => !o && setOpen(null);
  // The API refuses to delete a customer who can sign in (409); the menu doesn't offer it.
  const deletable = canDelete && customer.access !== "active";

  return (
    <>
      <Menu>
        <MenuTrigger
          aria-label={t("for", { name: customer.fullName })}
          className="grid size-8 place-items-center rounded-pill text-fg-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
        >
          <DotsThreeVertical aria-hidden className="size-5" />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuLinkItem icon={<ArrowSquareOut />} render={<Link href={`/customers/${customer.id}`} />}>
            {t("open")}
          </MenuLinkItem>
          {canEdit ? (
            <>
              <MenuItem icon={<PencilSimple />} onClick={() => setOpen("edit")}>
                {t("edit")}
              </MenuItem>
              <MenuItem icon={<CalendarPlus />} onClick={() => setOpen("meeting")}>
                {t("meeting")}
              </MenuItem>
            </>
          ) : null}
          {canAssign ? (
            <MenuItem icon={<UserSwitch />} onClick={() => setOpen("assign")}>
              {t("assign")}
            </MenuItem>
          ) : null}
          {deletable ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<Trash />} tone="danger" onClick={() => setOpen("delete")}>
                {t("delete")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
      {open === "edit" ? <UpdateCustomerDialog id={customer.id} open onOpenChange={close} /> : null}
      {open === "meeting" ? <ScheduleMeetingDialog id={customer.id} name={customer.fullName} open onOpenChange={close} /> : null}
      {open === "assign" ? (
        <AssignOwnerDialog customerId={customer.id} name={customer.fullName} ownerId={customer.assignedSalesmanId} open onOpenChange={close} />
      ) : null}
      {open === "delete" ? <DeleteCustomerDialog customerId={customer.id} name={customer.fullName} open onOpenChange={close} /> : null}
    </>
  );
}
