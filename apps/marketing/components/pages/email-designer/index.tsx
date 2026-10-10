"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  ErrorState,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Select,
  SimulatedTag,
  Textarea,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useEmailDesignsQuery,
  useMarketingBootstrapQuery,
  useMarketingChangeMutation,
  useMarketingSendersQuery,
} from "@/redux/features/marketing-v3/marketingApi";
import { emailSchema, templateSchema } from "@/schemas/marketing-v3";
import type { EmailDesign, NativeTemplate } from "@/types/marketing-v3";
import { useMarketingRoles } from "@/lib/permissions";
import { usePathname, useRouter } from "@/i18n/routing";
import { emailPreviewHtml } from "@/lib/marketing-v3";
import { downloadMarketingHtml } from "@/lib/documents";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
import { stripHtml } from "@/lib/campaigns/messaging/templates";
import { ButtonLink } from "@/components/shared/ButtonLink";
const empty: EmailDesign = {
  subject: "",
  headline: "",
  body: "",
  cta: "",
  ctaUrl: "",
  direction: "ltr",
  companyName: "",
  postalAddress: "",
  format: { bold: false, italic: false, bullets: false },
};
export default function EmailDesigner() {
  const t = useTranslations("MarketingV3"),
    locale = useLocale(),
    params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    can = useMarketingRoles(),
    query = useEmailDesignsQuery(),
    senders = useMarketingSendersQuery(),
    bootstrap = useMarketingBootstrapQuery(),
    [change, state] = useMarketingChangeMutation(),
    [downloadError, setDownloadError] = useState(false),
    form = useForm<EmailDesign>({
      resolver: zodResolver(emailSchema(t)),
      defaultValues: empty,
    }),
    create = useForm<{ name: string; senderId: string }>({
      resolver: zodResolver(templateSchema(t)),
      defaultValues: { name: "", senderId: "" },
    }),
    id = params.get("template") || query.data?.[0]?.id,
    selected = query.data?.find((row) => row.id === id),
    values = form.watch();
  useEffect(() => {
    if (selected) {
      const brand = bootstrap.data?.data?.brandKit,
        draft = bootstrap.data?.data?.drafts.find(
          (row) => row.id === params.get("draft"),
        );
      form.reset({
        ...empty,
        ...selected.design,
        subject: selected.subject || selected.name,
        headline:
          draft?.headline ||
          selected.design?.headline ||
          selected.subject ||
          selected.name,
        body: draft?.body || selected.design?.body || stripHtml(selected.body),
        companyName:
          selected.design?.companyName ||
          brand?.companyName ||
          bootstrap.data?.project?.name ||
          "",
        postalAddress:
          selected.design?.postalAddress || brand?.postalAddress || "",
        direction:
          draft?.locale === "ar" ? "rtl" : selected.design?.direction || "ltr",
      });
    }
  }, [selected, bootstrap.data, params, form]);
  const choose = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("template", value);
    next.delete("draft");
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
  const preview = emailPreviewHtml(values, locale, t("providerDeferred"));
  return (
    <MarketingProjectFrame title={t("emailDesigner")}>
      <SimulatedTag />
      {query.isError ? (
        <ErrorState
          title={t("loadError")}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <LoadingState rows={5} />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            {query.data?.length ? (
              <Field label={t("template")} className="min-w-60">
                <Select
                  value={id}
                  onValueChange={(value) => value && choose(value)}
                  options={query.data.map((row) => ({
                    value: row.id,
                    label: row.name,
                  }))}
                />
              </Field>
            ) : null}
            <ButtonLink href="/settings/senders" variant="secondary">
              {t("senders")}
            </ButtonLink>
          </div>
          {can.manageAudience ? (
            <form
              className="flex flex-wrap items-end gap-3 border-b border-line pb-5"
              onSubmit={create.handleSubmit(async (body) => {
                try {
                  const row = (await change({
                    path: "/v3/email-designs",
                    method: "POST",
                    body,
                  }).unwrap()) as NativeTemplate;
                  create.reset();
                  choose(row.id);
                } catch {}
              })}
            >
              <RHFField
                control={create.control}
                name="name"
                label={t("name")}
                required
                render={(field) => (
                  <Input {...field} dir="auto" disabled={state.isLoading} />
                )}
              />
              <RHFField
                control={create.control}
                name="senderId"
                label={t("sender")}
                required
                render={(field) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={state.isLoading}
                    options={(senders.data || []).map((row) => ({
                      value: row.id,
                      label: row.name,
                    }))}
                  />
                )}
              />
              <Button type="submit" loading={state.isLoading}>
                {t("newTemplate")}
              </Button>
            </form>
          ) : null}
          {!selected ? (
            <EmptyState
              title={t("empty")}
              action={
                <ButtonLink href="/settings/senders">
                  {t("newSender")}
                </ButtonLink>
              }
            />
          ) : (
            <div className="grid min-w-0 gap-6 xl:grid-cols-2">
              <form
                className="flex min-w-0 flex-col gap-4"
                onSubmit={form.handleSubmit(async (body) => {
                  try {
                    await change({
                      path: `/v3/email-designs/${encodeURIComponent(selected.id)}`,
                      method: "PATCH",
                      body: { ...body, locale },
                    }).unwrap();
                  } catch {}
                })}
              >
                {(
                  [
                    "subject",
                    "headline",
                    "body",
                    "cta",
                    "ctaUrl",
                    "companyName",
                    "postalAddress",
                  ] as const
                ).map((name) => (
                  <RHFField
                    key={name}
                    control={form.control}
                    name={name}
                    label={t(name)}
                    required={[
                      "subject",
                      "headline",
                      "body",
                      "companyName",
                      "postalAddress",
                    ].includes(name)}
                    render={(field) =>
                      name === "body" || name === "postalAddress" ? (
                        <Textarea
                          {...field}
                          dir="auto"
                          rows={name === "body" ? 8 : 3}
                          disabled={!can.manageAudience || state.isLoading}
                        />
                      ) : (
                        <Input
                          {...field}
                          dir={name === "ctaUrl" ? "ltr" : "auto"}
                          disabled={!can.manageAudience || state.isLoading}
                        />
                      )
                    }
                  />
                ))}
                <RHFField
                  control={form.control}
                  name="direction"
                  label={t("direction")}
                  render={(field) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!can.manageAudience || state.isLoading}
                      options={[
                        { value: "ltr", label: t("ltr") },
                        { value: "rtl", label: t("rtl") },
                      ]}
                    />
                  )}
                />
                <Field group label={t("body")}>
                  <div className="flex flex-wrap gap-4">
                    {(["bold", "italic", "bullets"] as const).map((name) => (
                      <Checkbox
                        key={name}
                        label={t(name)}
                        checked={values.format[name]}
                        disabled={!can.manageAudience || state.isLoading}
                        onCheckedChange={(value) =>
                          form.setValue(`format.${name}`, Boolean(value))
                        }
                      />
                    ))}
                  </div>
                </Field>
                {can.manageAudience ? (
                  <Button
                    type="submit"
                    className="self-start"
                    loading={state.isLoading}
                  >
                    {t("save")}
                  </Button>
                ) : null}
              </form>
              <section className="min-w-0">
                <h2 className="mb-3 font-display text-title-sm">
                  {t("preview")}
                </h2>
                <iframe
                  title={t("preview")}
                  sandbox=""
                  srcDoc={preview}
                  className="h-[640px] w-full rounded-card border border-line bg-raised"
                />
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => {
                    setDownloadError(false);
                    void downloadMarketingHtml(
                      `/v3/email-designs/${encodeURIComponent(selected.id)}/export`,
                      `Email-${selected.id}.html`,
                    ).catch(() => setDownloadError(true));
                  }}
                >
                  {t("exportHtml")}
                </Button>
                {downloadError ? (
                  <p role="alert" className="mt-3 text-body-sm text-danger">
                    {t("loadError")}
                  </p>
                ) : null}
              </section>
            </div>
          )}
        </>
      )}
    </MarketingProjectFrame>
  );
}
