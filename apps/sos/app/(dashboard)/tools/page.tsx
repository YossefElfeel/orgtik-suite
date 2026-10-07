"use client";

// Tools and plans (USR-04): every OrgTik tool with its state in this workspace, the lowest monthly
// price in the workspace's currency, the trial and whether there's a free plan. Coming-soon tools
// take a waitlist. Anyone in the workspace can look; only the owner buys (spec 05 §1), and the
// owner can also ask for a custom plan (USR-25).
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Gift, Sparkle, Timer } from "@phosphor-icons/react";
import { buttonVariants, Card, ErrorState, ListStates, PageHeader, StatusBadge, useFormatter } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { useMounted } from "@/hooks/use-mounted";
import { useToolCatalogQuery, type CatalogTool } from "@/redux/features/platform/tools";
import { WaitlistButton } from "@/components/workspace/tools/ToolActions";
import { ToolIcon, useLocalized } from "@/components/workspace/tools/shared";

function Facts({ tool }: { tool: CatalogTool }) {
  const t = useTranslations("Tools.catalog");
  const f = useFormatter();
  const soon = tool.status === "coming_soon";
  const facts: { icon: React.ReactNode; text: string }[] = [];
  if (tool.trialDays > 0 && !soon) facts.push({ icon: <Timer />, text: t("trial", { days: tool.trialDays }) });
  if (tool.hasFree && !tool.mandatory) facts.push({ icon: <Gift />, text: t("free") });
  return (
    <div className="flex flex-col gap-2 text-body-sm text-fg-muted">
      {tool.mandatory ? (
        <p className="flex items-center gap-1.5">
          <Sparkle aria-hidden="true" className="size-4" />
          {t("included")}
        </p>
      ) : tool.fromUnit ? (
        <p className="text-body">
          {t.rich(tool.fromUnit.perUser ? "fromPerUser" : "from", {
            amount: f.money(tool.fromUnit.amount, tool.fromUnit.currency),
            price: (c) => (
              <span dir="ltr" className="font-semibold text-fg">
                {c}
              </span>
            ),
          })}
        </p>
      ) : !soon && !tool.hasFree ? (
        <p>{t("onRequest")}</p>
      ) : null}
      {facts.length ? (
        <ul className="flex flex-col gap-1.5">
          {facts.map((x) => (
            <li key={x.text} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="[&>svg]:size-4">
                {x.icon}
              </span>
              {x.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function ToolsPage() {
  const t = useTranslations("Tools.catalog");
  const ta = useTranslations("Tools.actions");
  const loc = useLocalized();
  const mounted = useMounted();
  const ws = useWorkspace();
  const { data, isLoading, error, refetch } = useToolCatalogQuery(undefined, { skip: !mounted });

  if (mounted && ws.error) return <ErrorState titleAs="h1" title={t("failed")} onRetry={() => ws.refetch()} />;
  const status = !mounted || isLoading || ws.isLoading ? "loading" : error ? "error" : !data?.length ? "empty" : "ready";
  const role = ws.me?.workspace.role ?? "guest";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={ws.me ? t("description", { workspace: ws.me.workspace.name, currency: ws.me.workspace.currency }) : undefined}
        actions={
          ws.me?.can.buy ? (
            <Link href="/tools/custom-plan" className={buttonVariants({ variant: "secondary" })}>
              {t("customPlan")}
            </Link>
          ) : undefined
        }
      />
      {ws.me && !ws.me.can.buy ? <p className="text-body-sm text-fg-muted">{t("ownerBuys")}</p> : null}
      <ListStates status={status} onRetry={refetch} empty={{ title: t("empty") }} error={{ title: t("failed") }} loadingRows={4}>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-4">
          {(data ?? []).map((tool) => {
            const name = loc(tool.name);
            return (
              <li key={tool.key} data-tool={tool.key}>
                <Card padding="md" className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <ToolIcon icon={tool.icon} />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h2 className="font-display text-title-sm text-fg">{name}</h2>
                      <p className="text-body-sm text-fg-muted">{loc(tool.short)}</p>
                    </div>
                  </div>
                  <div>
                    <StatusBadge entity="tool_state" state={tool.state} viewer="customer" />
                  </div>
                  <Facts tool={tool} />
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    {tool.status === "coming_soon" ? (
                      role === "guest" ? null : <WaitlistButton toolKey={tool.key} name={name} onWaitlist={tool.onWaitlist} />
                    ) : (
                      <Link href={`/tools/${tool.key}`} className={buttonVariants({ size: "sm", variant: tool.state === "not_subscribed" ? "primary" : "secondary" })}>
                        {ta("seePlans")}
                        <span className="sr-only"> {name}</span>
                        <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </ListStates>
    </div>
  );
}
