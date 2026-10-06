"use client";

// The plans on the project's contract: each one's duration, how it is paid, its price in the
// contract currency and, once the contract is approved, its payment progress. While the contract is
// pending, the team can change the plans in the deal builder (agreed prices are kept).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple } from "@phosphor-icons/react";
import { Badge, Button, Card, CardHeader, Progress } from "@orgtik/ui";
import CreateUpdateProjectDialog from "@/components/dialogs/projects/CreateUpdateProjectDialog";
import { useRole } from "@/hooks/useRole";
import { num, useDealFormat } from "@/lib/deals/format";
import { isInstallment, type ProjectDetail } from "@/types/projects";

export default function ProjectPlansCard({ project }: { project: ProjectDetail }) {
  const t = useTranslations("Projects");
  const td = useTranslations("Deal");
  const fmt = useDealFormat();
  const { isCustomer, canEdit } = useRole();
  const [editing, setEditing] = useState(false);
  const contract = project.latestContract;
  if (!contract) return null;
  const cur = contract.currency;
  const lines = contract.plans ?? [];
  const canChange = !isCustomer && canEdit && contract.status === "pending";
  const approved = contract.status === "approved";

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        title={t("plansTitle")}
        description={td("plansCount", { count: lines.length })}
        actions={
          canChange ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)} startIcon={<PencilSimple aria-hidden className="size-4" />}>
              {t("changePlans")}
            </Button>
          ) : null
        }
      />
      <ul className="flex flex-col divide-y divide-line">
        {lines.map((l) => {
          const installment = isInstallment(l.paymentMethod);
          return (
            <li key={l.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span dir="auto" className="text-body font-semibold text-fg">
                    {l.planName}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-body-sm text-fg-muted">
                    <Badge tone={l.isCustom ? "brand" : "neutral"} size="sm">
                      {l.isCustom ? td("customBadge") : td("standardBadge")}
                    </Badge>
                    {td("monthsCount", { months: l.durationMonths })}
                    {l.planBundleName ? <span dir="auto">{t("partOfBundle", { name: l.planBundleName })}</span> : null}
                  </span>
                  <span className="text-body-sm text-fg-muted">
                    {installment && l.installmentMonths
                      ? td("monthlyTimes", { months: l.installmentMonths, amount: fmt.money(l.installmentMonthlyAmount, cur) })
                      : td("payUpfront")}
                  </span>
                  {l.features.length ? (
                    <span className="text-caption text-fg-subtle">
                      {t("includes", { features: l.features.map((f) => f.name).join(" · ") })}
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-body tabular-nums text-fg">
                  {fmt.money(l.price, cur)}
                  {num(l.installmentMarkupAmount) ? (
                    <span className="text-caption text-fg-muted">{td("plusMarkup", { amount: fmt.money(l.installmentMarkupAmount, cur) })}</span>
                  ) : null}
                  {approved ? (
                    <Badge tone={l.paymentStatus === "paid" ? "success" : "neutral"} size="sm">
                      {l.paymentStatus === "paid" ? t("planPaid") : t("planUnpaid")}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {approved && installment && l.installmentProgress != null ? (
                <Progress value={l.installmentProgress} label={t("installmentsPaid")} />
              ) : null}
            </li>
          );
        })}
      </ul>
      {canChange && editing ? <CreateUpdateProjectDialog projectId={project.id} open={editing} onOpenChange={setEditing} /> : null}
    </Card>
  );
}
