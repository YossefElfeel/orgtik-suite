"use client";

// A new offer, or an edit of an open one (offerId): the shared deal builder in offer mode.
import type { ReactElement } from "react";
import DealBuilderDialog from "@/components/dialogs/shared/deal-plans/DealBuilderDialog";

type Props = {
  offerId?: string;
  customerId?: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (offerId: string) => void;
};

export default function CreateOfferDialog(props: Props) {
  return <DealBuilderDialog mode="offer" {...props} />;
}
