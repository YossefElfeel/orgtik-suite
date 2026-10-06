// The deal builder's form: its empty state, how a saved offer or contract becomes a form, how the
// form becomes the API's body, and the price preview of each line.
import { num } from "@/lib/deals/format";
import { customListTotal, line, type PricedLine } from "@/lib/deals/pricing";
import type { DealCatalog } from "@/lib/deals/catalog";
import { NO_VAT, type DealCustomLine, type DealFormValues, type DealStandardLine } from "@/schemas/offers";
import type { OfferDetail } from "@/types/offers";
import { isInstallment, type ContractDetail, type DealCustomPlanDTO, type DealPlanSelectionDTO, type ProjectDetail } from "@/types/projects";

let seq = 0;
export const newKey = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`;

export const emptyDeal = (): DealFormValues => ({
  customerId: "",
  countryCode: "",
  projectName: "",
  projectDescription: "",
  priority: "medium",
  standard: [],
  custom: [],
  vatCountryCode: "",
  note: "",
  couponCode: "",
});

export const newStandardLine = (planId: string, name: string, durationId: string): DealStandardLine => ({
  key: newKey(),
  planId,
  durationId,
  durationMonths: null,
  payment: "cash",
  installmentId: "",
  installmentMonths: null,
  keptTotal: null,
  name,
});

export const newCustomLine = (label: string): DealCustomLine => ({
  key: newKey(),
  label,
  featureIds: [],
  durationId: "",
  durationMonths: null,
  payment: "cash",
  installmentId: "",
  installmentMonths: null,
  keptTotal: null,
  locked: false,
});

/**
 * An offer as a form. Each line keeps the price it was quoted at (`keptTotal`), its months and its
 * installment term, and the VAT country stays the offer's (SAL-009, SAL-010). The API doesn't send
 * a custom plan's features yet; such a plan is kept as it is (locked) unless the API sends them.
 */
export function offerToForm(offer: OfferDetail, countryCode: string): DealFormValues {
  const standard: DealStandardLine[] = [];
  const custom: DealCustomLine[] = [];
  for (const l of offer.summary.lines) {
    const installment = isInstallment(l.paymentMethod);
    const common = {
      key: newKey(),
      durationId: l.durationId ?? "",
      durationMonths: l.durationMonths ?? null,
      payment: installment ? ("installment" as const) : ("cash" as const),
      installmentId: installment ? (l.installmentDurationId ?? "") : "",
      installmentMonths: installment ? (l.installmentMonths ?? null) : null,
      keptTotal: num(l.total) || null,
    };
    if (l.isCustom) {
      const featureIds = l.featureIds ?? [];
      custom.push({ ...common, label: l.customLabel || l.planName, featureIds, locked: featureIds.length === 0 });
    } else {
      standard.push({ ...common, planId: l.planId, name: l.planName });
    }
  }
  return {
    ...emptyDeal(),
    customerId: offer.customer.id,
    countryCode,
    standard,
    custom,
    vatCountryCode: offer.vatCountryCode || NO_VAT,
    note: offer.noteToCustomer ?? "",
  };
}

/** A pending project's contract as a form, to change its plans. Lines keep their agreed price. */
export function contractToForm(project: ProjectDetail, contract: ContractDetail, countryCode: string): DealFormValues {
  const standard: DealStandardLine[] = [];
  const custom: DealCustomLine[] = [];
  for (const l of contract.plans ?? []) {
    const installment = isInstallment(l.paymentMethod);
    const common = {
      key: newKey(),
      durationId: l.durationId ?? "",
      durationMonths: l.durationMonths ?? null,
      payment: installment ? ("installment" as const) : ("cash" as const),
      installmentId: installment ? (l.installmentDurationId ?? "") : "",
      installmentMonths: installment ? (l.installmentMonths ?? null) : null,
      keptTotal: num(l.price) || null,
    };
    if (l.isCustom) custom.push({ ...common, label: l.planName, featureIds: l.features.map((f) => f.id), locked: false });
    else standard.push({ ...common, planId: l.planId ?? "", name: l.planName });
  }
  return {
    ...emptyDeal(),
    // An internal project has no customer; the builder only changes its plans.
    customerId: project.customerId ?? project.id,
    countryCode,
    projectName: project.projectName,
    projectDescription: project.projectDescription ?? "",
    priority: project.priority,
    standard,
    custom,
    vatCountryCode: contract.vatCountryCode || NO_VAT,
    couponCode: contract.couponCode ?? "",
  };
}

const vatOf = (v: string) => (v && v !== NO_VAT ? v : undefined);

export function toPlanSelections(values: DealFormValues): DealPlanSelectionDTO[] {
  return values.standard.map((l) => ({
    planId: l.planId,
    ...(l.durationId ? { durationId: l.durationId } : {}),
    ...(l.durationMonths ? { durationMonths: l.durationMonths } : {}),
    paymentMethod: l.payment,
    ...(l.payment === "installment"
      ? { ...(l.installmentId ? { installmentDurationId: l.installmentId } : {}), ...(l.installmentMonths ? { installmentMonths: l.installmentMonths } : {}) }
      : {}),
    ...(l.keptTotal ? { priceOverride: l.keptTotal } : {}),
  }));
}

export function toCustomPlans(values: DealFormValues): DealCustomPlanDTO[] {
  return values.custom.map((l) => ({
    label: l.label.trim(),
    featureIds: l.featureIds,
    ...(l.durationId ? { durationId: l.durationId } : {}),
    ...(l.durationMonths ? { durationMonths: l.durationMonths } : {}),
    paymentMethod: l.payment,
    ...(l.payment === "installment"
      ? { ...(l.installmentId ? { installmentDurationId: l.installmentId } : {}), ...(l.installmentMonths ? { installmentMonths: l.installmentMonths } : {}) }
      : {}),
    ...(l.keptTotal ? { priceOverride: l.keptTotal } : {}),
  }));
}

export const vatCountryOf = vatOf;

/** What decides the price: when it hasn't changed, an edit doesn't resend the plans at all. */
export const priceSignature = (v: DealFormValues) =>
  JSON.stringify({
    s: v.standard.map((l) => [l.planId, l.durationId, l.durationMonths, l.payment, l.installmentId, l.installmentMonths, l.keptTotal]),
    c: v.custom.map((l) => [l.label.trim(), [...l.featureIds].sort(), l.durationId, l.durationMonths, l.payment, l.installmentId, l.installmentMonths, l.keptTotal]),
    v: v.vatCountryCode,
    k: v.couponCode.trim(),
  });

/** A standard line's duration and installment term, from its plan's API prices. */
export function standardChoice(l: DealStandardLine, catalog: DealCatalog) {
  const prices = catalog.planById.get(l.planId)?.resolvedPrice ?? [];
  const duration = prices.find((p) => p.duration.durationId === l.durationId) ?? (l.durationMonths ? prices.find((p) => p.duration.months === l.durationMonths) : undefined);
  const term =
    l.payment === "installment"
      ? (duration?.installments.find((i) => i.durationId === l.installmentId) ??
        (l.installmentMonths ? duration?.installments.find((i) => i.months === l.installmentMonths) : undefined))
      : undefined;
  return { prices, duration, term };
}

export function customChoice(l: DealCustomLine, catalog: DealCatalog) {
  const duration = catalog.durations.find((d) => d.id === l.durationId) ?? (l.durationMonths ? catalog.durations.find((d) => d.months === l.durationMonths) : undefined);
  const term =
    l.payment === "installment"
      ? (catalog.terms.find((d) => d.id === l.installmentId) ?? (l.installmentMonths ? catalog.terms.find((d) => d.months === l.installmentMonths) : undefined))
      : undefined;
  const features = l.featureIds.map((id) => catalog.featureById.get(id)).filter((f): f is NonNullable<typeof f> => Boolean(f));
  return { duration, term, features };
}

/** The preview of each line. A line that can't be priced yet (no duration chosen) is left out. */
export function priceLines(values: DealFormValues, catalog: DealCatalog, currency: string): { lines: PricedLine[]; unpriced: number } {
  const lines: PricedLine[] = [];
  let unpriced = 0;
  for (const l of values.standard) {
    const { duration, term } = standardChoice(l, catalog);
    const months = duration?.duration.months ?? l.durationMonths ?? 0;
    if (!duration && !l.keptTotal) {
      unpriced += 1;
      continue;
    }
    lines.push(
      line({
        key: l.key,
        name: l.name,
        isCustom: false,
        months,
        discountPercent: num(duration?.discountPercentage),
        listTotal: num(duration?.discountedTotal),
        keptTotal: l.keptTotal,
        payment: l.payment,
        installmentMonths: term?.months ?? l.installmentMonths,
        markupPercent: num(term?.markupPercentage),
        currency,
      }),
    );
  }
  for (const l of values.custom) {
    const { duration, term, features } = customChoice(l, catalog);
    if ((!duration || !features.length) && !l.keptTotal) {
      unpriced += 1;
      continue;
    }
    lines.push(
      line({
        key: l.key,
        name: l.label,
        isCustom: true,
        months: duration?.months ?? l.durationMonths ?? 0,
        discountPercent: num(duration?.percentage),
        listTotal: duration ? customListTotal(features, duration, currency) : 0,
        keptTotal: l.keptTotal,
        payment: l.payment,
        installmentMonths: term?.months ?? l.installmentMonths,
        markupPercent: num(term?.percentage),
        currency,
      }),
    );
  }
  return { lines, unpriced };
}
