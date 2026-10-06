"use client";
// One subscription line (USR-09): what it is, what it costs as bought, where it stands (spec 06
// subscription line table) and what the owner can do from here. Changing to a higher plan is the
// tool's page (/tools/<key>); everything else opens a confirmation that states the consequence.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUUpLeft, ArrowsClockwise, CreditCard, Prohibit, Storefront } from "@phosphor-icons/react";
import { Button, Card, Menu, MenuContent, MenuItem, MenuTrigger, StatusBadge, buttonVariants } from "@orgtik/ui";
import { useBillingToolPlansQuery, type BillingPlan, type SubscriptionLine } from "@/redux/features/platform/billing";
import { Fact, Money, Notice, useDay, useLocalized } from "./shared";

/** Plan tiers from lowest to highest: a downgrade is to a lower one of the same tool. */
const TIER: Record<string, number> = { free: 0, starter: 1, basic: 1, pro: 2, business: 3, enterprise: 4 };
const rank = (tier?: string) => TIER[tier ?? ""] ?? 2;

export type LineIntent =
  | { kind: "cancel" | "resume" | "retry" | "cancel-downgrade"; line: SubscriptionLine; target?: BillingPlan }
  | { kind: "downgrade"; line: SubscriptionLine; target: BillingPlan };

export type LineNotice = { tone: "danger" | "warning" | "info"; title: string; body?: string; toCards?: boolean };

export function LineCard({
  line,
  mandatory,
  hasWorkingCard,
  notice,
  onIntent,
}: {
  line: SubscriptionLine;
  mandatory: boolean;
  hasWorkingCard: boolean;
  notice?: LineNotice;
  onIntent: (intent: LineIntent) => void;
}) {
  const t = useTranslations("Billing.lines");
  const name = useLocalized();
  const day = useDay();
  const tool = name(line.toolName, line.tool);
  const plan = name(line.planName, line.planId);
  const s = line.snapshot;
  const paid = s.amount > 0;
  const downgrading = line.scheduled?.kind === "downgrade" ? line.scheduled : null;
  const priceChange = line.scheduled?.kind === "price_change" ? line.scheduled : null;

  // The tool's plans: to offer a lower one, and to name the one a scheduled downgrade goes to.
  const canDowngrade = line.state === "active" && !mandatory && rank(line.tier) > 0;
  const plans = useBillingToolPlansQuery(line.tool, { skip: !canDowngrade && !downgrading });
  const lower = (plans.data ?? []).filter((p) => p.id !== line.planId && rank(p.tier) < rank(line.tier)).sort((a, b) => rank(b.tier) - rank(a.tier));
  const target = downgrading ? plans.data?.find((p) => p.id === downgrading.planId) : undefined;
  const cycleWord = t(line.cycle === "yearly" ? "perYear" : "perMonth");

  const facts: { label: string; value: React.ReactNode }[] = [];
  facts.push({
    label: t("price"),
    value: paid ? (
      <span className="flex flex-col">
        <span>
          <Money amount={s.amount} currency={s.currency} /> {cycleWord}
        </span>
        {line.perUser ? (
          <span className="text-caption text-fg-muted">
            {t.rich("perSeat", { unit: () => <Money amount={s.unit} currency={s.currency} />, quantity: () => <span dir="ltr">{s.quantity}</span> })}
          </span>
        ) : null}
      </span>
    ) : (
      t("free")
    ),
  });
  if (line.state === "active" && paid) facts.push({ label: t("renewsOn"), value: day(line.periodEnd) });
  if (line.state === "cancelling") facts.push({ label: t("endsOn"), value: day(line.cancelAt ?? line.periodEnd) });
  if (line.state === "trialing") facts.push({ label: t("trialEnds"), value: day(line.trialEndsAt ?? line.periodEnd) });
  if (line.state === "past_due") {
    facts.push({ label: t("graceEnds"), value: day(line.graceEndsAt) });
    if (line.lastFailure) facts.push({ label: t("failedOn"), value: `${day(line.lastFailure.at)} · ${t.has(`failure.${line.lastFailure.reason}`) ? t(`failure.${line.lastFailure.reason}`) : t("failure.other")}` });
  }
  if (line.state === "read_only") {
    facts.push({ label: t("readOnlySince"), value: day(line.readOnlySince) });
    if (line.lastFailure) facts.push({ label: t("failedOn"), value: `${day(line.lastFailure.at)} · ${t.has(`failure.${line.lastFailure.reason}`) ? t(`failure.${line.lastFailure.reason}`) : t("failure.other")}` });
  }
  if (line.state === "ended") facts.push({ label: t("endedOn"), value: day(line.endedAt) });

  const toTool = `/tools/${encodeURIComponent(line.tool)}`;
  const owing = line.state === "past_due" || line.state === "read_only";

  return (
    <Card padding="none" className="flex flex-col">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id={`line-${line.id}`} className="font-display text-title-sm text-fg">
              {tool}
            </h2>
            <p className="text-body-sm text-fg-muted">{t("planCycle", { plan, cycle: t(line.cycle) })}</p>
          </div>
          <StatusBadge entity="subscription_line" state={line.state} viewer="customer" />
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {facts.map((f) => (
            <Fact key={f.label} label={f.label}>
              {f.value}
            </Fact>
          ))}
        </dl>

        {priceChange ? <Notice tone="info" title={t("priceChangeTitle", { date: day(priceChange.effectiveAt) })}>{t("priceChangeBody")}</Notice> : null}
        {downgrading ? (
          <Notice
            tone="info"
            title={t("downgradeTitle", { plan: target ? name(target.name) : t("lowerPlan"), date: day(downgrading.effectiveAt) })}
            action={
              <Button size="sm" variant="secondary" startIcon={<ArrowUUpLeft className="rtl:-scale-x-100" />} onClick={() => onIntent({ kind: "cancel-downgrade", line, target })}>
                {t("keepPlan")}
              </Button>
            }
          >
            {t("downgradeBody", { plan })}
          </Notice>
        ) : null}
        {line.state === "trialing" ? <p className="text-body-sm text-fg-muted">{t("trialHint", { tool })}</p> : null}
        {owing ? <p className="text-body-sm text-fg-muted">{line.state === "read_only" ? t("readOnlyHint", { tool }) : t("pastDueHint", { tool, date: day(line.graceEndsAt) })}</p> : null}
        {mandatory ? <p className="text-body-sm text-fg-muted">{t("mandatoryHint", { tool })}</p> : null}

        {notice ? (
          <Notice
            tone={notice.tone}
            title={notice.title}
            action={
              notice.toCards ? (
                <Link href="/billing/payment-methods" className={buttonVariants({ size: "sm", variant: "secondary" })}>
                  {t("toCards")}
                </Link>
              ) : undefined
            }
          >
            {notice.body}
          </Notice>
        ) : null}
      </div>

      {actions()}
    </Card>
  );

  function actions() {
    const buttons: React.ReactNode[] = [];
    if (owing) {
      if (hasWorkingCard)
        buttons.push(
          <Button key="retry" size="sm" variant="primary" startIcon={<ArrowsClockwise />} onClick={() => onIntent({ kind: "retry", line })}>
            {t("retry")}
          </Button>,
        );
      buttons.push(
        <Link key="cards" href="/billing/payment-methods" className={buttonVariants({ size: "sm", variant: hasWorkingCard ? "secondary" : "primary" })}>
          <CreditCard aria-hidden="true" />
          {hasWorkingCard ? t("toCards") : t("addCard")}
        </Link>,
      );
    }
    if (line.state === "cancelling")
      buttons.push(
        <Button key="resume" size="sm" variant="primary" startIcon={<ArrowUUpLeft className="rtl:-scale-x-100" />} onClick={() => onIntent({ kind: "resume", line })}>
          {t("resume")}
        </Button>,
      );
    if (!mandatory && ["trialing", "active", "free", "ended"].includes(line.state))
      buttons.push(
        <Link key="plans" href={toTool} className={buttonVariants({ size: "sm", variant: line.state === "trialing" || line.state === "ended" ? "primary" : "secondary" })}>
          <Storefront aria-hidden="true" />
          {line.state === "trialing" ? t("choosePlan") : line.state === "ended" ? t("subscribeAgain") : line.state === "free" ? t("seePlans") : t("changePlan")}
        </Link>,
      );
    if (canDowngrade && !downgrading && lower.length === 1)
      buttons.push(
        <Button key="down" size="sm" variant="secondary" startIcon={<ArrowDown />} onClick={() => onIntent({ kind: "downgrade", line, target: lower[0] })}>
          {t("moveTo", { plan: name(lower[0].name) })}
        </Button>,
      );
    if (canDowngrade && !downgrading && lower.length > 1)
      buttons.push(
        <Menu key="down">
          <MenuTrigger render={<Button size="sm" variant="secondary" startIcon={<ArrowDown />} />}>{t("moveLower")}</MenuTrigger>
          <MenuContent>
            {lower.map((p) => (
              <MenuItem key={p.id} onClick={() => onIntent({ kind: "downgrade", line, target: p })}>
                {t("moveTo", { plan: name(p.name) })}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>,
      );
    if (!mandatory && (line.state === "active" || line.state === "trialing"))
      buttons.push(
        <Button key="cancel" size="sm" variant="ghost" startIcon={<Prohibit />} onClick={() => onIntent({ kind: "cancel", line })} className="sm:ms-auto">
          {line.state === "trialing" ? t("endTrial") : t("cancel")}
        </Button>,
      );
    if (!buttons.length) return null;
    return <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">{buttons}</div>;
  }
}
