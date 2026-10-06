"use client";

// The record's actions: schedule a meeting (the primary one, last), edit, and in "More" assign
// (admins and managers) and delete (admins and managers; not while the customer can sign in, which
// the API refuses). Nothing shows in a View as session.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, DotsThree, PencilSimple, Trash, UserSwitch } from "@phosphor-icons/react";
import { Button, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import UpdateCustomerDialog from "@/components/dialogs/customers/UpdateCustomerDialog";
import ScheduleMeetingDialog from "@/components/dialogs/customers/ScheduleMeetingDialog";
import AssignOwnerDialog from "@/components/dialogs/customers/AssignOwnerDialog";
import DeleteCustomerDialog from "@/components/dialogs/customers/DeleteCustomerDialog";
import { useRole } from "@/hooks/useRole";
import type { CustomerDetail } from "@/types/customers";

type Open = "edit" | "assign" | "delete" | null;

export default function CustomerHeaderActions({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("Customers.actions");
  const router = useRouter();
  const { isAdmin, isManager, canEdit } = useRole();
  const [open, setOpen] = useState<Open>(null);
  const close = (o: boolean) => !o && setOpen(null);
  if (!canEdit) return null;
  const canAssign = isAdmin || isManager;
  const canDelete = canAssign && customer.access !== "active";

  return (
    <>
      {canAssign ? (
        <Menu>
          <MenuTrigger render={<Button variant="ghost" startIcon={<DotsThree weight="bold" />} />}>{t("more")}</MenuTrigger>
          <MenuContent align="end">
            <MenuItem icon={<UserSwitch />} onClick={() => setOpen("assign")}>
              {customer.assignedSalesmanId ? t("reassign") : t("assign")}
            </MenuItem>
            {canDelete ? (
              <>
                <MenuSeparator />
                <MenuItem icon={<Trash />} tone="danger" onClick={() => setOpen("delete")}>
                  {t("delete")}
                </MenuItem>
              </>
            ) : null}
          </MenuContent>
        </Menu>
      ) : null}
      <Button variant="secondary" startIcon={<PencilSimple />} onClick={() => setOpen("edit")}>
        {t("edit")}
      </Button>
      <ScheduleMeetingDialog
        id={customer.id}
        name={customer.fullName}
        trigger={
          <Button variant="primary" startIcon={<CalendarPlus />}>
            {customer.meetingAppointment ? t("reschedule") : t("meeting")}
          </Button>
        }
      />
      {open === "edit" ? <UpdateCustomerDialog id={customer.id} open onOpenChange={close} /> : null}
      {open === "assign" ? (
        <AssignOwnerDialog customerId={customer.id} name={customer.fullName} ownerId={customer.assignedSalesmanId} open onOpenChange={close} />
      ) : null}
      {open === "delete" ? (
        <DeleteCustomerDialog customerId={customer.id} name={customer.fullName} open onOpenChange={close} onDeleted={() => router.push("/customers")} />
      ) : null}
    </>
  );
}
