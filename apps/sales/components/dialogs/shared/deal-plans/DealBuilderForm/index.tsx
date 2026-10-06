"use client";

// The deal builder's form and steps. Prices come from the API's catalog for the customer's country;
// the API prices the deal again when it is saved. See DealBuilderDialog for the whole flow.
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button, DialogBody, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Stepper, type Step } from "@orgtik/ui";
import DealCustomerStep from "@/components/dialogs/shared/deal-plans/DealCustomerStep";
import DealPlansStep from "@/components/dialogs/shared/deal-plans/DealPlansStep";
import DealTermsStep from "@/components/dialogs/shared/deal-plans/DealTermsStep";
import DealReviewStep from "@/components/dialogs/shared/deal-plans/DealReviewStep";
import { useCreateOfferMutation, useUpdateOfferMutation } from "@/redux/features/offers/offersApi";
import { useCreateProjectMutation, useSetProjectPlansMutation } from "@/redux/features/projects/projectsApi";
import { useDealCatalog } from "@/lib/deals/catalog";
import { priceSignature, toCustomPlans, toPlanSelections } from "@/lib/deals/deal-form";
import { buildDealSchema, DEAL_STEP_FIELDS, NO_VAT, type DealFormValues, type DealMode } from "@/schemas/offers";
import type { OfferDetail } from "@/types/offers";
import type { DealCustomer, ProjectDetail } from "@/types/projects";

type StepId = keyof typeof DEAL_STEP_FIELDS;

type Props = {
  mode: DealMode;
  title: string;
  initial: DealFormValues;
  offer?: OfferDetail;
  project?: ProjectDetail;
  customer: DealCustomer | null;
  editing: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  onCancel: () => void;
  onSaved: (id: string) => void;
};

export default function DealBuilderForm({ mode, title, initial, offer, project, customer: initialCustomer, editing, onDirtyChange, onBusyChange, onCancel, onSaved }: Props) {
  const t = useTranslations("Deal");
  const schema = useMemo(() => buildDealSchema((k) => t(k), mode), [t, mode]);
  const form = useForm<DealFormValues>({ resolver: zodResolver(schema), defaultValues: initial, mode: "onTouched" });
  const [customer, setCustomer] = useState<DealCustomer | null>(initialCustomer);
  const [busy, setBusy] = useState(false);
  const contract = project?.latestContract ?? null;
  const plansEdit = Boolean(project);

  const steps: StepId[] = plansEdit ? ["plans", "terms", "review"] : ["customer", "plans", "terms", "review"];
  const [index, setIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const current = steps[index];

  const countryCode = form.watch("countryCode");
  const catalog = useDealCatalog(countryCode || null, offer?.currencyCode ?? contract?.currency ?? null);
  // An edit keeps the record's zone and currency; a new deal takes the country's.
  const currency = offer?.currencyCode ?? contract?.currency ?? catalog.currency ?? "";

  // An offer's custom plan without its features can't be sent back: its plans and VAT stay as they are.
  const custom = form.watch("custom");
  const lockedReason = custom.some((c) => c.locked) ? t("lockedCustom") : null;

  const { isDirty } = form.formState;
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const initialSignature = useMemo(() => priceSignature(initial), [initial]);
  const [createOffer] = useCreateOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();
  const [createProject] = useCreateProjectMutation();
  const [setProjectPlans] = useSetProjectPlansMutation();

  const stepHasErrors = (id: StepId) => {
    const errors = form.formState.errors;
    return (DEAL_STEP_FIELDS[id] as readonly (keyof DealFormValues)[]).some((f) => Boolean(errors[f]));
  };
  const validate = (id: StepId) => form.trigger([...DEAL_STEP_FIELDS[id]] as (keyof DealFormValues)[], { shouldFocus: true });

  const goTo = async (target: number) => {
    if (target <= index) {
      setIndex(target);
      return;
    }
    for (let i = index; i < target; i++) {
      if (!(await validate(steps[i]))) {
        setIndex(i);
        return;
      }
    }
    setIndex(target);
    setReached((r) => Math.max(r, target));
  };

  const vatToSend = (v: DealFormValues) => (v.vatCountryCode === NO_VAT ? "" : v.vatCountryCode);

  const save = async (v: DealFormValues) => {
    setBusy(true);
    try {
      const plans = { planSelections: toPlanSelections(v), customPlans: toCustomPlans(v) };
      if (mode === "offer" && offer) {
        // Nothing that sets the price changed: send only the note, so nothing is re-priced (SAL-010).
        const priced = priceSignature(v) !== initialSignature;
        const body = priced
          ? { zoneId: offer.zoneId ?? undefined, vatCountryCode: vatToSend(v), noteToCustomer: v.note, ...plans }
          : { noteToCustomer: v.note };
        const res = await updateOffer({ offerId: offer.id, body }).unwrap();
        onSaved(res.data?.id ?? offer.id);
      } else if (mode === "offer") {
        const res = await createOffer({ customerId: v.customerId, countryCode: v.countryCode, vatCountryCode: vatToSend(v), noteToCustomer: v.note, ...plans }).unwrap();
        onSaved(res.data.id);
      } else if (project) {
        await setProjectPlans({
          id: project.id,
          body: { zoneId: contract?.zoneId ?? undefined, vatCountryCode: vatToSend(v), couponCode: v.couponCode.trim() || undefined, ...plans },
        }).unwrap();
        onSaved(project.id);
      } else {
        const res = await createProject({
          projectName: v.projectName.trim(),
          projectDescription: v.projectDescription.trim(),
          projectType: "client_project",
          priority: v.priority,
          customerId: v.customerId,
          countryCode: v.countryCode,
          vatCountryCode: vatToSend(v),
          couponCode: v.couponCode.trim() || undefined,
          ...plans,
        }).unwrap();
        onSaved(res.data.id);
      }
    } catch {
      // The form stays as it is; the request's toast says why (SAL-008).
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = form.handleSubmit(save, () => {
    // Back to the first step with a problem.
    const bad = steps.findIndex((s) => stepHasErrors(s));
    if (bad >= 0) setIndex(bad);
  });

  const stepLabel: Record<StepId, string> = {
    customer: mode === "project" ? t("stepProject") : t("stepCustomer"),
    plans: t("stepPlans"),
    terms: t("stepTerms"),
    review: t("stepReview"),
  };
  const stepperSteps: Step[] = steps.map((id, i) => ({
    id,
    label: stepLabel[id],
    state: i === index ? "current" : i <= reached && stepHasErrors(id) ? "error" : i <= reached ? "complete" : "upcoming",
  }));

  const last = index === steps.length - 1;
  const submitLabel = mode === "offer" ? (offer ? t("saveOffer") : t("sendOffer")) : project ? t("savePlans") : t("createProject");

  return (
    <form
      className="contents"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (last) void onSubmit();
        else void goTo(index + 1);
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{mode === "offer" ? t("descriptionOffer") : t("descriptionProject")}</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-6 text-start">
        <Stepper steps={stepperSteps} label={t("stepsLabel")} lockedHint={t("stepLocked")} onStepClick={(id) => void goTo(steps.indexOf(id as StepId))} />
        {current === "customer" ? (
          <DealCustomerStep form={form} mode={mode} locked={editing} customer={customer} onCustomer={setCustomer} />
        ) : current === "plans" ? (
          <DealPlansStep form={form} catalog={catalog} currency={currency} lockedReason={lockedReason} />
        ) : current === "terms" ? (
          <DealTermsStep form={form} mode={mode} catalog={catalog} lockedReason={lockedReason} />
        ) : (
          <DealReviewStep
            form={form}
            mode={mode}
            catalog={catalog}
            currency={currency}
            customer={customer}
            signedContract={Boolean(contract?.isSigntuerd)}
          />
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
          {t("cancel")}
        </Button>
        {index > 0 ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => setIndex(index - 1)}>
            {t("back")}
          </Button>
        ) : null}
        <Button type="submit" variant="primary" loading={busy}>
          {last ? submitLabel : t("next")}
        </Button>
      </DialogFooter>
    </form>
  );
}
