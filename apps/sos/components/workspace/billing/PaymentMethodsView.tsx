"use client";
// Payment methods (USR-11): the workspace's cards, which one renewals charge (the default), and
// which have expired. Add a card, make one the default (not an expired one), remove one. The last
// working card can't go while renewals depend on it (409 last_method): the page says why and how.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Plus, Star, Trash } from "@phosphor-icons/react";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, toast } from "@orgtik/ui";
import { statusOf, type PlatformError } from "@/redux/features/platform/platformApi";
import { useBillingMakeDefaultMutation, useBillingPaymentMethodsQuery, useBillingRemoveCardMutation, useBillingSubscriptionsQuery, type PaymentMethod } from "@/redux/features/platform/billing";
import { AddCardDialog } from "./AddCardDialog";
import { Notice, cardExpired } from "./shared";

type Said = { id: string; tone: "danger" | "warning"; title: string; body?: string };

export function PaymentMethodsView() {
  const t = useTranslations("Billing.cards");
  const tb = useTranslations("Billing");
  const { data, isLoading, isError, refetch } = useBillingPaymentMethodsQuery();
  const subs = useBillingSubscriptionsQuery();
  const [makeDefault] = useBillingMakeDefaultMutation();
  const [remove] = useBillingRemoveCardMutation();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<PaymentMethod | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [said, setSaid] = useState<Said | null>(null);

  const addButton = (
    <Button variant="primary" startIcon={<Plus />} onClick={() => setAdding(true)}>
      {t("addCard")}
    </Button>
  );

  if (isLoading) return <LoadingState rows={4} label={tb("loading")} />;
  if (isError || !data) return <ErrorState titleAs="h1" title={t("failed")} description={tb("tryAgain")} onRetry={refetch} />;

  const label = (pm: PaymentMethod) => `${pm.brand} •••• ${pm.last4}`;
  // Renewals that charge a card: paid lines that are active or waiting for a payment.
  const renewals = (subs.data?.lines ?? []).filter((l) => ["active", "past_due"].includes(l.state) && l.snapshot.amount > 0).length;
  const working = data.filter((pm) => !cardExpired(pm));

  const setDefault = async (pm: PaymentMethod) => {
    setSaid(null);
    setBusy(pm.id);
    try {
      await makeDefault(pm.id).unwrap();
      toast.success(t("defaultSet", { card: label(pm) }));
    } catch (e) {
      const code = (e as PlatformError)?.code;
      setSaid({ id: pm.id, tone: "warning", title: code === "expired" ? t("expiredNoDefault") : t("actionFailed"), body: code === "expired" ? undefined : tb("tryAgain") });
    } finally {
      setBusy(null);
    }
  };

  const doRemove = async (pm: PaymentMethod) => {
    setSaid(null);
    try {
      await remove(pm.id).unwrap();
      toast.success(t("removed", { card: label(pm) }));
    } catch (e) {
      const err = e as PlatformError;
      if (err?.code === "last_method") setSaid({ id: pm.id, tone: "warning", title: t("lastMethodTitle"), body: t("lastMethodBody", { count: renewals }) });
      else if (statusOf(e) === 404) refetch();
      else setSaid({ id: pm.id, tone: "danger", title: t("actionFailed"), body: tb("tryAgain") });
    }
  };

  const removeImpact = (pm: PaymentMethod) => {
    if (!pm.isDefault) return t("removeImpact");
    const next = working.find((x) => x.id !== pm.id);
    if (next) return t("removeDefaultImpact", { next: label(next) });
    return renewals > 0 ? t("removeLastImpact", { count: renewals }) : t("removeImpact");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={data.length ? addButton : undefined} />

      {data.length && !working.length ? <Notice tone="warning" title={t("noWorkingTitle")}>{t("noWorkingBody")}</Notice> : null}

      {data.length ? (
        <ul className="flex flex-col gap-3" aria-label={t("listLabel")}>
          {data.map((pm) => {
            const expired = cardExpired(pm);
            return (
              <li key={pm.id}>
                <Card padding="none" className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:p-5">
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-field bg-sunken text-fg-muted [&>svg]:size-5">
                      <CreditCard />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-fg">
                        <span dir="ltr">{label(pm)}</span>
                        {pm.isDefault ? <Badge tone="brand" icon={<Star weight="fill" />}>{t("default")}</Badge> : null}
                        {expired ? <Badge tone="danger">{t("expired")}</Badge> : null}
                      </p>
                      <p className={expired ? "text-body-sm text-danger" : "text-body-sm text-fg-muted"}>
                        {t.rich(expired ? "expiredOn" : "expires", { date: () => <span dir="ltr">{pm.expires}</span> })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!pm.isDefault && !expired ? (
                        <Button size="sm" variant="secondary" loading={busy === pm.id} onClick={() => setDefault(pm)}>
                          {t("makeDefault")}
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" startIcon={<Trash />} onClick={() => setRemoving(pm)} aria-label={t("removeLabel", { card: label(pm) })}>
                        {t("remove")}
                      </Button>
                    </div>
                  </div>
                  {pm.isDefault && expired ? <p className="border-t border-line px-4 py-3 text-body-sm text-fg-muted sm:px-5">{t("defaultExpiredHint")}</p> : null}
                  {said?.id === pm.id ? (
                    <div className="border-t border-line p-4 sm:px-5">
                      <Notice tone={said.tone} title={said.title} action={said.tone === "warning" && said.body && !working.some((w) => w.id !== pm.id) ? addButton : undefined}>
                        {said.body}
                      </Notice>
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<CreditCard />} title={t("emptyTitle")} description={t("emptyBody")} action={addButton} />
      )}

      <AddCardDialog open={adding} onOpenChange={setAdding} />
      {removing ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setRemoving(null)}
          title={t("removeTitle", { card: label(removing) })}
          impact={removeImpact(removing)}
          confirmLabel={t("removeConfirm")}
          cancelLabel={t("keepCard")}
          tone="danger"
          onConfirm={() => doRemove(removing)}
        />
      ) : null}
    </div>
  );
}
