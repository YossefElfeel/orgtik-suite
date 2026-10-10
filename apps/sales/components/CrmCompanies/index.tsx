"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import CompanyDialog from "@/components/dialogs/crm/CompanyDialog";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  NoPermissionState,
  PageHeader,
  TagInput,
  Textarea,
  Toolbar,
  useSuite,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  useCrmBootstrapQuery,
  useCrmCompanyCreateMutation,
  useCrmCompanyUpdateMutation,
} from "@/redux/features/crm-v3/crmApi";
import { crmCompanySchema } from "@/schemas/crm-v3";
import { crmErrorStatus } from "@/lib/crm-v3";
import type { CrmCompany } from "@/types/crm-v3";
import { Link } from "@/i18n/routing";

export default function CrmCompanies() {
  const t = useTranslations("CrmV3"),
    suite = useSuite(),
    query = useCrmBootstrapQuery(),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState<CrmCompany | "new">(),
    [update, mutation] = useCrmCompanyUpdateMutation();
  if (query.isLoading) return <LoadingState rows={5} />;
  if (!query.data || query.isError)
    return crmErrorStatus(query.error) === 403 ? (
      <NoPermissionState titleAs="h1" title={t("noAccess")} />
    ) : (
      <ErrorState
        titleAs="h1"
        title={t("loadError")}
        onRetry={() => void query.refetch()}
      />
    );
  const data = query.data,
    canEdit =
      data.capabilities.canConfigure &&
      Boolean(suite.toolState("crm")?.canWrite) &&
      !suite.snapshot?.actor.readOnly,
    rows = data.companies.filter((row) =>
      `${row.name} ${row.sector} ${row.tags.join(" ")}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    );
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title={t("companiesTitle")}
        description={t("companiesHint")}
        actions={
          canEdit ? (
            <Button onClick={() => setEdit("new")}>{t("newCompany")}</Button>
          ) : undefined
        }
      />
      <Toolbar
        label={t("companiesTitle")}
        search={{
          value: search,
          onChange: setSearch,
          label: t("searchCompanies"),
        }}
      />
      {rows.length ? (
        <div className="divide-y divide-line rounded-card border border-line bg-raised">
          {rows.map((row) => (
            <article key={row.id} className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 dir="auto" className="font-display text-title-sm">
                    {row.name}
                  </h2>
                  <p dir="auto" className="text-body-sm text-fg-muted">
                    {row.sector || t("notSet")}
                  </p>
                </div>
                {canEdit ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEdit(row)}
                  >
                    {t("editCompany")}
                  </Button>
                ) : null}
              </div>
              {row.website ? (
                <a
                  href={row.website}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-body-sm text-fg-brand underline"
                  dir="ltr"
                >
                  {row.website}
                </a>
              ) : null}
              <p dir="auto" className="whitespace-pre-wrap text-body-sm">
                {row.notes}
              </p>
              <TagInput
                label={t("tags")}
                value={row.tags}
                disabled={!canEdit || mutation.isLoading}
                onChange={(tags) =>
                  void update({ id: row.id, patch: { tags } })
                }
              />
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {data.contacts
                  .filter((contact) => contact.companyId === row.id)
                  .map((contact) => (
                    <li key={contact.id}>
                      <Link
                        href={`/customers?contact=${encodeURIComponent(contact.id)}`}
                        className="text-body-sm text-fg-brand underline"
                        dir="auto"
                      >
                        {contact.fullName}
                      </Link>
                    </li>
                  ))}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t(search ? "noMatch" : "emptyCompanies")}
          action={
            <Button
              variant="secondary"
              onClick={() => (search ? setSearch("") : setEdit("new"))}
              disabled={!search && !canEdit}
            >
              {t(search ? "clearFilters" : "newCompany")}
            </Button>
          }
        />
      )}
      {mutation.isError ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("saveError")}
        </p>
      ) : null}
      {edit ? (
        <CompanyDialog
          id={edit === "new" ? undefined : edit.id}
          onClose={() => setEdit(undefined)}
        />
      ) : null}
    </section>
  );
}
