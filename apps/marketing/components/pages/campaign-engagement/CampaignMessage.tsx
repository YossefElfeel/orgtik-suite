"use client";
import { useEffect, useRef } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  ErrorState,
  LoadingState,
  Select,
  SimulatedTag,
  Stat,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useEmailDesignsQuery,
  useMarketingBootstrapQuery,
  useMarketingCampaignQuery,
  useMarketingChangeMutation,
  useMarketingSendersQuery,
} from "@/redux/features/marketing-v3/marketingApi";
import { ButtonLink } from "@/components/shared/ButtonLink";
export default function CampaignMessage({ id }: { id: string }) {
  const t = useTranslations("MarketingV3"),
    f = useFormatter(),
    candidate = useMarketingCampaignQuery(id),
    bootstrap = useMarketingBootstrapQuery(),
    senders = useMarketingSendersQuery(),
    templates = useEmailDesignsQuery(),
    [change, state] = useMarketingChangeMutation(),
    operation = useRef<string | undefined>(undefined),
    form = useForm<{ senderId: string; templateId: string }>({
      resolver: zodResolver(
        z.object({
          senderId: z.string().min(1, t("required")),
          templateId: z.string().min(1, t("required")),
        }),
      ),
      defaultValues: { senderId: "", templateId: "" },
    }),
    senderId = form.watch("senderId"),
    deliveries =
      bootstrap.data?.campaigns
        .find((c) => c.id === id)
        ?.deliveries.filter((row) => row.mode === "local_mock") || [];
  useEffect(() => {
    if (candidate.data)
      form.reset({
        senderId: candidate.data.configuration.senderConfigId || "",
        templateId: candidate.data.configuration.templateId || "",
      });
  }, [candidate.data, form]);
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <h2 className="font-display text-title-sm">{t("message")}</h2>
      <p className="max-w-prose text-body-sm text-fg-muted">
        {t("providerDeferred")}
      </p>
      {senders.isError || templates.isError ? (
        <ErrorState
          title={t("loadError")}
          onRetry={() => {
            void senders.refetch();
            void templates.refetch();
          }}
        />
      ) : senders.isLoading || templates.isLoading ? (
        <LoadingState rows={3} />
      ) : (
        <>
          <ButtonLink
            className="self-start"
            href="/email-designer"
            variant="secondary"
          >
            {t("emailDesigner")}
          </ButtonLink>
          {candidate.data?.capabilities.canLead ? (
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={form.handleSubmit(async (body) => {
                try {
                  await change({
                    path: `/v3/campaigns/${encodeURIComponent(id)}/message`,
                    method: "PATCH",
                    body,
                  }).unwrap();
                } catch {}
              })}
            >
              <RHFField
                control={form.control}
                name="senderId"
                label={t("sender")}
                required
                render={(field) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("templateId", "");
                    }}
                    disabled={state.isLoading}
                    options={(senders.data || []).map((row) => ({
                      value: row.id,
                      label: row.name,
                    }))}
                  />
                )}
              />
              <RHFField
                control={form.control}
                name="templateId"
                label={t("template")}
                required
                render={(field) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={state.isLoading}
                    options={(templates.data || [])
                      .filter((row) => row.senderConfigId === senderId)
                      .map((row) => ({ value: row.id, label: row.name }))}
                  />
                )}
              />
              <Button type="submit" loading={state.isLoading}>
                {t("bindMessage")}
              </Button>
            </form>
          ) : null}
          <SimulatedTag />
          {!candidate.data?.capabilities.canSend ? (
            <p className="text-body-sm text-fg-muted">
              {t("approvedRequired")}
            </p>
          ) : (
            <Button
              className="self-start"
              loading={state.isLoading}
              disabled={
                form.formState.isDirty ||
                !candidate.data.configuration.templateId
              }
              onClick={async () => {
                try {
                  operation.current ||= crypto.randomUUID();
                  await change({
                    path: `/v3/campaigns/${encodeURIComponent(id)}/mock-delivery`,
                    method: "POST",
                    body: { operationId: operation.current },
                  }).unwrap();
                  operation.current = undefined;
                  void bootstrap.refetch();
                } catch {}
              }}
            >
              {t("delivery")}
            </Button>
          )}
          <ul className="divide-y divide-line">
            {deliveries.map((row, index) => (
              <li
                key={row.id || row.operationId || index}
                className="grid gap-4 py-4 sm:grid-cols-3"
              >
                <Stat label={t("delivered")} value={f.number(row.sent || 0)} />
                <Stat label={t("opened")} value={f.number(row.opened || 0)} />
                <Stat label={t("clicked")} value={f.number(row.clicked || 0)} />
                <p className="text-caption text-fg-muted sm:col-span-3">
                  {t("suppressed")}: {f.number(row.suppressed?.length || 0)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
