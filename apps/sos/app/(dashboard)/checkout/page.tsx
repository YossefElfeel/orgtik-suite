"use client";

// Checkout (USR-07 preview, USR-08 pay). The basket is in the address (?plan=<id>&cycle=), so a
// "Choose plan" link opens the same basket. The platform prices it (POST /checkout/preview): the
// lines with any credit for the unused part of the current plan, a bundle discount, a discount
// code, the tax line and the total in the workspace's currency. The owner picks a card (expired
// ones aren't offered), confirms the billing name and pays. A failed payment (402) changes
// nothing and says so; a paid one names its invoice and where to find it. Owner only (spec 05 §1).
import { Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, CreditCard, Tag, X } from "@phosphor-icons/react";
import { Button, buttonVariants, Card, EmptyState, ErrorState, Field, IconButton, Input, LoadingState, PageHeader, RadioGroup, SegmentedControl, Skeleton, useFormatter } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import useUser from "@/hooks/use-user";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";
import type { Localized, PlatformError } from "@/redux/features/platform/platformApi";
import {
  platformError,
  useCheckoutBillingQuery,
  useCheckoutPreviewQuery,
  useConfirmCheckoutMutation,
  type CheckoutDone,
  type CheckoutPreview,
  type ConfirmCheckoutArgs,
  type Cycle,
} from "@/redux/features/platform/tools";
import { openHref } from "@/components/workspace/tools/ToolActions";
import { Notice, useLocalized, useToolsError } from "@/components/workspace/tools/shared";

type PaymentAttempt = {
  version: 1;
  id: string;
  actorId: number;
  actorKey: string;
  workspace: { id: string; name: string; currency: string };
  toolNames: Record<string, Localized>;
  request: Omit<ConfirmCheckoutArgs, "attemptId" | "workspaceId" | "actorId">;
  basket: CheckoutPreview;
};
const ATTEMPT_KEY = "orgtik.sos.checkout-attempt.v1";
let attemptMemory: PaymentAttempt | null | undefined;
function savedAttempt(): PaymentAttempt | "unreadable" | null {
  if (attemptMemory !== undefined) return attemptMemory;
  try {
    const stored = window.sessionStorage.getItem(ATTEMPT_KEY);
    if (!stored) return null;
    const value = JSON.parse(stored) as PaymentAttempt | null;
    if (value === null) return null;
    if (value.version !== 1 || typeof value.id !== "string" || !/^[\w.:-]{1,200}$/.test(value.id) || !Number.isSafeInteger(value.actorId) || typeof value.actorKey !== "string" || typeof value.workspace?.id !== "string" || typeof value.workspace.name !== "string" || typeof value.workspace.currency !== "string" || !Array.isArray(value.request?.items) || !value.request.items.length || value.request.items.some(item => typeof item.planId !== "string" || !["monthly", "yearly"].includes(item.cycle)) || typeof value.request.paymentMethodId !== "string" || typeof value.request.billing?.legalName !== "string" || !Array.isArray(value.basket?.lines) || !Array.isArray(value.basket.paymentMethods) || !Array.isArray(value.basket.gateways) || !value.basket.currency || value.basket.currency !== value.workspace.currency || !Number.isFinite(value.basket.total)) return "unreadable";
    return value;
  } catch { return "unreadable"; }
}
function saveAttempt(value: PaymentAttempt) {
  try {
    window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(value));
    attemptMemory = value;
    return true;
  } catch { return false; }
}
function clearAttempt() {
  attemptMemory = null;
  try { window.sessionStorage.removeItem(ATTEMPT_KEY); }
  catch { try { window.sessionStorage.setItem(ATTEMPT_KEY, "null"); } catch {} }
}

function Row({ label, value, strong, muted }: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-body-lg font-semibold text-fg" : muted ? "text-body-sm text-fg-muted" : "text-body-sm text-fg"}`}>
      <dt className="min-w-0">{label}</dt>
      <dd className="shrink-0 tabular-nums">{value}</dd>
    </div>
  );
}

function Done({ done, preview }: { done: CheckoutDone; preview: CheckoutPreview | undefined }) {
  const t = useTranslations("Tools.checkout");
  const f = useFormatter();
  const loc = useLocalized();
  const ws = useWorkspace();
  const first = preview?.lines[0];
  const tool = ws.me?.tools.find((x) => x.key === first?.tool);
  const activated = (preview?.lines ?? []).map(line => ws.me?.tools.find(item => item.key === line.tool)).filter(item => item !== undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <Card padding="lg" className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <CheckCircle aria-hidden="true" weight="fill" className="size-8 shrink-0 text-success" />
        <div className="flex flex-col gap-1">
          <h2 ref={heading} tabIndex={-1} className="font-display text-title text-fg outline-none">
            {t("doneTitle")}
          </h2>
          <p className="text-body text-fg-muted">{(preview?.lines.length ?? 0) > 1 ? t("doneBodyMany", { count: preview!.lines.length }) : tool && first ? t("doneBody", { tool: loc(tool.name), plan: loc(first.name) }) : t("doneBodyShort")}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-2 rounded-field bg-sunken p-4">
        <Row label={t("invoiceNumber")} value={<span dir="ltr" data-invoice-number>{done.invoice.number}</span>} />
        <Row label={t("paid")} value={<span dir="ltr">{f.money(done.invoice.total, done.invoice.currency)}</span>} />
      </dl>
      <p className="text-body-sm text-fg-muted">
        {t.rich("whereInvoice", { link: (c) => <Link href="/billing/invoices" className="font-medium text-fg-brand underline underline-offset-4">{c}</Link> })}
      </p>
      <div className="flex flex-wrap gap-2">
        {activated.map((item, index) => { const open = openHref(item.scope); return open ? <Link key={item.key} href={open} className={buttonVariants({ variant: index === 0 ? "primary" : "secondary" })}>{t("openTool", { tool: loc(item.name) })}</Link> : null; })}
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          {t("toHome")}
        </Link>
      </div>
    </Card>
  );
}

function Checkout() {
  const t = useTranslations("Tools.checkout");
  const tp = useTranslations("Tools.plans");
  const te = useTranslations("Tools.errors");
  const f = useFormatter();
  const loc = useLocalized();
  const errorText = useToolsError();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const ws = useWorkspace();
  const identity = useUser();
  const [storedAttempt, setStoredAttempt] = useState<PaymentAttempt | "unreadable" | null>(null);
  const [restored, setRestored] = useState(false);
  const pending = storedAttempt === "unreadable" ? null : storedAttempt;
  useEffect(() => { setStoredAttempt(savedAttempt()); setRestored(true); }, []);
  const planIds = pending ? pending.request.items.map(item => item.planId) : search.getAll("plan").filter(Boolean);
  const planId = planIds[0] ?? null;
  const cycle: Cycle = pending?.request.items[0].cycle ?? (search.get("cycle") === "yearly" ? "yearly" : "monthly");

  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [pmId, setPmId] = useState<string | null>(null);
  const [legalName, setLegalName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState<PlatformError | null>(null);
  const [done, setDone] = useState<{ result: CheckoutDone; basket: CheckoutPreview } | null>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const body = { items: planIds.map(planId => ({ planId, cycle })), ...(coupon ? { coupon } : {}) };
  const preview = useCheckoutPreviewQuery(body, { skip: !restored || Boolean(storedAttempt) || !planId || Boolean(done), refetchOnMountOrArgChange: true });
  const billing = useCheckoutBillingQuery(undefined, { skip: !restored || Boolean(storedAttempt) });
  const [confirm, { isLoading: paying }] = useConfirmCheckoutMutation();
  const p = pending?.basket ?? preview.data;
  const locked = Boolean(pending) || paying;
  const sameContext = !pending || String(identity.user?.id) === String(pending.actorId) && ws.me?.user.key === pending.actorKey && String(ws.me?.user.id) === String(pending.actorId) && ws.me?.workspace.id === pending.workspace.id;

  // The default card, once the methods are known; the saved billing name, once.
  useEffect(() => {
    if (pending) { setPmId(pending.request.paymentMethodId); setLegalName(pending.request.billing.legalName); setCodeInput(pending.request.coupon ?? ""); return; }
    if (p && (!pmId || !p.paymentMethods.some((m) => m.id === pmId))) setPmId(p.paymentMethods.find((m) => m.isDefault)?.id ?? p.paymentMethods[0]?.id ?? null);
  }, [p, pmId, pending]);
  useEffect(() => {
    if (!pending && billing.data && legalName === null) setLegalName(billing.data.legalName ?? "");
  }, [billing.data, legalName, pending]);
  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);
  useEffect(() => {
    if (!p?.quoteId || pending || done) return;
    const timer = window.setTimeout(() => {
      setFailure({ status: 410, code: "quote_expired", message: "" });
      void preview.refetch();
    }, (p.expiresIn ?? 900) * 1000);
    return () => window.clearTimeout(timer);
  }, [p?.quoteId, p?.expiresIn, pending, done, preview.refetch]);

  if (!restored) return <LoadingState rows={5} />;
  if (storedAttempt === "unreadable") return <ErrorState titleAs="h1" title={t("unconfirmedTitle")} description={t("savedRecoveryError")} action={<Link href="/billing/invoices" className={buttonVariants({ variant: "secondary" })}>{t("reviewInvoices")}</Link>} />;
  if (pending && (identity.user && String(identity.user.id) !== String(pending.actorId) || ws.me && ws.me.user.key !== pending.actorKey)) return <ErrorState titleAs="h1" title={t("unconfirmedTitle")} description={t("recoveryAccountMismatch")} action={<Link href="/" className={buttonVariants({ variant: "secondary" })}>{t("toHome")}</Link>} />;
  if (!planId) {
    return (
      <EmptyState
        titleAs="h1"
        size="page"
        title={t("emptyTitle")}
        description={t("emptyBody")}
        action={
          <Link href="/tools" className={buttonVariants({ variant: "primary" })}>
            {t("toTools")}
          </Link>
        }
      />
    );
  }
  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} />
        <Done done={done.result} preview={done.basket} />
      </div>
    );
  }
  const pe = platformError(preview.error);
  if (!pending && pe && !p) {
    return (
      <ErrorState
        titleAs="h1"
        title={t("cantBuyTitle")}
        description={pe.status === 422 ? errorText(pe) : undefined}
        onRetry={pe.status === 422 ? undefined : preview.refetch}
        action={
          <Link href="/tools" className={buttonVariants({ variant: "secondary" })}>
            {t("toTools")}
          </Link>
        }
      />
    );
  }

  const setCycle = (c: Cycle) => {
    if (locked) return;
    const q = new URLSearchParams(search.toString());
    q.set("cycle", c);
    router.replace(`${pathname}?${q}`, { scroll: false });
  };
  const applyCode = (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const code = codeInput.trim().toUpperCase();
    setCoupon(code || null);
  };
  const couponError = coupon && p?.couponError && !preview.isFetching ? te(p.couponError as "coupon_invalid") : undefined;
  const toolOf = (key: string) => ws.me?.tools.find((x) => x.key === key);
  const firstTool = p ? toolOf(p.lines[0]?.tool) : undefined;
  const cur = p?.currency ?? ws.me?.workspace.currency ?? "";
  const money = (n: number, minus = false) => <span dir="ltr">{minus && n > 0 ? "−" : ""}{f.money(n, cur)}</span>;
  const credit = p?.lines.reduce((s, l) => s + l.credit, 0) ?? 0;
  // Buying the plan the tool is already on starts a new period now (the unused part is credited).
  const already = !pending && planIds.length === 1 && firstTool?.line && firstTool.line.planId === planId && firstTool.line.state === "active";

  const pay = async () => {
    if (busy.current || !sameContext || !ws.me || !ws.isOwner) return;
    setFailure(null);
    setNameError(null);
    const name = (pending?.request.billing.legalName ?? legalName ?? "").trim();
    if (!name) {
      setNameError(t("nameRequired"));
      document.getElementById("billing-name")?.focus();
      return;
    }
    if ((!pending && !pmId) || !p) return;
    const original = pending;
    const attempt: PaymentAttempt = original ?? {
      version: 1,
      id: crypto.randomUUID(),
      actorId: ws.me.user.id,
      actorKey: ws.me.user.key,
      workspace: { id: ws.me.workspace.id, name: ws.me.workspace.name, currency: ws.me.workspace.currency },
      toolNames: Object.fromEntries(ws.me.tools.map(tool => [tool.key, tool.name])),
      request: { items: body.items, ...(p.coupon ? { coupon: p.coupon.code } : {}), ...(p.quoteId ? { quoteId: p.quoteId } : {}), paymentMethodId: pmId!, billing: { legalName: name } },
      basket: p,
    };
    // Persist before sending: a reload may interrupt a response after the server has charged.
    if (!original && !saveAttempt(attempt)) {
      setFailure({ status: "offline", code: "recovery_storage_unavailable", message: "" });
      return;
    }
    busy.current = true;
    setStoredAttempt(attempt);
    try {
      const r = await confirm({ ...attempt.request, attemptId: attempt.id, workspaceId: attempt.workspace.id, actorId: attempt.actorId }).unwrap();
      clearAttempt();
      setStoredAttempt(null);
      setDone({ result: r, basket: attempt.basket });
      window.scrollTo({ top: 0 });
    } catch (err) {
      const e = platformError(err) ?? { status: "offline", code: "offline", message: "" };
      const knownRejection = e.code === "payment_failed" || !original && typeof e.status === "number" && e.status >= 400 && e.status < 500 && e.code !== "operation_conflict";
      if (knownRejection) { clearAttempt(); setStoredAttempt(null); }
      if (e?.fieldErrors?.["billing.legalName"]) setNameError(t("nameRequired"));
      else setFailure(e);
    } finally { busy.current = false; }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: t("toolsCrumb"), href: "/tools" }, ...(firstTool ? [{ label: loc(firstTool.name), href: `/tools/${firstTool.key}` }] : []), { label: t("title") }]}
        title={t("title")}
        description={pending ? t("description", { workspace: pending.workspace.name }) : ws.me ? t("description", { workspace: ws.me.workspace.name }) : undefined}
      />
      {pending ? <Notice tone="warning" title={t("recoveryWorkspace", { workspace: pending.workspace.name })}>{t(sameContext ? "recoveryLocked" : "recoveryContextMismatch", { workspace: pending.workspace.name })}</Notice> : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* The order: what's bought, for how long, and a discount code. */}
        <div className="flex flex-col gap-6">
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-title-sm text-fg">{t("order")}</h2>
              {!p?.lines.every(line => line.contractedCapacity) ? <SegmentedControl
                size="sm"
                label={tp("cycle")}
                value={cycle}
                onValueChange={setCycle}
                segments={[
                  { value: "monthly", label: tp("monthly"), disabled: locked },
                  { value: "yearly", label: tp("yearly"), disabled: locked },
                ]}
              /> : null}
            </div>
            {already && firstTool ? <Notice tone="info">{t("alreadyOnPlan", { tool: loc(firstTool.name) })}</Notice> : null}
            {!p ? (
              <div aria-busy="true" className="flex flex-col gap-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {p.lines.map((l) => {
                  const tool = toolOf(l.tool);
                  return (
                    <li key={l.planId} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="font-semibold text-fg">{t("lineName", { tool: pending?.toolNames?.[l.tool] ? loc(pending.toolNames[l.tool]) : tool ? loc(tool.name) : l.tool, plan: loc(l.name) })}</p>
                        <p className="shrink-0 tabular-nums text-fg">{money(l.amount)}</p>
                      </div>
                      <p className="text-body-sm text-fg-muted">
                        {l.contractedCapacity ? t("contractCapacity", { count: l.contractedCapacity, cycle: tp(l.cycle) }) : l.quantity > 1 ? t.rich(`perSeat.${l.cycle}`, { count: l.quantity, amount: f.money(l.unit, cur), unit: (c) => <span dir="ltr">{c}</span> }) : t(`billed.${l.cycle}`)}
                      </p>
                      {l.credit > 0 ? (
                        <div className="flex items-baseline justify-between gap-4 text-body-sm text-success">
                          <p>{t("credit")}</p>
                          <p className="shrink-0 tabular-nums">{money(l.credit, true)}</p>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card padding="md" className="flex flex-col gap-3">
            <h2 className="font-display text-title-sm text-fg">{t("codeTitle")}</h2>
            {p?.coupon ? (
              <div className="flex items-center justify-between gap-3 rounded-field bg-success-subtle px-3 py-2 text-body-sm text-fg">
                <span className="flex items-center gap-2">
                  <Tag aria-hidden="true" className="size-4 text-success" />
                  {t.rich("codeApplied", { code: p.coupon.code, c: (x) => <bdi dir="ltr" className="font-semibold">{x}</bdi> })}
                </span>
                <IconButton
                  size="sm"
                  variant="ghost"
                  label={t("removeCode")}
                  icon={<X />}
                  disabled={locked}
                  onClick={() => {
                    setCoupon(null);
                    setCodeInput("");
                  }}
                />
              </div>
            ) : (
              <form onSubmit={applyCode} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <Field label={t("codeLabel")} error={couponError} className="flex-1">
                  <Input name="coupon" disabled={locked} value={codeInput} onChange={(e) => setCodeInput(e.target.value)} autoComplete="off" spellCheck={false} dir="ltr" className="uppercase" />
                </Field>
                <Button type="submit" variant="secondary" disabled={locked} loading={preview.isFetching && Boolean(coupon)} className="sm:mt-7">
                  {t("apply")}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* The total and paying. */}
        <Card padding="md" className="flex flex-col gap-5 lg:sticky lg:top-4">
          <h2 className="font-display text-title-sm text-fg">{t("summary")}</h2>
          {!p ? (
            <LoadingState rows={3} />
          ) : (
            <>
              <dl className="flex flex-col gap-2" aria-busy={preview.isFetching}>
                <Row label={t("subtotal")} value={money(p.lines.reduce((sum, l) => sum + l.amount, 0))} />
                {credit > 0 ? <Row muted label={t("creditIncluded")} value={money(credit, true)} /> : null}
                {(p.accountCreditUsed ?? 0) > 0 ? <Row muted label={t("accountCreditApplied")} value={money(p.accountCreditUsed!, true)} /> : null}
                {p.bundle && p.bundleDiscount > 0 ? <Row label={t("bundle", { name: loc(p.bundle.name), pct: p.bundle.pct })} value={money(p.bundleDiscount, true)} /> : null}
                {p.coupon ? <Row label={t.rich("coupon", { code: p.coupon.code, c: (x) => <bdi dir="ltr">{x}</bdi> })} value={money(p.couponDiscount, true)} /> : null}
                <Row label={t(p.reverseCharge ? "taxReverseCharge" : p.taxDisplay === "inclusive" ? "taxInclusive" : "taxExclusive", { rate: f.percent((p.taxRate ?? 0) / 100) })} value={money(p.tax)} />
                <div className="my-1 border-t border-line" />
                <Row strong label={t("total")} value={<span data-total>{money(p.total)}</span>} />
              </dl>
              <p className="text-caption text-fg-muted">{t(p.reverseCharge ? "taxReverseChargeNote" : p.taxRate === 0 ? "taxNoneNote" : p.taxDisplay === "inclusive" ? "taxInclusiveNote" : "taxExclusiveNote", { rate: f.percent((p.taxRate ?? 0) / 100) })}</p>
              {(p.creditRemaining ?? 0) > 0 ? <Notice tone="info">{t("creditCarried", { amount: f.money(p.creditRemaining!, cur) })}</Notice> : null}

              <Field label={t("paymentMethod")} group error={failure?.fieldErrors?.paymentMethodId ? te("paymentMethodId") : undefined}>
                {p.paymentMethods.length ? (
                  <RadioGroup
                    disabled={locked}
                    value={pmId ?? ""}
                    onValueChange={(v) => setPmId(v)}
                    options={p.paymentMethods.map((m) => ({
                      value: m.id,
                      label: (
                        <span className="flex flex-wrap items-center gap-x-2">
                          <CreditCard aria-hidden="true" className="size-4" />
                          <bdi dir="ltr">{`${m.brand} •••• ${m.last4}`}</bdi>
                          {m.isDefault ? <span className="text-fg-muted">{t("default")}</span> : null}
                        </span>
                      ),
                      description: t("expires", { date: m.expires }),
                    }))}
                  />
                ) : (
                  <p className="text-body-sm text-fg-muted">{t("noMethods")}</p>
                )}
              </Field>
              {!locked ? <Link href="/billing/payment-methods" className="-mt-2 self-start text-body-sm font-medium text-fg-brand underline underline-offset-4">{t("addMethod")}</Link> : null}

              <Field label={t("billingName")} description={t("billingNameHelp")} required error={nameError ?? undefined}>
                <Input id="billing-name" required value={pending?.request.billing.legalName ?? legalName ?? ""} onChange={(e) => setLegalName(e.target.value)} disabled={locked || billing.isLoading} autoComplete="organization" />
              </Field>

              {billing.data && billing.data.currencyLocked === false ? <Notice tone="warning">{t("currencyLock", { currency: cur })}</Notice> : null}

              {pending && !paying ? (
                <div ref={failureRef} tabIndex={-1} role="status" aria-live="polite" className="outline-none">
                  <Notice tone="warning" title={t("unconfirmedTitle")}>{t("unconfirmedBody")}{failure && failure.status !== "offline" ? <p className="mt-2">{["quote_expired", "quote_not_found", "checkout_changed", "quote_used"].includes(failure.code) ? t("recoveryQuoteBlocked") : errorText(failure)}</p> : null}</Notice>
                </div>
              ) : failure && !paying ? (
                <div ref={failureRef} tabIndex={-1} className="outline-none">
                  {failure.code === "payment_failed" ? (
                    <Notice tone="danger" title={t("failedTitle")}>
                      {t("failedBody")}
                      {failure.extra?.reason === "card_declined" ? ` ${t("declined")}` : ""}
                    </Notice>
                  ) : ["quote_expired", "quote_not_found", "checkout_changed", "quote_used"].includes(failure.code) ? (
                    <Notice tone="warning" title={t(failure.code === "quote_expired" ? "quoteExpiredTitle" : "quoteReviewTitle")}>
                      {t(failure.code === "quote_expired" ? "quoteExpiredBody" : "quoteReviewBody")}
                    </Notice>
                  ) : (
                    <Notice tone="danger" title={t("notPaidTitle")}>
                      {failure.code === "recovery_storage_unavailable" ? t("recoveryStorageError") : errorText(failure)}
                    </Notice>
                  )}
                </div>
              ) : null}

              <Button size="lg" variant="primary" loading={paying} disabled={!sameContext || !ws.isOwner || !pmId || (!pending && preview.isFetching)} onClick={pay}>
                {pending ? t("recoverPayment") : t("pay", { total: f.money(p.total, cur) })}
              </Button>
              <p className="text-caption text-fg-muted">{t(`renews.${cycle}`)}</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <RequireWorkspaceRole role="owner">
        <Checkout />
      </RequireWorkspaceRole>
    </Suspense>
  );
}
