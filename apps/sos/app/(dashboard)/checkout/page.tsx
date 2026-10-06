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
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";
import type { PlatformError } from "@/redux/features/platform/platformApi";
import {
  platformError,
  useCheckoutBillingQuery,
  useCheckoutPreviewQuery,
  useConfirmCheckoutMutation,
  type CheckoutDone,
  type CheckoutPreview,
  type Cycle,
} from "@/redux/features/platform/tools";
import { openHref } from "@/components/workspace/tools/ToolActions";
import { Notice, useLocalized, useToolsError } from "@/components/workspace/tools/shared";

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
  const open = openHref(tool?.scope);
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
          <p className="text-body text-fg-muted">{tool && first ? t("doneBody", { tool: loc(tool.name), plan: loc(first.name) }) : t("doneBodyShort")}</p>
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
        {open && tool ? (
          <Link href={open} className={buttonVariants({ variant: "primary" })}>
            {t("openTool", { tool: loc(tool.name) })}
          </Link>
        ) : null}
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
  const planId = search.get("plan");
  const cycle: Cycle = search.get("cycle") === "yearly" ? "yearly" : "monthly";

  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [pmId, setPmId] = useState<string | null>(null);
  const [legalName, setLegalName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState<PlatformError | null>(null);
  const [done, setDone] = useState<{ result: CheckoutDone; basket: CheckoutPreview } | null>(null);
  const failureRef = useRef<HTMLDivElement>(null);

  const body = { items: planId ? [{ planId, cycle }] : [], ...(coupon ? { coupon } : {}) };
  const preview = useCheckoutPreviewQuery(body, { skip: !planId || Boolean(done) });
  const billing = useCheckoutBillingQuery();
  const [confirm, { isLoading: paying }] = useConfirmCheckoutMutation();
  const p = preview.data;

  // The default card, once the methods are known; the saved billing name, once.
  useEffect(() => {
    if (p && (!pmId || !p.paymentMethods.some((m) => m.id === pmId))) setPmId(p.paymentMethods.find((m) => m.isDefault)?.id ?? p.paymentMethods[0]?.id ?? null);
  }, [p, pmId]);
  useEffect(() => {
    if (billing.data && legalName === null) setLegalName(billing.data.legalName ?? "");
  }, [billing.data, legalName]);
  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);

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
  if (pe && !p) {
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
    const q = new URLSearchParams(search.toString());
    q.set("cycle", c);
    router.replace(`${pathname}?${q}`, { scroll: false });
  };
  const applyCode = (e: FormEvent) => {
    e.preventDefault();
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
  const already = firstTool?.line && firstTool.line.planId === planId && firstTool.line.state === "active";

  const pay = async () => {
    setFailure(null);
    setNameError(null);
    const name = (legalName ?? "").trim();
    if (!name) {
      setNameError(t("nameRequired"));
      document.getElementById("billing-name")?.focus();
      return;
    }
    if (!pmId || !p) return;
    try {
      const r = await confirm({ items: body.items, ...(p.coupon ? { coupon: p.coupon.code } : {}), paymentMethodId: pmId, billing: { legalName: name } }).unwrap();
      setDone({ result: r, basket: p });
      window.scrollTo({ top: 0 });
    } catch (err) {
      const e = platformError(err);
      if (e?.fieldErrors?.["billing.legalName"]) setNameError(t("nameRequired"));
      else setFailure(e ?? { status: "offline", code: "offline", message: "" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: t("toolsCrumb"), href: "/tools" }, ...(firstTool ? [{ label: loc(firstTool.name), href: `/tools/${firstTool.key}` }] : []), { label: t("title") }]}
        title={t("title")}
        description={ws.me ? t("description", { workspace: ws.me.workspace.name }) : undefined}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* The order: what's bought, for how long, and a discount code. */}
        <div className="flex flex-col gap-6">
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-title-sm text-fg">{t("order")}</h2>
              <SegmentedControl
                size="sm"
                label={tp("cycle")}
                value={cycle}
                onValueChange={setCycle}
                segments={[
                  { value: "monthly", label: tp("monthly") },
                  { value: "yearly", label: tp("yearly") },
                ]}
              />
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
                        <p className="font-semibold text-fg">{t("lineName", { tool: tool ? loc(tool.name) : l.tool, plan: loc(l.name) })}</p>
                        <p className="shrink-0 tabular-nums text-fg">{money(l.amount)}</p>
                      </div>
                      <p className="text-body-sm text-fg-muted">
                        {l.quantity > 1 ? t.rich(`perSeat.${l.cycle}`, { count: l.quantity, amount: f.money(l.unit, cur), unit: (c) => <span dir="ltr">{c}</span> }) : t(`billed.${l.cycle}`)}
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
                  onClick={() => {
                    setCoupon(null);
                    setCodeInput("");
                  }}
                />
              </div>
            ) : (
              <form onSubmit={applyCode} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <Field label={t("codeLabel")} error={couponError} className="flex-1">
                  <Input name="coupon" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} autoComplete="off" spellCheck={false} dir="ltr" className="uppercase" />
                </Field>
                <Button type="submit" variant="secondary" loading={preview.isFetching && Boolean(coupon)} className="sm:mt-7">
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
                {p.bundle && p.bundleDiscount > 0 ? <Row label={t("bundle", { name: loc(p.bundle.name), pct: p.bundle.pct })} value={money(p.bundleDiscount, true)} /> : null}
                {p.coupon ? <Row label={t.rich("coupon", { code: p.coupon.code, c: (x) => <bdi dir="ltr">{x}</bdi> })} value={money(p.couponDiscount, true)} /> : null}
                {p.taxLabel ? <Row label={t.rich("tax", { label: p.taxLabel, c: (x) => <bdi dir="ltr">{x}</bdi> })} value={money(p.tax)} /> : <Row muted label={t("noTax")} value={money(0)} />}
                <div className="my-1 border-t border-line" />
                <Row strong label={t("total")} value={<span data-total>{money(p.total)}</span>} />
              </dl>
              {!p.taxDecided ? <Notice tone="info">{t("taxUndecided")}</Notice> : null}

              <Field label={t("paymentMethod")} group error={failure?.fieldErrors?.paymentMethodId ? te("paymentMethodId") : undefined}>
                {p.paymentMethods.length ? (
                  <RadioGroup
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
              <Link href="/billing/payment-methods" className="-mt-2 self-start text-body-sm font-medium text-fg-brand underline underline-offset-4">
                {t("addMethod")}
              </Link>

              <Field label={t("billingName")} description={t("billingNameHelp")} required error={nameError ?? undefined}>
                <Input id="billing-name" required value={legalName ?? ""} onChange={(e) => setLegalName(e.target.value)} disabled={billing.isLoading} autoComplete="organization" />
              </Field>

              {billing.data && billing.data.currencyLocked === false ? <Notice tone="warning">{t("currencyLock", { currency: cur })}</Notice> : null}

              {failure ? (
                <div ref={failureRef} tabIndex={-1} className="outline-none">
                  {failure.code === "payment_failed" ? (
                    <Notice tone="danger" title={t("failedTitle")}>
                      {t("failedBody")}
                      {failure.extra?.reason === "card_declined" ? ` ${t("declined")}` : ""}
                    </Notice>
                  ) : (
                    <Notice tone="danger" title={t("notPaidTitle")}>
                      {errorText(failure)}
                    </Notice>
                  )}
                </div>
              ) : null}

              <Button size="lg" variant="primary" loading={paying} disabled={!pmId || preview.isFetching} onClick={pay}>
                {t("pay", { total: f.money(p.total, cur) })}
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
