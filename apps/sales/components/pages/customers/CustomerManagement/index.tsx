"use client";

// New customer. Staff add a lead or customer by hand (source "manual"); a salesperson's new
// customers are theirs. With "Send invitation" the customer gets a link to set a password, and the
// link is shown to copy. The staff-set password went: the invitation is the safe way in (SAL-167).
// A refused save keeps the form and its values. With `urlParam`, "?new=1" in the address opens it
// (the dashboard's New customer links there), and closing it takes the parameter away.
import { isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { InviteLinkDialog } from "@/components/dialogs/customers/InviteLinkDialog";
import { useCreateCustomerMutation } from "@/redux/features/customers/customersApi";
import { customerFormSchema, type CustomerFormValues } from "@/schemas/customers";
import { useRole } from "@/hooks/useRole";
import { usePathname, useRouter } from "@/i18n/routing";
import CustomerFormFields from "../CustomerFormFields";

const EMPTY: CustomerFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  countryCode: "",
  companyName: "",
  commercialRegistrationNumber: "",
  website: "",
  assignedSalesmanId: "",
  preferredLanguage: "en",
  sendInvite: true,
};

type InviteResult = { fullName: string; email: string; inviteLink: string; expiresAt?: string };

type Props = {
  /** The button that opens the form; a "New customer" button by default. */
  trigger?: ReactNode;
  /** The address parameter that opens the form when it is "1" (e.g. "new"). */
  urlParam?: string;
};

export function CustomerManagement({ trigger, urlParam }: Props = {}) {
  const t = useTranslations("Customers.create");
  const tForm = useTranslations("Customers.form");
  const { isAdmin, isManager, canEdit } = useRole();
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [createCustomer] = useCreateCustomerMutation();
  const form = useForm<CustomerFormValues>({ resolver: zodResolver(customerFormSchema(tForm)), defaultValues: EMPTY, mode: "onTouched" });
  const sendInvite = form.watch("sendInvite");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [own, setOwn] = useState(false);
  const fromUrl = Boolean(urlParam && params.get(urlParam) === "1");
  const setOpen = (next: boolean) => {
    setOwn(next);
    if (!next && fromUrl && urlParam) {
      const sp = new URLSearchParams(params.toString());
      sp.delete(urlParam);
      router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
    }
  };

  if (!canEdit) return null;

  const onSubmit = async () => {
    let values: CustomerFormValues | null = null;
    await form.handleSubmit((v) => {
      values = v;
    })();
    if (!values) throw new Error("invalid");
    const v = values as CustomerFormValues;
    const res = await createCustomer({
      fullName: v.fullName,
      email: v.email,
      phoneNumber: v.phoneNumber,
      address: v.address,
      countryCode: v.countryCode,
      companyName: v.companyName,
      commercialRegistrationNumber: v.commercialRegistrationNumber || undefined,
      website: v.website || undefined,
      ...((isAdmin || isManager) && v.assignedSalesmanId ? { assignedSalesmanId: v.assignedSalesmanId } : {}),
      preferredLanguage: v.preferredLanguage,
      sendInvite: v.sendInvite,
    }).unwrap();
    const created = res?.data;
    if (v.sendInvite && created?.invite?.inviteUrl) {
      setInvite({ fullName: created.fullName, email: created.email, inviteLink: created.invite.inviteUrl, expiresAt: created.invite.expiresAt });
    }
  };

  const button = (
    <Button variant="primary" startIcon={<Plus />}>
      {t("open")}
    </Button>
  );

  return (
    <>
      <FormDialog
        trigger={isValidElement(trigger) ? (trigger as ReactElement) : button}
        open={own || fromUrl}
        onOpenChange={setOpen}
        title={t("title")}
        description={t("description")}
        submitLabel={sendInvite ? t("submitInvite") : t("submit")}
        cancelLabel={t("cancel")}
        onSubmit={onSubmit}
        onClosed={() => form.reset(EMPTY)}
        size="lg"
      >
        <CustomerFormFields form={form} showOwner={isAdmin || isManager} showInvite />
      </FormDialog>
      {invite ? (
        <InviteLinkDialog
          open
          onOpenChange={(open) => !open && setInvite(null)}
          fullName={invite.fullName}
          email={invite.email}
          inviteLink={invite.inviteLink}
          expiresAt={invite.expiresAt}
        />
      ) : null}
    </>
  );
}

export default CustomerManagement;
