"use client";

// Who the deal is for. The list is searched by the API, so every customer can be found (the old
// picker loaded the first 100, SAL-085), and a salesperson sees their own customers only.
// The customer's country sets the prices and the currency.
import { useEffect, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Card, Combobox, EmptyState, ErrorState, Field, Input, RadioGroup, Select, Skeleton, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useGetDealCountriesQuery, useGetDealCustomersQuery } from "@/redux/features/projects/dealCatalogApi";
import type { DealFormValues, DealMode } from "@/schemas/offers";
import { PROJECT_PRIORITIES, type DealCustomer, type ProjectPriority } from "@/types/projects";

type Props = {
  form: UseFormReturn<DealFormValues>;
  mode: DealMode;
  /** An edit: the customer stays. */
  locked: boolean;
  customer: DealCustomer | null;
  onCustomer: (c: DealCustomer) => void;
};

export default function DealCustomerStep({ form, mode, locked, customer, onCustomer }: Props) {
  const t = useTranslations("Deal");
  const tp = useTranslations("Projects");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const customers = useGetDealCustomersQuery({ search: query }, { skip: locked });
  const countries = useGetDealCountriesQuery();
  const customerId = useWatch({ control: form.control, name: "customerId" });
  const results = customers.data?.data?.items ?? [];
  // The chosen customer stays in the list while another search runs.
  const list = customer && !results.some((c) => c.id === customer.id) ? [customer, ...results] : results;
  const byId = new Map(list.map((c) => [c.id, c]));
  const customerError = form.formState.errors.customerId?.message;

  const pick = (id: string) => {
    const c = byId.get(id);
    if (!c) return;
    onCustomer(c);
    form.setValue("customerId", c.id, { shouldDirty: true, shouldValidate: true });
    // Prices follow the customer's country; it can still be changed below.
    if (c.countryCode) form.setValue("countryCode", c.countryCode, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-6">
      {mode === "project" ? (
        <section aria-labelledby="deal-project" className="flex flex-col gap-4">
          <h3 id="deal-project" className="text-title-sm text-fg">
            {t("projectSection")}
          </h3>
          <RHFField
            control={form.control}
            name="projectName"
            label={tp("fieldName")}
            required
            render={(f) => <Input {...f} dir="auto" autoComplete="off" />}
          />
          <RHFField
            control={form.control}
            name="projectDescription"
            label={tp("fieldDescription")}
            optional
            render={(f) => <Textarea {...f} dir="auto" rows={3} />}
          />
          <RHFField
            control={form.control}
            name="priority"
            label={tp("fieldPriority")}
            render={(f) => (
              <Select<ProjectPriority>
                value={f.value}
                onValueChange={(v) => v && f.onChange(v)}
                options={PROJECT_PRIORITIES.map((p) => ({ value: p, label: tp(`priority.${p}`) }))}
                className="sm:max-w-xs"
              />
            )}
          />
        </section>
      ) : null}

      <section aria-labelledby="deal-customer" className="flex flex-col gap-4">
        <h3 id="deal-customer" className="text-title-sm text-fg">
          {t("customerSection")}
        </h3>
        {locked ? (
          customer ? (
            <Card padding="sm" className="flex flex-col gap-0.5">
              <span dir="auto" className="text-body font-semibold text-fg">
                {customer.fullName}
              </span>
              <span dir="auto" className="text-body-sm text-fg-muted">
                {customer.companyName}
              </span>
              <bdi dir="ltr" className="text-body-sm text-fg-muted">
                {customer.email}
              </bdi>
              <span className="text-caption text-fg-subtle">{t("customerLocked")}</span>
            </Card>
          ) : (
            <p className="text-body text-fg-muted">{t("customerLocked")}</p>
          )
        ) : (
          <>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<MagnifyingGlass />}
              placeholder={t("customerSearch")}
              aria-label={t("customerSearch")}
              className="sm:max-w-md"
            />
            {customers.isLoading ? (
              <div className="flex flex-col gap-2" aria-busy="true">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : customers.isError ? (
              <ErrorState size="compact" title={t("customersErrorTitle")} description={t("customersErrorBody")} onRetry={() => void customers.refetch()} />
            ) : list.length === 0 ? (
              <EmptyState size="compact" title={query ? t("customersNoMatch") : t("customersEmptyTitle")} description={query ? undefined : t("customersEmptyBody")} />
            ) : (
              <Field group label={t("customerLabel")} required error={customerError}>
                <RadioGroup
                  value={customerId ?? ""}
                  onValueChange={pick}
                  className="max-h-72 overflow-y-auto rounded-field border border-line p-3"
                  options={list.map((c) => ({
                    value: c.id,
                    label: (
                      <span dir="auto" className="font-semibold">
                        {c.fullName}
                      </span>
                    ),
                    description: (
                      <span className="flex flex-wrap gap-x-2">
                        <span dir="auto">{c.companyName}</span>
                        <bdi dir="ltr">{c.email}</bdi>
                      </span>
                    ),
                  }))}
                />
              </Field>
            )}
          </>
        )}

        <RHFField
          control={form.control}
          name="countryCode"
          label={t("countryLabel")}
          description={t("countryHint")}
          required
          render={(f) => (
            <Combobox
              value={f.value || null}
              onValueChange={(v) => f.onChange(v ?? "")}
              options={(countries.data?.data?.items ?? []).map((c) => ({ value: c.code, label: c.name, hint: c.code }))}
              placeholder={t("countryPlaceholder")}
              aria-label={t("countryLabel")}
              disabled={locked}
              className="sm:max-w-md"
            />
          )}
        />
      </section>
    </div>
  );
}
