"use client";

// A customer's or lead's page. It tells apart "not found" (or not yours: the API answers 404 for
// a salesperson's colleague's customer), "no access" and a failure with Retry; any error read as
// "not found" before (SAL-100). The stage is the pipeline's (D-028) and can be moved here.
import { useTranslations } from "next-intl";
import { CalendarCheck, Prohibit } from "@phosphor-icons/react";
import { Card, EmptyState, ErrorState, LoadingState, NoPermissionState, PageHeader } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useGetCustomerQuery } from "@/redux/features/customers/customersApi";
import { useRole } from "@/hooks/useRole";
import { isolate } from "@/lib/bidi";
import CustomerStatusCell from "../CustomerStatusCell";
import { useCustomerDates } from "../leads";
import BusinessDetails from "./BusinessDetails";
import DocumentsDetails from "./DocumentsDetails";
import AccountAccess from "./AccountAccess";
import CustomerNotes from "./CustomerNotes";
import CustomerDetailsSection from "./CustomerDetailsSection";
import CustomerOverview from "./CustomerOverview";
import CustomerProjects from "./CustomerProjects";
import CustomerHeaderActions from "./CustomerHeaderActions";
import LeadSourceDetails from "./LeadSourceDetails";

type Props = {
  id: string;
};

export function CustomerDetails({ id }: Props) {
  const t = useTranslations("Customers.detail");
  const tList = useTranslations("Customers");
  const role = useRole();
  const dates = useCustomerDates();
  const blocked = role.isReady && role.isCustomer;
  const query = useGetCustomerQuery(id, { skip: blocked });
  const customer = query.data?.data;

  if (blocked) return <NoPermissionState size="page" titleAs="h1" title={tList("noAccessTitle")} description={tList("noAccessBody")} />;

  if (query.isLoading) return <LoadingState rows={6} label={t("loading")} />;

  if (query.isError || !customer) {
    const status = (query.error as { status?: number | string } | undefined)?.status;
    const back = <ButtonLink href="/customers" variant="secondary">{t("backToList")}</ButtonLink>;
    if (status === 403) return <NoPermissionState size="page" titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} action={back} />;
    if (status === 404 || !query.isError)
      return <EmptyState size="page" titleAs="h1" title={t("notFoundTitle")} description={t("notFoundBody")} action={back} />;
    return <ErrorState size="page" titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => void query.refetch()} />;
  }

  const canEdit = role.canEdit;
  const meeting = customer.meetingAppointment;
  const upcoming = meeting && new Date(meeting.scheduledAt).getTime() > Date.now();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: tList("title"), href: "/customers" }, { label: <span dir="auto">{customer.fullName}</span> }]}
        title={<span dir="auto">{customer.fullName}</span>}
        status={<CustomerStatusCell status={customer.status} customerId={customer.id} name={customer.fullName} readOnly={!canEdit} />}
        description={
          customer.companyName
            ? t("subtitleCompany", { company: isolate(customer.companyName), date: dates.date(customer.createdAt) })
            : t("subtitle", { date: dates.date(customer.createdAt) })
        }
        actions={<CustomerHeaderActions customer={customer} />}
      />

      {customer.status === "lost" ? (
        <Card padding="md" className="flex items-start gap-3">
          <Prohibit aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-muted" />
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-fg">{t("lostTitle")}</p>
            <p className="text-body-sm text-fg-muted" dir="auto">
              {customer.lostReason || t("lostNoReason")}
            </p>
          </div>
        </Card>
      ) : null}

      {meeting ? (
        <Card padding="md" className="flex items-start gap-3 bg-brand-subtle">
          <CalendarCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-brand" />
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-fg">
              {upcoming ? t("meetingUpcoming", { date: dates.dateTime(meeting.scheduledAt) }) : t("meetingPast", { date: dates.dateTime(meeting.scheduledAt) })}
            </p>
            <p className="text-body-sm text-fg-muted">
              {t("meetingBy", { name: isolate(meeting.createdBy || t("system")) })}
              {meeting.notes ? (
                <>
                  {" · "}
                  <span dir="auto">{meeting.notes}</span>
                </>
              ) : null}
            </p>
          </div>
        </Card>
      ) : null}

      {customer.status !== "new" ? <CustomerOverview customer={customer} /> : null}

      <LeadSourceDetails customer={customer} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerDetailsSection customer={customer} />
        <BusinessDetails customer={customer} />
      </div>
      <DocumentsDetails customer={customer} />
      <CustomerProjects projects={customer.projects} />
      <AccountAccess customer={customer} />
      <CustomerNotes customer={customer} />
    </section>
  );
}

export default CustomerDetails;
