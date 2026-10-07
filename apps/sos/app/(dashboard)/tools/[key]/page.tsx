"use client";

// One tool's plans (USR-05) and its trial (USR-06). Plans side by side, priced by the platform for
// this workspace in its currency: monthly or yearly (with the yearly saving), per-user prices times
// the workspace's seats, limits and what's included, and the current plan marked. The owner starts
// a trial (one per tool per workspace, G-17: the API answers 409 trial_used) or chooses a plan,
// which goes to checkout. Everyone else sees the same plans and is told to ask the owner.
import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Minus } from "@phosphor-icons/react";
import { Badge, Button, buttonVariants, Card, ConfirmDialog, ErrorState, LoadingState, PageHeader, SegmentedControl, StatusBadge, toast, useFormatter } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { useMounted } from "@/hooks/use-mounted";
import { platformError, useStartTrialMutation, useToolCatalogQuery, useToolDetailQuery, type Cycle, type ToolDetail, type ToolPlan } from "@/redux/features/platform/tools";
import type { PlatformError } from "@/redux/features/platform/platformApi";
import { openHref, WaitlistButton } from "@/components/workspace/tools/ToolActions";
import { daysUntil, Notice, ToolIcon, useLocalized, useToolsError } from "@/components/workspace/tools/shared";

function useFeatureText() {
  const t = useTranslations("Tools.features");
  const tp = useTranslations("Tools.plans");
  return {
    limit: (key: string, value: number | null) => (value == null || value < 0 ? tp("unlimited", { feature: t.has(`${key}.name`) ? t(`${key}.name`) : key }) : t.has(`${key}.limit`) ? t(`${key}.limit`, { value }) : `${key}: ${value}`),
    flag: (key: string) => (t.has(`${key}.name`) ? t(`${key}.name`) : key),
  };
}

function PlanCard({
  tool,
  plan,
  cycle,
  allFlags,
  canBuy,
  canTrial,
  onTrial,
}: {
  tool: ToolDetail;
  plan: ToolPlan;
  cycle: Cycle;
  allFlags: string[];
  canBuy: boolean;
  canTrial: boolean;
  onTrial: (plan: ToolPlan) => void;
}) {
  const t = useTranslations("Tools.plans");
  const f = useFormatter();
  const loc = useLocalized();
  const feat = useFeatureText();
  const free = plan.tier === "free";
  const price = free ? plan.monthly : cycle === "yearly" ? plan.yearly : plan.monthly;
  const trialing = plan.current && tool.line?.state === "trialing";
  const money = (n: number) => <span dir="ltr">{f.money(n, price?.currency ?? tool.plans.find((x) => x.monthly)?.monthly?.currency ?? "")}</span>;
  const per = cycle === "yearly" ? "year" : "month";
  return (
    <Card padding="md" elevation={plan.current ? "raised" : "flat"} className={plan.current ? "flex h-full flex-col gap-5 border-2 border-action-brand" : "flex h-full flex-col gap-5"} data-plan={plan.id}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-title-sm text-fg">{loc(plan.name)}</h2>
          {plan.current ? <Badge tone="brand">{trialing ? t("currentTrial") : t("current")}</Badge> : null}
          {plan.recommended && !plan.current ? <Badge tone="info">{t("recommended")}</Badge> : null}
        </div>
        {free ? (
          <p className="text-body-sm text-fg-muted">
            <span className="font-display text-title text-fg">{money(0)}</span> {t("per.month")}
          </p>
        ) : price ? (
          <div className="flex flex-col gap-1">
            <p className="text-body-sm text-fg-muted">
              <span className="font-display text-title text-fg">{money(plan.perUser ? price.unit : price.amount)}</span>{" "}
              {t(plan.perUser ? `perUser.${per}` : `per.${per}`)}
            </p>
            {plan.perUser ? <p className="text-body-sm text-fg-muted">{t.rich(`seatsTotal.${per}`, { count: price.quantity, amount: f.money(price.amount, price.currency), total: (c) => <span dir="ltr">{c}</span> })}</p> : null}
            {cycle === "yearly" && plan.yearlyDiscountPct > 0 ? <p className="text-body-sm font-medium text-success">{t("yearlySaving", { pct: Math.round(plan.yearlyDiscountPct) })}</p> : null}
          </div>
        ) : (
          <p className="text-body-sm text-fg-muted">{t("noPrice")}</p>
        )}
        {plan.perUser && plan.minSeats > 1 ? <p className="text-body-sm text-fg-muted">{t("minSeats", { count: plan.minSeats })}</p> : null}
        {plan.contractedQuantity ? <p className="text-body-sm text-fg-muted">{t("contractCapacity", { count: plan.contractedQuantity })}</p> : null}
      </div>

      <ul className="flex flex-col gap-2 text-body-sm" aria-label={t("whatYouGet", { plan: loc(plan.name) })}>
        {plan.limits.map((l) => (
          <li key={l.key} className="flex items-start gap-2 text-fg">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            {feat.limit(l.key, l.value)}
          </li>
        ))}
        {allFlags.map((k) => {
          const on = plan.flags.includes(k);
          return (
            <li key={k} className={on ? "flex items-start gap-2 text-fg" : "flex items-start gap-2 text-fg-subtle"}>
              {on ? <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" /> : <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
              <span>
                {feat.flag(k)}
                <span className="sr-only"> ({on ? t("included") : t("notIncluded")})</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        {!canBuy ? (
          plan.current ? null : <p className="text-body-sm text-fg-muted">{t("askOwner")}</p>
        ) : free ? (
          plan.current ? null : (
            <p className="text-body-sm text-fg-muted">
              {t.rich("toFree", { link: (c) => <Link href="/billing" className="font-medium text-fg-brand underline underline-offset-4">{c}</Link> })}
            </p>
          )
        ) : plan.current && !trialing && tool.line?.cycle === cycle ? (
          <p className="text-body-sm text-fg-muted">{t("youHaveIt")}</p>
        ) : (
          <>
            <Link href={`/checkout?plan=${encodeURIComponent(plan.id)}&cycle=${cycle}`} className={buttonVariants({ variant: "primary" })}>
              {t("choose", { plan: loc(plan.name) })}
            </Link>
            {canTrial && plan.trialDays > 0 ? (
              <Button variant="secondary" onClick={() => onTrial(plan)}>
                {t("startTrial", { days: plan.trialDays })}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}

export default function ToolPlansPage() {
  const t = useTranslations("Tools.plans");
  const ta = useTranslations("Tools.actions");
  const tc = useTranslations("Tools.catalog");
  const loc = useLocalized();
  const f = useFormatter();
  const errorText = useToolsError();
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const { key } = useParams<{ key: string }>();
  const ws = useWorkspace();
  const { data: tool, error, isLoading, refetch } = useToolDetailQuery(key, { skip: !mounted });
  const { data: catalog } = useToolCatalogQuery(undefined, { skip: !mounted });
  const [startTrial] = useStartTrialMutation();
  const [trialFor, setTrialFor] = useState<ToolPlan | null>(null);
  const [trialError, setTrialError] = useState<PlatformError | null>(null);
  const cycle: Cycle = search.get("cycle") === "yearly" ? "yearly" : "monthly";
  const setCycle = (c: Cycle) => {
    const q = new URLSearchParams(search.toString());
    q.set("cycle", c);
    router.replace(`${pathname}?${q}`, { scroll: false });
  };

  if (!mounted || isLoading || ws.isLoading) return <LoadingState rows={5} />;
  const e = platformError(error);
  if (e?.status === 404) {
    return (
      <ErrorState
        titleAs="h1"
        title={t("notFound")}
        action={
          <Link href="/tools" className={buttonVariants({ variant: "secondary" })}>
            {t("backToTools")}
          </Link>
        }
      />
    );
  }
  if (error || !tool || !ws.me) return <ErrorState titleAs="h1" title={t("failed")} onRetry={refetch} />;

  const name = loc(tool.name);
  const canBuy = ws.me.can.buy;
  const line = tool.line;
  const appTool = ws.me.tools.find((item) => item.key === tool.key);
  const open = appTool && ["active", "trial", "beta", "read_only"].includes(appTool.state) ? openHref(appTool.scope) : null;
  // A trial can start when the tool isn't paid for or on trial now (the API says why otherwise).
  const canTrial = canBuy && (!line || line.state === "free");
  const offered = catalog?.find((c) => c.key === tool.key)?.trialDays ?? 0;
  const trialUsed = offered > 0 && line?.state !== "trialing" && tool.plans.every((p) => p.trialDays === 0);
  const paid = tool.plans.filter((p) => p.tier !== "free");
  const saving = Math.round(Math.max(0, ...paid.map((p) => p.yearlyDiscountPct)));
  const allFlags = [...new Set(tool.plans.flatMap((p) => p.flags))];
  const hasFree = tool.plans.some((p) => p.tier === "free");

  const confirmTrial = async () => {
    if (!trialFor) return;
    setTrialError(null);
    try {
      const l = await startTrial({ key: tool.key, planId: trialFor.id }).unwrap();
      toast.success(t("trialStarted", { tool: name, date: f.date(l.trialEndsAt ?? Date.now(), { dateStyle: "medium" }) }));
    } catch (err) {
      setTrialError(platformError(err));
    }
    setTrialFor(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: tc("title"), href: "/tools" }, { label: name }]}
        title={
          <span className="flex items-center gap-3">
            <ToolIcon icon={tool.icon} className="size-10" />
            {name}
          </span>
        }
        description={loc(tool.short)}
        status={<StatusBadge entity="tool_state" state={tool.state} viewer="customer" />}
        actions={open ? (
          <Link href={open} className={buttonVariants({ variant: "primary" })}>
            {ta("openTool", { tool: name })}
            <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </Link>
        ) : undefined}
      />

      {trialError ? (
        <Notice tone="danger" title={trialError.code === "trial_used" ? t("trialUsedTitle", { tool: name }) : t("trialFailed")}>
          {trialError.code === "trial_used" ? t("trialUsedBody") : errorText(trialError)}
        </Notice>
      ) : null}
      {line?.state === "trialing" && line.trialEndsAt ? (
        <Notice tone="info" title={t("onTrial", { tool: name, date: f.date(line.trialEndsAt, { dateStyle: "medium" }), count: daysUntil(line.trialEndsAt) })}>
          {canBuy ? t("onTrialBody") : t("askOwner")}
        </Notice>
      ) : trialUsed && !trialError ? (
        <Notice tone="info">{t("trialUsedNote", { tool: name })}</Notice>
      ) : null}
      {!canBuy ? <Notice tone="info">{t("ownerOnly", { workspace: ws.me.workspace.name })}</Notice> : null}

      {tool.status === "coming_soon" ? (
        <Card padding="lg" className="flex flex-col items-start gap-3">
          <h2 className="font-display text-title-sm text-fg">{t("comingSoon", { tool: name })}</h2>
          <p className="text-body-sm text-fg-muted">{t("comingSoonBody")}</p>
          {ws.me.workspace.role !== "guest" ? <WaitlistButton toolKey={tool.key} name={name} onWaitlist={catalog?.find((c) => c.key === tool.key)?.onWaitlist} size="md" /> : null}
        </Card>
      ) : !tool.plans.length ? (
        <Card padding="lg" className="flex flex-col items-start gap-3">
          <h2 className="font-display text-title-sm text-fg">{t("noPlans")}</h2>
          <p className="text-body-sm text-fg-muted">{t("noPlansBody")}</p>
          {canBuy ? (
            <Link href="/tools/custom-plan" className={buttonVariants({ variant: "secondary" })}>
              {tc("customPlan")}
            </Link>
          ) : null}
        </Card>
      ) : (
        <section aria-labelledby="plans-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="plans-title" className="font-display text-title-sm text-fg">
                {t("title")}
              </h2>
              <p className="text-body-sm text-fg-muted">{t("pricesFor", { count: tool.seats, currency: ws.me.workspace.currency })}</p>
              {tool.taxDisplay ? <p className="text-caption text-fg-muted">{t(tool.reverseCharge ? "taxReverseCharge" : tool.taxRate === 0 ? "taxNone" : tool.taxDisplay === "inclusive" ? "taxInclusive" : "taxExclusive", { rate: f.percent((tool.taxRate ?? 0) / 100) })}</p> : null}
            </div>
            {paid.length ? (
              <SegmentedControl
                label={t("cycle")}
                value={cycle}
                onValueChange={setCycle}
                segments={[
                  { value: "monthly", label: t("monthly") },
                  { value: "yearly", label: saving > 0 ? t("yearlySave", { pct: saving }) : t("yearly") },
                ]}
              />
            ) : null}
          </div>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(17rem,100%),1fr))] gap-4">
            {tool.plans.map((p) => (
              <li key={p.id}>
                <PlanCard tool={tool} plan={p} cycle={cycle} allFlags={allFlags} canBuy={canBuy} canTrial={canTrial} onTrial={setTrialFor} />
              </li>
            ))}
          </ul>
          {canBuy ? (
            <p className="text-body-sm text-fg-muted">
              {t.rich("customHint", { link: (c) => <Link href="/tools/custom-plan" className="font-medium text-fg-brand underline underline-offset-4">{c}</Link> })}
            </p>
          ) : null}
        </section>
      )}

      <ConfirmDialog
        open={trialFor !== null}
        onOpenChange={(o) => (o ? null : setTrialFor(null))}
        tone="primary"
        title={trialFor ? t("trialConfirmTitle", { days: trialFor.trialDays, tool: name, plan: loc(trialFor.name) }) : ""}
        impact={
          trialFor
            ? `${t("trialConfirmBody", { date: f.date(Date.now() + trialFor.trialDays * 86400000, { dateStyle: "medium" }) })} ${hasFree ? t("trialThenFree", { tool: name }) : t("trialThenStop", { tool: name })} ${t("oneTrial")}`
            : ""
        }
        confirmLabel={t("trialConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={confirmTrial}
      />
    </div>
  );
}
