"use client";

// The project in four figures: the contract total, what was paid and what is left (from the
// payments on its subscriptions; it said "Paid 0%" whatever was paid, SAL-080), the salesperson's
// commission once the contract is approved, and the due date.
import { useTranslations } from "next-intl";
import { Card, Meter, Stat } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import { useGetProjectPaymentsQuery } from "@/redux/features/projects/projectsApi";
import { num, useDealFormat } from "@/lib/deals/format";
import type { ProjectDetail } from "@/types/projects";

export default function ProjectOverview({ project }: { project: ProjectDetail }) {
  const t = useTranslations("Projects");
  const fmt = useDealFormat();
  const { isCustomer } = useRole();
  const contract = project.latestContract ?? null;
  const cur = contract?.currency ?? null;
  const subscriptionIds = (contract?.plans ?? []).map((l) => l.subscriptionId).filter((s): s is string => Boolean(s));
  const payments = useGetProjectPaymentsQuery({ subscriptionIds, currency: cur, total: num(contract?.grandTotal) }, { skip: !contract });
  const paid = payments.data;
  const ratio = paid && paid.total > 0 ? Math.min(1, paid.paid / paid.total) : 0;
  const commission = contract?.status === "approved" && contract.commissionAmount != null ? fmt.money(contract.commissionAmount, cur) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card padding="md">
        <Stat label={t("statTotal")} value={contract ? fmt.money(contract.grandTotal, cur) : t("noContract")} hint={contract ? t("statTotalHint", { count: contract.plans?.length ?? 0 }) : undefined} />
      </Card>
      <Card padding="md" className="flex flex-col gap-3">
        <Stat
          label={t("statPaid")}
          loading={payments.isLoading}
          value={contract && paid ? fmt.money(paid.paid, cur) : "—"}
          hint={contract && paid ? t("statRemaining", { amount: fmt.money(paid.remaining, cur) }) : payments.isError ? t("statPaymentsError") : undefined}
        />
        {contract && paid ? <Meter value={Math.round(ratio * 100)} label={t("statPaidPercent")} format={{ style: "unit", unit: "percent", maximumFractionDigits: 0 }} /> : null}
      </Card>
      {isCustomer ? null : (
        <Card padding="md">
          <Stat
            label={t("statCommission")}
            value={commission ?? "—"}
            hint={
              commission
                ? contract?.commissionMode === "percentage"
                  ? t("commissionPercent", { percent: fmt.percent(contract.commissionPercentage ?? contract.commissionValue, 2) })
                  : t("commissionFixed")
                : project.assignedSalesmanId
                  ? t("commissionOnApproval")
                  : t("commissionNoSalesman")
            }
          />
        </Card>
      )}
      <Card padding="md">
        <Stat label={t("statDue")} value={project.dueDate ? fmt.date(project.dueDate) : t("noDueDate")} />
      </Card>
    </div>
  );
}
