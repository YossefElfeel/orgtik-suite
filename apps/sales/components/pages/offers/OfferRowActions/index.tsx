"use client";

// An offer's actions in the list: open it, edit it while it is open, delete it unless it was
// accepted. The same rules as the offer's page (the list let anyone delete any offer, SAL-091).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThree, Eye, PencilSimple, Trash } from "@phosphor-icons/react";
import { ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger } from "@orgtik/ui";
import CreateOfferDialog from "@/components/dialogs/offers/CreateOfferDialog";
import { Link } from "@/i18n/routing";
import { useDeleteOfferMutation } from "@/redux/features/offers/offersApi";
import { isolate } from "@/lib/bidi";
import { isOpen } from "@/lib/deals/offer";
import type { Offer } from "@/types/offers";

export default function OfferRowActions({ offer, canManage }: { offer: Offer; canManage: boolean }) {
  const t = useTranslations("Offers");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [remove] = useDeleteOfferMutation();
  const canEdit = canManage && isOpen(offer.status);
  const canDelete = canManage && offer.status !== "accepted";

  return (
    <>
      <Menu>
        <MenuTrigger render={<IconButton variant="ghost" size="sm" label={t("rowActions", { name: offer.name })} icon={<DotsThree weight="bold" />} />} />
        <MenuContent align="end">
          <MenuLinkItem icon={<Eye />} render={<Link href={`/offers/${offer.id}`} />}>
            {t("view")}
          </MenuLinkItem>
          {canEdit ? (
            <MenuItem icon={<PencilSimple />} onClick={() => setEditing(true)}>
              {t("edit")}
            </MenuItem>
          ) : null}
          {canDelete ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(true)}>
                {t("delete")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
      {canEdit && editing ? <CreateOfferDialog offerId={offer.id} open={editing} onOpenChange={setEditing} /> : null}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteTitle", { name: isolate(offer.name) })}
        impact={t("deleteImpact", { customer: isolate(offer.customerName ?? "") })}
        confirmLabel={t("deleteConfirm")}
        irreversible
        onConfirm={() => remove(offer.id).unwrap()}
      />
    </>
  );
}
