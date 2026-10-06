"use client";

// The customer's projects, each with its plans and its latest contract. Every project status has
// words, an icon and the same colour as on the projects screen (SAL-082, SAL-092). The contract's
// Approve, Reject and Add plan buttons here only showed a toast (SAL-015): approving sets the
// commission and lives on the project's page, which each project links to.
import { useTranslations } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react";
import { Accordion, Card, CardHeader, EmptyState, Tag } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { SalesStatus } from "@/components/shared/SalesStatus";
import type { CustomerProject } from "@/types/customers";
import DetailList from "../../DetailList";
import { useCustomerDates } from "../../leads";
import { CustomerDocumentRow } from "../DocumentsDetails/CustomerDocumentRow";
import { ProjectPriorityBadge } from "./ProjectPriorityBadge";

function ProjectBody({ project }: { project: CustomerProject }) {
  const t = useTranslations("Customers.projects");
  const dates = useCustomerDates();
  const contract = project.contracts?.[0];
  const plans = project.plans ?? [];
  return (
    <div className="flex flex-col gap-5">
      {plans.length ? (
        <section className="flex flex-col gap-2" aria-label={t("plans")}>
          <h4 className="text-label text-fg-muted">{t("plans")}</h4>
          <ul className="flex flex-col gap-2">
            {plans.map((plan) => (
              <li key={plan.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-line bg-sunken px-3 py-2">
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-fg" dir="auto">
                    {plan.name}
                  </span>
                  {plan.dateRange ? <bdi className="text-caption text-fg-muted">{plan.dateRange}</bdi> : null}
                </span>
                {plan.price ? <bdi className="font-semibold text-fg tabular-nums">{plan.price}</bdi> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {contract ? (
        <section className="flex flex-col gap-3">
          <h4 className="text-label text-fg-muted">{t("contract")}</h4>
          <DetailList
            items={[
              { label: t("contractStatus"), value: <SalesStatus kind="contract" value={contract.status} size="sm" /> },
              { label: t("contractCreated"), value: dates.date(contract.createdAt) },
              { label: t("signed"), value: contract.isSigntuerd ? t("signedYes") : t("signedNo") },
            ]}
          />
          {contract.pdfPath ? <CustomerDocumentRow document={contract.pdfPath} label={t("contract")} /> : null}
        </section>
      ) : (
        <p className="text-body-sm text-fg-muted">{t("noContract")}</p>
      )}
      <Link href={`/projects/${project.id}`} className="inline-flex w-fit items-center gap-1.5 font-semibold text-fg-brand hover:underline">
        {contract?.status === "pending" ? t("openToReview") : t("open")}
        <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
      </Link>
    </div>
  );
}

export default function CustomerProjects({ projects = [] }: { projects?: CustomerProject[] }) {
  const t = useTranslations("Customers.projects");
  const dates = useCustomerDates();
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("title")} description={t("count", { count: projects.length })} />
      {projects.length ? (
        <Accordion
          defaultValue={[projects[0].id]}
          multiple
          items={projects.map((p) => ({
            value: p.id,
            title: (
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                <span className="truncate font-semibold text-fg" dir="auto">
                  {p.projectName || t("unnamed")}
                </span>
                <SalesStatus kind="project" value={p.status ?? "pending"} size="sm" />
                <ProjectPriorityBadge priority={p.priority} />
                <Tag>{t("plansCount", { count: p.plansCount ?? p.plans?.length ?? 0 })}</Tag>
                <span className="text-caption text-fg-muted">{dates.date(p.createdAt)}</span>
              </span>
            ),
            content: <ProjectBody project={p} />,
          }))}
        />
      ) : (
        <EmptyState size="compact" title={t("emptyTitle")} description={t("emptyBody")} />
      )}
    </Card>
  );
}
