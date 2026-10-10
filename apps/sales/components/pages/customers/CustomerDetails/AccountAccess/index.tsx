"use client";

// Whether the customer can sign in, from the API's `access`. Four of the five buttons here only
// showed a toast (SAL-071). What's left works: an invited customer's link can be shown and copied,
// and an admin can open SOS's read-only View as for a customer with an account (D-017; Sales has
// no "Sign in as" of its own). Resend and Revoke wait for API endpoints (see the report).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Eye, Key } from "@phosphor-icons/react";
import { SOS_URL } from "@/constants";
import { Button, Card, CardHeader, toast } from "@orgtik/ui";
import { ButtonAnchor } from "@/components/shared/ButtonLink";
import { InviteLinkDialog } from "@/components/dialogs/customers/InviteLinkDialog";
import { useRole } from "@/hooks/useRole";
import type { CustomerDetail } from "@/types/customers";
import CustomerAccessCell from "../../CustomerAccessCell";
import { useCustomerDates } from "../../leads";

export default function AccountAccess({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("Customers.access");
  const { isAdmin, canEdit } = useRole();
  const dates = useCustomerDates();
  const [showLink, setShowLink] = useState(false);
  const access = customer.access ?? "no_account";
  const link = customer.invite?.inviteUrl || customer.inviteLink || null;
  const expiresAt = customer.invite?.expiresAt ?? null;
  const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const description =
    access === "active"
      ? t("activeBody")
      : access === "invited"
        ? expiresAt
          ? expired
            ? t("invitedExpired", { date: dates.shortDateTime(expiresAt) })
            : t("invitedBody", { date: dates.shortDateTime(expiresAt) })
          : t("invitedNoDate")
        : t("noAccountBody");

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("title")} actions={<CustomerAccessCell access={access} />} />
      <p className="text-body-sm text-fg-muted">{description}</p>
      <div className="flex flex-wrap items-center gap-2">
        {access === "invited" && link && canEdit ? (
          <>
            <Button variant="secondary" startIcon={<Key />} onClick={() => setShowLink(true)}>
              {t("showLink")}
            </Button>
            <Button variant="secondary" startIcon={<Copy />} onClick={() => void copy()}>
              {t("copyLink")}
            </Button>
          </>
        ) : null}
        {isAdmin && customer.authUserId ? (
          <ButtonAnchor variant="secondary" href={`${SOS_URL}/people?viewAs=${encodeURIComponent(customer.authUserId)}`}>
            <Eye aria-hidden className="size-4" />
            {t("viewAs")}
          </ButtonAnchor>
        ) : null}
      </div>
      {showLink && link ? (
        <InviteLinkDialog open onOpenChange={setShowLink} fullName={customer.fullName} email={customer.email} inviteLink={link} expiresAt={expiresAt} />
      ) : null}
    </Card>
  );
}
