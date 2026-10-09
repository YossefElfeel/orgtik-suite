"use client";
// Home's "Your tools" (USR-00): every tool of the workspace from /v1/app/me with its state, a word
// on where its subscription stands (trial days left, free plan, payment due) and one way forward.
// Trial days and the waitlist come from the catalogue, which Home reads too.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, StatusBadge } from "@orgtik/ui";
import type { AppMe, AppTool } from "@/redux/features/platform/platformApi";
import { useToolCatalogQuery } from "@/redux/features/platform/tools";
import { ToolActions } from "./ToolActions";
import { daysUntil, ToolIcon, useLocalized } from "./shared";

function useLineDetail() {
  const t = useTranslations("Tools.line");
  return (tool: AppTool) => {
    const l = tool.line;
    if (!l) return undefined;
    if (l.state === "trialing" && l.trialEndsAt) return t("daysLeft", { count: daysUntil(l.trialEndsAt) });
    if (l.state === "free") return t("freePlan");
    if (l.state === "past_due") return t("paymentDue");
    if (l.state === "cancelling") return t("cancelling");
    return undefined;
  };
}

export function MyTools({ me }: { me: AppMe }) {
  const t = useTranslations("Tools.home");
  const loc = useLocalized();
  const detail = useLineDetail();
  const { data: catalog } = useToolCatalogQuery();
  const extra = new Map((catalog ?? []).map((c) => [c.key, c]));
  return (
    <section aria-labelledby="my-tools" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="my-tools" className="font-display text-title-sm text-fg">
          {t("title")}
        </h2>
        <Link href="/tools" className="text-body-sm font-medium text-fg-brand underline-offset-4 hover:underline">
          {t("allTools")}
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {me.tools.map((tool) => {
          const name = loc(tool.name);
          const c = extra.get(tool.key);
          return (
            <li key={tool.key} data-tool={tool.key}>
              <Card padding="md" className="flex h-full flex-col gap-3 shadow-xs transition-shadow hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <ToolIcon icon={tool.icon} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="font-display text-title-sm text-fg">{name}</h3>
                    <p className="text-body-sm text-fg-muted">{loc(tool.short)}</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <div>
                    <StatusBadge entity="tool_state" state={tool.state} viewer="customer" detail={detail(tool)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ToolActions tool={{ key: tool.key, name, state: tool.state, scope: tool.scope, trialDays: c?.trialDays, onWaitlist: c?.onWaitlist, lineState: tool.line?.state }} role={me.workspace.role} canBuy={me.can.buy} />
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
