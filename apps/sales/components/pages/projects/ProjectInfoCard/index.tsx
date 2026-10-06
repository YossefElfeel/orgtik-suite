"use client";

// Who the project is for and who sells it. The customer's record is changed on the customer's own
// page, not from here (a salesperson could edit it from a project, SAL-061).
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useRole } from "@/hooks/useRole";
import type { ProjectDetail } from "@/types/projects";

export default function ProjectInfoCard({ project }: { project: ProjectDetail }) {
  const t = useTranslations("Projects");
  const { isCustomer } = useRole();
  const c = project.customer;
  const item = (label: string, value: ReactNode) =>
    value ? (
      <div className="flex flex-col gap-0.5">
        <dt className="text-caption text-fg-muted">{label}</dt>
        <dd className="text-body text-fg">{value}</dd>
      </div>
    ) : null;

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        title={t("infoTitle")}
        actions={
          !isCustomer && project.customerId ? (
            <ButtonLink href={`/customers/${project.customerId}`} variant="ghost">
              {t("openCustomer")}
            </ButtonLink>
          ) : null
        }
      />
      <dl className="flex flex-col gap-3">
        {isCustomer ? null : item(t("customer"), c?.fullName || project.customerName ? <span dir="auto">{c?.fullName ?? project.customerName}</span> : null)}
        {isCustomer ? null : item(t("company"), c?.companyName ? <span dir="auto">{c.companyName}</span> : null)}
        {isCustomer ? null : item(t("email"), c?.email ? <bdi dir="ltr">{c.email}</bdi> : null)}
        {isCustomer ? null : item(t("phone"), c?.phoneNumber ? <bdi dir="ltr">{c.phoneNumber}</bdi> : null)}
        {item(t("salesman"), <span dir="auto">{project.assignedSalesman?.fullName ?? project.salesmanName ?? t("unassigned")}</span>)}
        {item(t("department"), project.department?.name ?? project.departmentName ? <span dir="auto">{project.department?.name ?? project.departmentName}</span> : null)}
        {item(
          t("fieldDescription"),
          project.projectDescription ? (
            <p dir="auto" className="whitespace-pre-line">
              {project.projectDescription}
            </p>
          ) : null,
        )}
      </dl>
    </Card>
  );
}
