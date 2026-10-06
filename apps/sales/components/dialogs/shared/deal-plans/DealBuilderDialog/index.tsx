"use client";

// One deal builder for offers and projects (FS-SAL-7), on the library Stepper:
// customer → plans → terms → review. It replaces the two wizards (CreateOfferDialog's and
// CreateUpdateProjectDialog's), which priced from local fixtures and lost terms on edit.
// - Create: a new offer or project.
// - Edit an offer (offerId), or change a pending project's plans (projectId). The dialog fetches its
//   own record; every line keeps its agreed price and terms.
// Closing with unsaved edits asks first; a failed save keeps everything (SAL-008).
import { isValidElement, useEffect, useRef, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger, ErrorState, LoadingState } from "@orgtik/ui";
import DealBuilderForm from "@/components/dialogs/shared/deal-plans/DealBuilderForm";
import { useGetOfferByIdQuery } from "@/redux/features/offers/offersApi";
import { useGetProjectQuery } from "@/redux/features/projects/projectsApi";
import { useGetDealCustomerQuery } from "@/redux/features/projects/dealCatalogApi";
import { contractToForm, emptyDeal, offerToForm } from "@/lib/deals/deal-form";
import { useLeaveGuard } from "@/lib/deals/useLeaveGuard";
import type { DealFormValues, DealMode } from "@/schemas/offers";

type Props = {
  mode: DealMode;
  /** Edit this offer. */
  offerId?: string;
  /** Change this pending project's plans. */
  projectId?: string;
  /** Start with this customer chosen (a new deal from a customer's page). */
  customerId?: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** After a save, with the offer's or project's id. */
  onSaved?: (id: string) => void;
};

export default function DealBuilderDialog({ mode, offerId, projectId, customerId: presetCustomerId, trigger, open: controlled, onOpenChange, onSaved }: Props) {
  const t = useTranslations("Deal");
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
  // A new form each time the dialog opens: nothing from a previous deal leaks in.
  const [session, setSession] = useState(0);
  useLeaveGuard(open && dirty);

  const setOpen = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    onOpenChange?.(next);
    if (next) setSession((s) => s + 1);
    else setDirty(false);
  };
  const requestClose = () => {
    if (busy) return;
    if (dirty) setAskDiscard(true);
    else setOpen(false);
  };

  const offerQ = useGetOfferByIdQuery(offerId ?? "", { skip: !open || !offerId });
  const projectQ = useGetProjectQuery(projectId ?? "", { skip: !open || !projectId });
  const offer = offerId ? offerQ.data?.data : undefined;
  const project = projectId ? projectQ.data?.data : undefined;
  const contract = project?.latestContract ?? null;
  const customerId = offer?.customer.id ?? project?.customerId ?? presetCustomerId ?? "";
  const customerQ = useGetDealCustomerQuery(customerId, { skip: !open || !customerId });
  const customer = customerQ.data?.data ?? null;

  const source = offerId ? offerQ : projectId ? projectQ : null;
  const waiting = Boolean(source?.isLoading) || (Boolean(customerId) && customerQ.isLoading);
  const failed = Boolean(source?.isError);
  const editing = Boolean(offerId || projectId);
  const projectLocked = Boolean(project && (!contract || contract.status !== "pending"));

  // The first values, once the record (and its customer's country) is in.
  const initial = useRef<{ session: number; values: DealFormValues } | null>(null);
  if (open && !waiting && !failed && initial.current?.session !== session) {
    // Prices follow the customer's country; a deal saved for a customer without one keeps its VAT country's.
    const country = customer?.countryCode || offer?.vatCountryCode || contract?.vatCountryCode || "";
    let values: DealFormValues | null = null;
    if (offerId) values = offer ? offerToForm(offer, country) : null;
    else if (projectId) values = project && contract ? contractToForm(project, contract, country) : null;
    else values = { ...emptyDeal(), customerId: presetCustomerId ?? "", countryCode: country, vatCountryCode: "" };
    if (values) initial.current = { session, values };
  }
  useEffect(() => {
    if (!open) initial.current = null;
  }, [open]);

  const title = offerId ? t("titleEditOffer") : projectId ? t("titleEditPlans") : mode === "offer" ? t("titleNewOffer") : t("titleNewProject");
  const ready = initial.current?.session === session ? initial.current.values : null;

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : requestClose())}>
        {trigger && isValidElement(trigger) ? <DialogTrigger render={trigger as ReactElement<Record<string, unknown>>} /> : null}
        <DialogContent size="xl">
          {ready && !projectLocked ? (
            <DealBuilderForm
              key={session}
              mode={mode}
              title={title}
              initial={ready}
              offer={offer}
              project={project}
              customer={customer}
              editing={editing}
              onDirtyChange={setDirty}
              onBusyChange={setBusy}
              onCancel={requestClose}
              onSaved={(id) => {
                setDirty(false);
                setOpen(false);
                onSaved?.(id);
              }}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <DialogBody>
                {failed ? (
                  <ErrorState size="compact" title={t("loadErrorTitle")} description={t("loadErrorBody")} onRetry={() => void source?.refetch()} />
                ) : projectLocked ? (
                  <ErrorState size="compact" title={t("plansLockedTitle")} description={t("plansLockedBody")} />
                ) : (
                  <LoadingState rows={4} label={t("loading")} />
                )}
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={askDiscard}
        onOpenChange={setAskDiscard}
        title={t("discardTitle")}
        impact={t("discardBody")}
        confirmLabel={t("discardConfirm")}
        cancelLabel={t("discardCancel")}
        onConfirm={() => {
          setAskDiscard(false);
          setOpen(false);
        }}
      />
    </>
  );
}
