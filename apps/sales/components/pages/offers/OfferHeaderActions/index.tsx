"use client";

// Staff actions on an offer's page: edit while it is open, delete unless it was accepted. The same
// rules as the list (SAL-091). Deleting asks first and goes back to the list.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Button, ConfirmDialog } from "@orgtik/ui";
import CreateOfferDialog from "@/components/dialogs/offers/CreateOfferDialog";
import { useRouter } from "@/i18n/routing";
import { useDeleteOfferMutation } from "@/redux/features/offers/offersApi";
import { isolate } from "@/lib/bidi";
import { isOpen } from "@/lib/deals/offer";
import type { OfferDetail } from "@/types/offers";

export default function OfferHeaderActions({ offer }: { offer: OfferDetail }) {
  const t = useTranslations("Offers");
  const router = useRouter();
  const [remove] = useDeleteOfferMutation();
  const [deleting, setDeleting] = useState(false);
  const canEdit = isOpen(offer.status) && offer.canEdit;
  const canDelete = offer.status !== "accepted" && offer.canDelete;

  return (
    <>
      {canDelete ? (
        <Button variant="secondary" onClick={() => setDeleting(true)} startIcon={<Trash aria-hidden className="size-4" />}>
          {t("delete")}
        </Button>
      ) : null}
      {canEdit ? (
        <CreateOfferDialog
          offerId={offer.id}
          trigger={
            <Button variant="primary" startIcon={<PencilSimple aria-hidden className="size-4" />}>
              {t("edit")}
            </Button>
          }
        />
      ) : null}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteTitle", { name: isolate(offer.name) })}
        impact={t("deleteImpact", { customer: isolate(offer.customer.fullName) })}
        confirmLabel={t("deleteConfirm")}
        irreversible
        onConfirm={async () => {
          await remove(offer.id).unwrap();
          router.push("/offers");
        }}
      />
    </>
  );
}
