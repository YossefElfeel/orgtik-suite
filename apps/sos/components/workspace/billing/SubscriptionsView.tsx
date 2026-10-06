"use client";
// Subscriptions (USR-09): every line of the workspace with its price as bought and its state, the
// monthly total, and what the owner can do on each line. Each action states its consequence first;
// what the API refuses is said on the line it concerns, with the way forward (a failed payment
// changes nothing and points to the cards).
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CurrencyCircleDollar, LockSimple, LockSimpleOpen, Users } from "@phosphor-icons/react";
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, Stat, toast } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { statusOf, type PlatformError } from "@/redux/features/platform/platformApi";
import { useBillingLineActionMutation, useBillingPaymentMethodsQuery, useBillingSubscriptionsQuery, type SubscriptionLine } from "@/redux/features/platform/billing";
import { LineCard, type LineIntent, type LineNotice } from "./LineCard";
import { Money, cardExpired, useDay, useLocalized } from "./shared";

// The most urgent first: what needs paying, then trials, then what's ending.
const ORDER = ["read_only", "past_due", "trialing", "cancelling", "active", "free", "ended", "deleted"];

export function SubscriptionsView() {
  const t = useTranslations("Billing");
  const tc = useTranslations("Billing.confirm");
  const name = useLocalized();
  const day = useDay();
  const ws = useWorkspace();
  const subs = useBillingSubscriptionsQuery();
  const cards = useBillingPaymentMethodsQuery();
  const [act] = useBillingLineActionMutation();
  const [intent, setIntent] = useState<LineIntent | null>(null);
  const [notices, setNotices] = useState<Record<string, LineNotice>>({});

  if (subs.isLoading) return <LoadingState rows={6} label={t("loading")} />;
  if (subs.isError || !subs.data) return <ErrorState titleAs="h1" title={t("subscriptions.failed")} description={t("tryAgain")} onRetry={subs.refetch} />;

  const data = subs.data;
  const lines = data.lines.filter((l) => l.state !== "deleted").sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));
  const mandatory = (key: string) => Boolean(ws.me?.tools.find((x) => x.key === key)?.mandatory);
  const working = (cards.data ?? []).filter((c) => !cardExpired(c));
  const card = working.find((c) => c.isDefault) ?? working[0];

  const say = (line: SubscriptionLine, n: LineNotice | null) =>
    setNotices((all) => {
      const next = { ...all };
      if (n) next[line.id] = n;
      else delete next[line.id];
      return next;
    });

  // Runs the chosen action. Whatever the API answers is said on the line; the dialog then closes.
  const run = async (i: LineIntent, reason?: string) => {
    const tool = name(i.line.toolName, i.line.tool);
    const plan = name(i.line.planName, i.line.planId);
    say(i.line, null);
    try {
      const done = await act({ id: i.line.id, action: i.kind, planId: i.kind === "downgrade" ? i.target.id : undefined, reason }).unwrap();
      const msg =
        i.kind === "cancel"
          ? i.line.state === "trialing"
            ? t("done.trialEnded", { tool })
            : t("done.cancelled", { tool, date: day(done.cancelAt ?? i.line.periodEnd) })
          : i.kind === "resume"
            ? t("done.resumed", { tool })
            : i.kind === "downgrade"
              ? t("done.downgraded", { tool, plan: name(i.target.name), date: day(i.line.periodEnd) })
              : i.kind === "cancel-downgrade"
                ? t("done.keptPlan", { tool, plan })
                : t("done.paid", { tool });
      toast.success(msg);
    } catch (e) {
      const err = e as PlatformError;
      const status = statusOf(e);
      if (i.kind === "retry" && status === 402) {
        say(i.line, { tone: "danger", title: t("errors.paymentFailed"), body: i.line.state === "read_only" ? t("errors.paymentFailedReadOnly", { tool }) : t("errors.paymentFailedPastDue", { tool, date: day(i.line.graceEndsAt) }), toCards: true });
      } else if (err?.code === "mandatory") {
        say(i.line, { tone: "warning", title: t("errors.mandatory", { tool }) });
      } else if (i.kind === "retry" && status === 422) {
        say(i.line, { tone: "warning", title: t("errors.noCard"), body: t("errors.noCardBody"), toCards: true });
      } else if (status === 409) {
        say(i.line, { tone: "warning", title: t("errors.changed"), body: t("errors.changedBody") });
        subs.refetch();
      } else if (status === 423) {
        say(i.line, { tone: "danger", title: t("errors.suspended") });
      } else {
        say(i.line, { tone: "danger", title: t("errors.failed"), body: t("tryAgain") });
      }
    }
  };

  // What each confirmation says before anything happens.
  const dialog = (() => {
    if (!intent) return null;
    const l = intent.line;
    const tool = name(l.toolName, l.tool);
    const plan = name(l.planName, l.planId);
    const amount = <Money amount={l.snapshot.amount} currency={l.snapshot.currency} />;
    const cycle = t(l.cycle === "yearly" ? "lines.perYear" : "lines.perMonth");
    switch (intent.kind) {
      case "cancel":
        return l.state === "trialing"
          ? { title: tc("endTrialTitle", { tool }), impact: tc("endTrialImpact", { tool }), confirm: tc("endTrial"), keep: tc("keepTrial"), tone: "danger" as const, reason: true }
          : { title: tc("cancelTitle", { tool }), impact: tc("cancelImpact", { tool, plan, date: day(l.periodEnd) }), confirm: tc("cancel", { tool }), keep: tc("keep", { tool }), tone: "danger" as const, reason: true };
      case "resume":
        return { title: tc("resumeTitle", { tool }), impact: tc.rich("resumeImpact", { tool, date: day(l.periodEnd), amount: () => amount, cycle }), confirm: tc("resume", { tool }), tone: "primary" as const };
      case "downgrade": {
        const p = intent.target;
        const price = p[l.cycle] ?? p.monthly;
        return {
          title: tc("downgradeTitle", { tool, plan: name(p.name) }),
          impact: tc.rich("downgradeImpact", { plan: name(p.name), current: plan, date: day(l.periodEnd), amount: () => (price ? <Money amount={price.amount} currency={price.currency} /> : t("lines.free")), cycle }),
          confirm: tc("downgrade"),
          tone: "primary" as const,
        };
      }
      case "cancel-downgrade":
        return {
          title: tc("keepPlanTitle", { tool, plan }),
          impact: tc.rich("keepPlanImpact", { tool, plan, lower: intent.target ? name(intent.target.name) : t("lines.lowerPlan"), date: day(l.scheduled?.effectiveAt ?? l.periodEnd), amount: () => amount, cycle }),
          confirm: t("lines.keepPlan"),
          tone: "primary" as const,
        };
      case "retry":
        return {
          title: tc("retryTitle", { tool }),
          impact: card ? tc.rich("retryImpact", { tool, card: () => <span dir="ltr">{`${card.brand} •••• ${card.last4}`}</span> }) : tc("retryNoCard"),
          confirm: tc("retry"),
          tone: "primary" as const,
        };
    }
  })();

  const locked = data.currencyLocked;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("subscriptions.title")} description={t("subscriptions.description")} />

      <section aria-label={t("summary.label")} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={<CurrencyCircleDollar />} label={t("summary.monthly")} value={<Money amount={data.monthlyTotal} currency={data.currency} />} hint={t("summary.monthlyHint")} />
        <Stat icon={<Users />} label={t("summary.seats")} value={<span dir="ltr">{data.seats}</span>} hint={t("summary.seatsHint")} />
        <Stat
          icon={locked ? <LockSimple /> : <LockSimpleOpen />}
          label={t("summary.currency")}
          value={<span dir="ltr">{data.currency}</span>}
          hint={
            <>
              {locked ? t("summary.locked") : t("summary.unlocked")}{" "}
              <Link href="/billing/details" className="font-medium text-fg-brand underline underline-offset-2">
                {t("summary.toDetails")}
              </Link>
            </>
          }
        />
      </section>

      {lines.length ? (
        <ul className="flex flex-col gap-4" aria-label={t("subscriptions.listLabel")}>
          {lines.map((l) => (
            <li key={l.id}>
              <LineCard line={l} mandatory={mandatory(l.tool)} hasWorkingCard={Boolean(card)} notice={notices[l.id]} onIntent={setIntent} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("subscriptions.emptyTitle")} description={t("subscriptions.emptyBody")} />
      )}

      {dialog ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setIntent(null)}
          title={dialog.title}
          impact={dialog.impact}
          confirmLabel={dialog.confirm}
          cancelLabel={"keep" in dialog ? dialog.keep : t("confirm.back")}
          tone={dialog.tone}
          reason={"reason" in dialog && dialog.reason ? { label: t("confirm.reason") } : undefined}
          onConfirm={({ reason }) => (intent ? run(intent, reason) : undefined)}
        />
      ) : null}
    </div>
  );
}
